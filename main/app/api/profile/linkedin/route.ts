/**
 * POST /api/profile/linkedin
 *
 * Submit a LinkedIn public URL for scraping and structured data extraction.
 * Also updates the githubUsername on the User document if provided.
 *
 * Body: { linkedinUrl: string }
 *
 * The scrape runs in the background — the endpoint responds immediately.
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import { ScrapeJob } from "@/mongodb/models/scrapeJob";
import { syncLinkedInProfile } from "@/lib/linkedinSync";
import { scheduleLinkedInRescrape } from "@/lib/scheduler";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { linkedinUrl } = await req.json();
    if (!linkedinUrl || typeof linkedinUrl !== "string") {
      return NextResponse.json(
        { error: "linkedinUrl is required" },
        { status: 400 }
      );
    }

    // Basic URL validation — must look like a LinkedIn profile URL
    const cleanUrl = linkedinUrl.trim();
    if (!cleanUrl.includes("linkedin.com/in/")) {
      return NextResponse.json(
        { error: "URL must be a LinkedIn profile URL (linkedin.com/in/...)" },
        { status: 400 }
      );
    }

    await connectDB();

    // Save the URL on the user document
    await User.findOneAndUpdate(
      { userId: clerkUser.id },
      { $set: { linkedInUrl: cleanUrl } }
    );

    // Create a ScrapeJob to track this
    const job = await ScrapeJob.create({
      userId: clerkUser.id,
      jobType: "linkedin",
      status: "pending",
      scheduledAt: new Date(),
      triggeredBy: "user",
    });

    // Fire-and-forget background sync
    setImmediate(async () => {
      await ScrapeJob.findByIdAndUpdate(job._id, {
        status: "running",
        startedAt: new Date(),
      });

      const success = await syncLinkedInProfile(clerkUser.id, cleanUrl, "user");

      await ScrapeJob.findByIdAndUpdate(job._id, {
        status: success ? "completed" : "failed",
        completedAt: new Date(),
        changesFound: success,
        errorMessage: success ? undefined : "Scraping returned no data",
      });

      // Schedule future 7-day re-scrapes
      if (success) {
        await scheduleLinkedInRescrape(clerkUser.id).catch(console.error);
      }
    });

    return NextResponse.json({
      ok: true,
      message: "LinkedIn sync started in background",
      jobId: job._id.toString(),
    });
  } catch (err) {
    console.error("[profile/linkedin] POST error:", err);
    return NextResponse.json(
      { error: "Failed to start LinkedIn sync" },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Import here to avoid circular dependency issues
    const { LinkedInProfile } = await import("@/mongodb/models/linkedInProfile");

    const profile = await LinkedInProfile.findOne({
      userId: clerkUser.id,
    }).lean();

    return NextResponse.json({ profile });
  } catch (err) {
    console.error("[profile/linkedin] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch LinkedIn profile" },
      { status: 500 }
    );
  }
}
