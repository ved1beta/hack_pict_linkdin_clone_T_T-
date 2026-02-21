/**
 * GitHub Webhook Utilities
 *
 * Handles:
 *  - Webhook signature verification (HMAC-SHA256)
 *  - Registering/deleting repo-level webhooks via GitHub REST API
 *  - Determining whether a webhook payload represents a "meaningful" change
 *  - Orchestrating the async background re-analysis pipeline
 */

import crypto from "crypto";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import { WebhookRegistration } from "@/mongodb/models/webhookRegistration";
import { ScrapeJob } from "@/mongodb/models/scrapeJob";
import { ProfileUpdateHistory } from "@/mongodb/models/profileUpdateHistory";
import { Notification } from "@/mongodb/models/notification";
import { VerifiedSkill } from "@/mongodb/models/verifiedSkill";
import { GitRepo } from "@/mongodb/models/gitRepo";
import {
  buildVerifiedSkillsForUser,
  RepoBrief,
} from "@/lib/skillVerification";

const GITHUB_API = "https://api.github.com";

function githubHeaders(token: string): HeadersInit {
  return {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "HEXjuy-Career-Platform",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

// ---------------------------------------------------------------------------
// Signature verification
// ---------------------------------------------------------------------------

/**
 * Verify a GitHub webhook signature.
 *
 * GitHub signs each payload with HMAC-SHA256 using your secret and sends
 * the result in the X-Hub-Signature-256 header.
 *
 * @param rawBody - The raw request body as a UTF-8 string
 * @param signatureHeader - Value of the X-Hub-Signature-256 header
 * @param secret - The HMAC secret used when the webhook was registered
 * @returns true if the signature matches, false otherwise
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
): boolean {
  if (!signatureHeader.startsWith("sha256=")) return false;
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Webhook registration
// ---------------------------------------------------------------------------

/**
 * Register a webhook on a specific GitHub repository.
 *
 * Uses the user's OAuth token (not the global GITHUB_TOKEN) because creating
 * webhooks is a write operation that requires the user's own auth.
 *
 * Handles the "422 – hook already exists" case gracefully (idempotent).
 *
 * @param githubToken - The user's GitHub OAuth token (from Clerk)
 * @param owner - Repo owner's GitHub username
 * @param repoName - Repository name
 * @param webhookUrl - Public URL where GitHub should POST events
 * @param secret - HMAC secret for this webhook
 * @param events - GitHub events to subscribe to
 * @returns The newly created hook ID, or the existing hook ID if already registered
 */
export async function registerRepoWebhook(
  githubToken: string,
  owner: string,
  repoName: string,
  webhookUrl: string,
  secret: string,
  events: string[] = ["push", "create", "public", "repository"]
): Promise<number | null> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repoName}/hooks`,
    {
      method: "POST",
      headers: githubHeaders(githubToken),
      body: JSON.stringify({
        name: "web",
        active: true,
        events,
        config: {
          url: webhookUrl,
          content_type: "json",
          secret,
          insecure_ssl: "0",
        },
      }),
    }
  );

  if (res.status === 201) {
    const data = await res.json();
    return data.id as number;
  }

  if (res.status === 422) {
    // Hook already exists — fetch existing hooks to find the ID
    const listRes = await fetch(
      `${GITHUB_API}/repos/${owner}/${repoName}/hooks`,
      { headers: githubHeaders(githubToken) }
    );
    if (listRes.ok) {
      const hooks: any[] = await listRes.json();
      const existing = hooks.find(
        (h) => h.config?.url === webhookUrl
      );
      if (existing) return existing.id as number;
    }
    return null;
  }

  const errText = await res.text();
  console.error(
    `[githubWebhook] Failed to register webhook on ${owner}/${repoName}: ${res.status} ${errText}`
  );
  return null;
}

/**
 * Delete a webhook from a GitHub repository.
 *
 * Called when a user unlinks their GitHub account.
 *
 * @param githubToken - The user's GitHub OAuth token
 * @param owner - Repo owner's GitHub username
 * @param repoName - Repository name
 * @param hookId - The GitHub hook ID to delete
 * @returns true if deleted, false on error
 */
export async function deleteRepoWebhook(
  githubToken: string,
  owner: string,
  repoName: string,
  hookId: number
): Promise<boolean> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repoName}/hooks/${hookId}`,
    {
      method: "DELETE",
      headers: githubHeaders(githubToken),
    }
  );
  return res.status === 204;
}

