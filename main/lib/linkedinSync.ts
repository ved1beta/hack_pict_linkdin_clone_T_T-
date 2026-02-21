/**
 * LinkedIn Sync Service — No credentials required
 *
 * Scrapes LinkedIn public profiles via:
 *   1. Proxycurl API (best, ~$0.01/profile, optional)
 *   2. Cheerio scraper (free, limited by LinkedIn bot detection)
 *
 * User provides LinkedIn URL → System scrapes → Groq parses experience
 * into structured { company, role, duration, tech_used, impact_description }
 *
 * No webhooks, no OAuth, no app credentials needed.
 */

import * as cheerio from "cheerio";
import Groq from "groq-sdk";
import connectDB from "@/mongodb/db";
import { LinkedInProfile, ILinkedInExperience } from "@/mongodb/models/linkedInProfile";
import { ProfileUpdateHistory } from "@/mongodb/models/profileUpdateHistory";
import { Notification } from "@/mongodb/models/notification";

let groq: Groq | null = null;

function getGroqClient(): Groq {
  if (!groq) {
    groq = new Groq({
      apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY,
    });
  }
  return groq;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RawLinkedInData {
  headline?: string;
  currentCompany?: string;
  currentRole?: string;
  location?: string;
  profilePicture?: string;
  aboutText?: string;
  educationRaw?: string;
  experienceRaw?: string;
  skillsListed?: string[];
  certifications?: Array<{ name: string; issuer?: string; date?: string }>;
}

export interface ParsedExperience {
  company: string;
  role: string;
  duration: string;
  tech_used: string[];
  impact_description: string;
}

// ---------------------------------------------------------------------------
// Groq-powered experience parser
// ---------------------------------------------------------------------------

/**
 * Parse unstructured LinkedIn "about" and "experience" text into structured entities.
 * Called at most once per sync (not per skill).
 *
 * @param aboutText - LinkedIn "About" section text
 * @param experienceText - Raw experience section text
 * @returns Array of structured work experience entries
 */
export async function parseExperienceWithGroq(
  aboutText: string,
  experienceText: string
): Promise<ParsedExperience[]> {
  const combined = [
    aboutText ? `ABOUT:\n${aboutText.slice(0, 800)}` : "",
    experienceText ? `EXPERIENCE:\n${experienceText.slice(0, 800)}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  if (!combined.trim()) return [];

  try {
    const completion = await getGroqClient().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `Extract structured work experience from this LinkedIn profile text.

${combined}

Respond with ONLY valid JSON (array of objects, no markdown):
[{"company":"string","role":"string","duration":"string","tech_used":["string"],"impact_description":"string"}]

If no experience is found, return [].`,
        },
      ],
      max_tokens: 600,
    });

    const raw = completion.choices[0]?.message?.content || "[]";
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}


// ---------------------------------------------------------------------------
// Approach B: URL-based enrichment
// ---------------------------------------------------------------------------

/**
 * Fetch LinkedIn profile data via Proxycurl API.
 *
 * @param linkedinUrl - Public LinkedIn profile URL
 * @returns Raw profile data or null if Proxycurl is unavailable
 */
async function fetchViaProxycurl(
  linkedinUrl: string
): Promise<RawLinkedInData | null> {
  const apiKey = process.env.PROXYCURL_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(
    `https://nubela.co/proxycurl/api/v2/linkedin?url=${encodeURIComponent(
      linkedinUrl
    )}&use_cache=if-present`,
    {
      headers: { Authorization: `Bearer ${apiKey}` },
    }
  );

  if (!res.ok) {
    console.warn(
      `[linkedinSync] Proxycurl returned ${res.status} for ${linkedinUrl}`
    );
    return null;
  }

  const data = await res.json();

  const experiences: string[] = (data.experiences || []).map(
    (e: any) =>
      `${e.title || ""} at ${e.company || ""} (${e.starts_at?.year || ""}–${
        e.ends_at?.year || "present"
      }): ${e.description || ""}`
  );

  const educations = (data.education || []).map((e: any) => ({
    school: e.school || "",
    degree: e.degree_name || "",
    field: e.field_of_study || "",
    startYear: e.starts_at?.year,
    endYear: e.ends_at?.year,
  }));

  const certifications = (data.certifications || []).map((c: any) => ({
    name: c.name || "",
    issuer: c.authority || "",
    date: c.starts_at ? `${c.starts_at.year}` : "",
  }));

  return {
    headline: data.headline || "",
    currentCompany: data.experiences?.[0]?.company || "",
    currentRole: data.experiences?.[0]?.title || "",
    location: data.city
      ? `${data.city}, ${data.country_full_name || ""}`
      : data.country_full_name || "",
    profilePicture: data.profile_pic_url || "",
    aboutText: data.summary || "",
    experienceRaw: experiences.join("\n"),
    skillsListed: (data.skills || []).map((s: any) =>
      typeof s === "string" ? s : s.name || ""
    ),
    certifications,
  };
}

/**
 * Fallback: scrape LinkedIn public URL with cheerio.
 *
 * NOTE: LinkedIn heavily blocks bots. This works only for truly public
 * profiles and may return empty results in production. Use Proxycurl
 * in production environments.
 *
 * @param linkedinUrl - Public LinkedIn URL
 * @returns Partial raw data extracted from HTML
 */
async function fetchViaCheerio(
  linkedinUrl: string
): Promise<RawLinkedInData | null> {
  try {
    const res = await fetch(linkedinUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; HEXjuyBot/1.0; +https://hexjuy.app)",
        Accept: "text/html",
      },
      redirect: "follow",
    });

    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    const headline =
      $('meta[property="og:description"]').attr("content") ||
      $(".top-card-layout__headline").text().trim() ||
      "";

    const name =
      $('meta[property="og:title"]').attr("content") ||
      $(".top-card-layout__title").text().trim() ||
      "";

    const profilePicture =
      $('meta[property="og:image"]').attr("content") || "";

    return {
      headline,
      aboutText: name,
      profilePicture,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main sync entry point
// ---------------------------------------------------------------------------

/**
 * Sync a user's LinkedIn profile from a public URL.
 *
 * Tries Proxycurl first, falls back to cheerio scraping.
 * Passes raw text through Groq to extract structured experience.
 * Saves structured data to the LinkedInProfile collection.
 * Creates a Notification if changes are detected.
 *
 * @param userId - Clerk user ID
 * @param linkedinUrl - The user's LinkedIn public URL
 * @param triggeredBy - What initiated this sync
 * @returns true if sync succeeded
 */
export async function syncLinkedInProfile(
  userId: string,
  linkedinUrl: string,
  triggeredBy: "user" | "schedule" | "admin" = "user"
): Promise<boolean> {
  await connectDB();

  let rawData: RawLinkedInData | null = null;

  // Try Proxycurl first
  rawData = await fetchViaProxycurl(linkedinUrl);

  // Fall back to cheerio
  if (!rawData) {
    rawData = await fetchViaCheerio(linkedinUrl);
  }

  if (!rawData) {
    console.warn(`[linkedinSync] Could not fetch LinkedIn data for ${linkedinUrl}`);
    return false;
  }

  // Parse experience with Groq (only if we have raw text)
  let structuredExperience: ParsedExperience[] = [];
  if (rawData.aboutText || rawData.experienceRaw) {
    structuredExperience = await parseExperienceWithGroq(
      rawData.aboutText || "",
      rawData.experienceRaw || ""
    );
  }

  // Load existing profile for change detection
  const existing = await LinkedInProfile.findOne({ userId }).lean() as any;

  const updatedProfile = await LinkedInProfile.findOneAndUpdate(
    { userId },
    {
      userId,
      headline: rawData.headline || existing?.headline || "",
      currentCompany:
        rawData.currentCompany ||
        structuredExperience[0]?.company ||
        existing?.currentCompany ||
        "",
      currentRole:
        rawData.currentRole ||
        structuredExperience[0]?.role ||
        existing?.currentRole ||
        "",
      location: rawData.location || existing?.location || "",
      profilePicture: rawData.profilePicture || existing?.profilePicture || "",
      aboutText: rawData.aboutText || existing?.aboutText || "",
      experience:
        structuredExperience.length > 0
          ? structuredExperience
          : existing?.experience || [],
      certifications:
        rawData.certifications?.length
          ? rawData.certifications
          : existing?.certifications || [],
      skillsListed:
        rawData.skillsListed?.length
          ? rawData.skillsListed
          : existing?.skillsListed || [],
      linkedinUrl,
      scrapedAt: new Date(),
      source: "url",
    },
    { upsert: true, new: true }
  );

  // Detect meaningful changes
  const changes: Record<string, unknown> = {};
  if (existing) {
    if (existing.currentCompany !== updatedProfile.currentCompany)
      changes.companyChanged = {
        from: existing.currentCompany,
        to: updatedProfile.currentCompany,
      };
    if (existing.headline !== updatedProfile.headline)
      changes.headlineChanged = {
        from: existing.headline,
        to: updatedProfile.headline,
      };
    const newCerts = (updatedProfile.certifications || []).length;
    const oldCerts = (existing.certifications || []).length;
    if (newCerts > oldCerts)
      changes.newCertifications = newCerts - oldCerts;
  }

  const changesFound = Object.keys(changes).length > 0;

  await ProfileUpdateHistory.create({
    userId,
    updateType: "linkedin_sync",
    changesDetected: changes,
    skillsAdded: rawData.skillsListed?.slice(0, 5) || [],
    skillsStrengthened: [],
    triggeredBy,
  });

  if (changesFound) {
    await Notification.create({
      userId,
      message: "Your LinkedIn profile was synced and updated",
      type: "profile_update",
      read: false,
      metadata: changes,
    });
  }

  return true;
}

