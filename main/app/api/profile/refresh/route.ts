/**
 * POST /api/profile/refresh
 *
 * Manually trigger a GitHub re-scrape for the authenticated user.
 * Priority: MEDIUM (user-initiated, runs faster than the 7-day schedule).
 *
 * Rate-limited to once per 10 minutes per user to prevent abuse.
 */

import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { ScrapeJob } from "@/mongodb/models/scrapeJob";
import { User } from "@/mongodb/models/user";
import { runRescrapeForUser } from "@/lib/githubWebhook";

export async function POST(): Promise<NextResponse> {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Rate limit: check if a job ran in the last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentJob = await ScrapeJob.findOne({
      userId: clerkUser.id,
      jobType: "github",
      triggeredBy: "user",
      createdAt: { $gte: tenMinutesAgo },
    }).lean();

    if (recentJob) {
      const nextAllowedAt = new Date(
        (recentJob as any).createdAt.getTime() + 10 * 60 * 1000
      );
      return NextResponse.json(
        {
          error: "Rate limited — you can refresh once every 10 minutes",
          nextAllowedAt: nextAllowedAt.toISOString(),
        },
        { status: 429 }
      );
    }

    const dbUser = await User.findOne({ userId: clerkUser.id }).lean() as any;
    if (!dbUser?.githubUsername) {
      return NextResponse.json(
        { error: "No GitHub username linked. Add it in Settings first." },
        { status: 400 }
      );
    }

    // Create a pending job record
    const job = await ScrapeJob.create({
      userId: clerkUser.id,
      jobType: "github",
      status: "pending",
      scheduledAt: new Date(),
      triggeredBy: "user",
    });

    // Fire-and-forget
    setImmediate(() => {
      runRescrapeForUser(clerkUser.id, "user").catch((err) => {
        console.error("[profile/refresh] Background rescrape failed:", err);
      });
    });

    return NextResponse.json({
      ok: true,
      message: "Profile refresh started. Check back in a few seconds.",
      jobId: job._id.toString(),
    });
  } catch (err) {
    console.error("[profile/refresh] POST error:", err);
    return NextResponse.json(
      { error: "Failed to start refresh" },
      { status: 500 }
    );
  }
}