/**
 * Register webhooks on all of a user's stored repos.
 * Stores registration metadata in the WebhookRegistration collection.
 *
 * @param userId - Clerk user ID
 * @param githubToken - User's GitHub OAuth token
 * @param baseUrl - Public base URL of the application (e.g. "https://example.com")
 */
export async function registerWebhooksForUser(
  userId: string,
  githubToken: string,
  baseUrl: string
): Promise<void> {
  await connectDB();

  const repos = await GitRepo.find({ userId }).lean();
  if (repos.length === 0) return;

  const webhookUrl = `${baseUrl}/api/webhooks/github`;
  const events = ["push", "create", "public", "repository"];

  for (const repo of repos as any[]) {
    // One unique secret per webhook
    const secret = crypto.randomBytes(24).toString("hex");

    try {
      const hookId = await registerRepoWebhook(
        githubToken,
        repo.owner,
        repo.repoName,
        webhookUrl,
        secret,
        events
      );

      if (hookId !== null) {
        await WebhookRegistration.findOneAndUpdate(
          { repoOwner: repo.owner, repoName: repo.repoName },
          {
            userId,
            repoOwner: repo.owner,
            repoName: repo.repoName,
            webhookId: hookId,
            secret,
            events,
            active: true,
          },
          { upsert: true, new: true }
        );
      }
    } catch (err) {
      console.error(
        `[githubWebhook] Error registering webhook for ${repo.owner}/${repo.repoName}:`,
        err
      );
    }
  }
}

/**
 * Remove all webhooks for a user (called on GitHub unlink).
 *
 * @param userId - Clerk user ID
 * @param githubToken - User's GitHub OAuth token
 */
export async function removeWebhooksForUser(
  userId: string,
  githubToken: string
): Promise<void> {
  await connectDB();

  const registrations = await WebhookRegistration.find({
    userId,
    active: true,
  }).lean();

  for (const reg of registrations as any[]) {
    try {
      await deleteRepoWebhook(
        githubToken,
        reg.repoOwner,
        reg.repoName,
        reg.webhookId
      );
      await WebhookRegistration.findByIdAndUpdate(reg._id, { active: false });
    } catch (err) {
      console.error(
        `[githubWebhook] Error deleting webhook ${reg.webhookId}:`,
        err
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Meaningful change detection
// ---------------------------------------------------------------------------

/**
 * Determine if a webhook payload represents a change worth re-analysing.
 *
 * Avoids calling Groq on every trivial ping/push event.
 *
 * Meaningful:
 *  - A new repository was made public
 *  - A new branch was created on a tracked repo
 *  - A push happened (new commits)
 *  - Repository description/topics changed (future: check stars via cron)
 *
 * @returns true if the pipeline should be triggered
 */
export function isMeaningfulChange(
  event: string,
  payload: Record<string, unknown>
): boolean {
  switch (event) {
    case "push":
      // Always re-analyse on push (new commits = new data)
      return true;
    case "create":
      // New branch or tag created
      return payload.ref_type === "branch" || payload.ref_type === "repository";
    case "public":
      // Repo made public
      return true;
    case "repository":
      // Repo created, renamed, or deleted
      return ["created", "publicized"].includes(payload.action as string);
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Async re-analysis pipeline
// ---------------------------------------------------------------------------

/**
 * Run the full skill re-analysis pipeline for a user.
 *
 * Called asynchronously after receiving a webhook (fire-and-forget from the
 * route handler). Updates skills in MongoDB and creates a notification if
 * meaningful changes were detected.
 *
 * @param userId - Clerk user ID
 * @param triggeredBy - What triggered this run ("webhook" | "schedule" | "user" | "admin")
 */
export async function runRescrapeForUser(
  userId: string,
  triggeredBy: "webhook" | "schedule" | "user" | "admin" = "webhook"
): Promise<void> {
  await connectDB();

  // Create a ScrapeJob record to track this run
  const job = await ScrapeJob.create({
    userId,
    jobType: "github",
    status: "running",
    startedAt: new Date(),
    triggeredBy,
  });

  try {
    const dbUser = await User.findOne({ userId }).lean() as any;
    if (!dbUser?.githubUsername) {
      await ScrapeJob.findByIdAndUpdate(job._id, {
        status: "failed",
        completedAt: new Date(),
        errorMessage: "No GitHub username set for user",
      });
      return;
    }

    // Fetch user's stored repos
    const repos = await GitRepo.find({ userId }).lean() as any[];
    if (repos.length === 0) {
      await ScrapeJob.findByIdAndUpdate(job._id, {
        status: "completed",
        completedAt: new Date(),
        changesFound: false,
      });
      return;
    }

    const repoBriefs: RepoBrief[] = repos.map((r) => ({
      owner: r.owner,
      repoName: r.repoName,
    }));

    // Load existing skills for SHA-based Groq caching
    const existingSkills = await VerifiedSkill.find({ userId }).lean() as any[];

    // Run the full skill pipeline
    const newSkillData = await buildVerifiedSkillsForUser(
      dbUser.githubUsername,
      repoBriefs,
      existingSkills.map((s) => ({
        skillName: s.skillName,
        evidence: {
          readmeSha: s.evidence?.readmeSha,
          groqDescription: s.evidence?.groqDescription,
        },
      }))
    );

    // Diff against existing skills to identify what changed
    const existingMap = new Map(existingSkills.map((s) => [s.skillName, s]));
    const skillsAdded: string[] = [];
    const skillsStrengthened: Array<{
      skillName: string;
      previousScore: number;
      newScore: number;
    }> = [];

    // Upsert each skill
    for (const skill of newSkillData) {
      const prev = existingMap.get(skill.skillName);

      await VerifiedSkill.findOneAndUpdate(
        { userId, skillName: skill.skillName },
        {
          userId,
          skillName: skill.skillName,
          verified: skill.verified,
          evidence: skill.evidence,
          confidenceScore: skill.confidenceScore,
          displayLabel: skill.displayLabel,
          source: skill.source,
          verifiedAt: skill.verified ? new Date() : undefined,
          lastUpdated: new Date(),
        },
        { upsert: true, new: true }
      );

      if (!prev) {
        skillsAdded.push(skill.skillName);
      } else if (skill.confidenceScore > prev.confidenceScore + 3) {
        skillsStrengthened.push({
          skillName: skill.skillName,
          previousScore: prev.confidenceScore,
          newScore: skill.confidenceScore,
        });
      }
    }

    const changesFound = skillsAdded.length > 0 || skillsStrengthened.length > 0;

    // Log history
    await ProfileUpdateHistory.create({
      userId,
      updateType: triggeredBy === "webhook" ? "github_webhook" : "scheduled_rescrape",
      changesDetected: {
        reposAnalyzed: repos.length,
        totalSkillsDetected: newSkillData.length,
      },
      skillsAdded,
      skillsStrengthened,
      triggeredBy,
      reposScraped: repos.length,
    });

    // Update user's last sync timestamp
    await User.findOneAndUpdate(
      { userId },
      { $set: { lastGithubSynced: new Date() } }
    );

    // Notify user if something changed
    if (changesFound) {
      const parts: string[] = [];
      if (skillsAdded.length > 0)
        parts.push(`${skillsAdded.length} new skill${skillsAdded.length !== 1 ? "s" : ""} verified`);
      if (skillsStrengthened.length > 0)
        parts.push(`${skillsStrengthened.length} skill${skillsStrengthened.length !== 1 ? "s" : ""} strengthened`);

      await Notification.create({
        userId,
        message: `Your profile was updated — ${parts.join(", ")}`,
        type: "profile_update",
        read: false,
        metadata: { skillsAdded, skillsStrengthened },
      });
    }

    await ScrapeJob.findByIdAndUpdate(job._id, {
      status: "completed",
      completedAt: new Date(),
      changesFound,
    });
  } catch (err) {
    console.error("[githubWebhook] runRescrapeForUser error:", err);
    await ScrapeJob.findByIdAndUpdate(job._id, {
      status: "failed",
      completedAt: new Date(),
      errorMessage: err instanceof Error ? err.message : String(err),
    });
  }
}
