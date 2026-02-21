/**
 * Agenda.js Scheduler — MongoDB-backed job queue
 *
 * Uses the existing MongoDB connection (MONGODB_URI) as the job store,
 * so scheduled jobs survive server restarts.
 *
 * Install: npm install agenda
 *
 * Jobs defined:
 *   - "rescrape-github": Re-fetch GitHub repos + re-run skill pipeline for one user
 *   - "rescrape-linkedin": Re-sync LinkedIn profile for one user
 *
 * Usage:
 *   import { getScheduler, scheduleUserRescrape } from "@/lib/scheduler";
 *   await scheduleUserRescrape(userId);
 */

import Agenda from "agenda";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import { runRescrapeForUser } from "@/lib/githubWebhook";
import { syncLinkedInProfile } from "@/lib/linkedinSync";
import { LinkedInProfile } from "@/mongodb/models/linkedInProfile";

// ---------------------------------------------------------------------------
// Singleton — one Agenda instance per process
// ---------------------------------------------------------------------------

let agendaInstance: Agenda | null = null;

/**
 * Returns the shared Agenda instance, creating and starting it on first call.
 * Safe to call multiple times (singleton pattern).
 */
export async function getScheduler(): Promise<Agenda> {
  if (agendaInstance) return agendaInstance;

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI environment variable is not set");

  // Ensure Mongoose is connected before Agenda tries to use the DB
  await connectDB();

  const agenda = new Agenda({
    db: { address: mongoUri, collection: "agendaJobs" },
    processEvery: "1 minute",
    maxConcurrency: 5,
  });

  // -------------------------------------------------------------------------
  // Job: rescrape-github
  // -------------------------------------------------------------------------

  /**
   * Re-scrape a user's GitHub profile and re-run the skill pipeline.
   * Triggered by the 7-day schedule or manually via the admin endpoint.
   */
  agenda.define(
    "rescrape-github",
    { priority: "low", concurrency: 3 },
    async (job) => {
      const { userId } = job.attrs.data as { userId: string };
      console.log(`[scheduler] Running rescrape-github for user ${userId}`);
      await runRescrapeForUser(userId, "schedule");
    }
  );

  // -------------------------------------------------------------------------
  // Job: rescrape-linkedin
  // -------------------------------------------------------------------------

  /**
   * Re-sync a user's LinkedIn profile.
   * Runs every 7 days, staggered per user.
   */
  agenda.define(
    "rescrape-linkedin",
    { priority: "low", concurrency: 2 },
    async (job) => {
      const { userId } = job.attrs.data as { userId: string };
      console.log(`[scheduler] Running rescrape-linkedin for user ${userId}`);

      const profile = await LinkedInProfile.findOne({ userId }).lean() as any;
      if (!profile?.linkedinUrl) {
        console.warn(`[scheduler] No LinkedIn URL stored for user ${userId}`);
        return;
      }

      await syncLinkedInProfile(userId, profile.linkedinUrl, "schedule");
    }
  );

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------

  agenda.on("fail", (err, job) => {
    console.error(`[scheduler] Job ${job.attrs.name} failed:`, err.message);
  });

  await agenda.start();
  agendaInstance = agenda;

  console.log("[scheduler] Agenda started");
  return agenda;
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/**
 * Schedule a 7-day re-scrape for a user.
 *
 * Staggered randomly within a 24-hour window (based on userId hash) to
 * avoid thundering-herd on the GitHub API rate limits.
 *
 * @param userId - Clerk user ID
 * @param delayMs - Override delay in ms (defaults to 7 days + random stagger)
 */
export async function scheduleUserRescrape(
  userId: string,
  delayMs?: number
): Promise<void> {
  const agenda = await getScheduler();

  // Deterministic stagger: 0–23 hours based on userId character codes
  const staggerHours =
    userId
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0) % 24;

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const staggerMs = staggerHours * 60 * 60 * 1000;
  const scheduledAt = new Date(Date.now() + (delayMs ?? sevenDaysMs + staggerMs));

  // Cancel any existing pending job for this user before scheduling a new one
  await agenda.cancel({ name: "rescrape-github", "data.userId": userId });
  await agenda.schedule(scheduledAt, "rescrape-github", { userId });

  console.log(
    `[scheduler] Scheduled rescrape-github for ${userId} at ${scheduledAt.toISOString()}`
  );
}

/**
 * Schedule a 7-day LinkedIn re-sync for a user.
 *
 * @param userId - Clerk user ID
 */
export async function scheduleLinkedInRescrape(userId: string): Promise<void> {
  const agenda = await getScheduler();

  const staggerHours =
    (userId
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      24) +
    12; // offset from GitHub stagger

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const staggerMs = (staggerHours % 24) * 60 * 60 * 1000;
  const scheduledAt = new Date(Date.now() + sevenDaysMs + staggerMs);

  await agenda.cancel({ name: "rescrape-linkedin", "data.userId": userId });
  await agenda.schedule(scheduledAt, "rescrape-linkedin", { userId });

  console.log(
    `[scheduler] Scheduled rescrape-linkedin for ${userId} at ${scheduledAt.toISOString()}`
  );
}

/**
 * Immediately trigger a GitHub re-scrape for a user (admin/testing use).
 *
 * @param userId - Clerk user ID
 */
export async function triggerImmediateRescrape(userId: string): Promise<void> {
  const agenda = await getScheduler();
  await agenda.now("rescrape-github", { userId });
  console.log(`[scheduler] Immediately triggered rescrape-github for ${userId}`);
}

/**
 * Bootstrap the scheduler on server startup.
 *
 * Call this from a Next.js instrumentation file (instrumentation.ts)
 * or from the first API request. Safe to call multiple times.
 *
 * Also schedules 7-day re-scrapes for all existing users who don't have
 * a pending job yet.
 */
export async function bootstrapScheduler(): Promise<void> {
  const agenda = await getScheduler();

  // Schedule missing jobs for all existing users
  const users = await User.find({}, { userId: 1 }).lean() as any[];
  for (const user of users) {
    const existingJob = await agenda.jobs({
      name: "rescrape-github",
      "data.userId": user.userId,
      nextRunAt: { $gt: new Date() },
    });

    if (existingJob.length === 0) {
      await scheduleUserRescrape(user.userId);
    }
  }

  console.log(
    `[scheduler] Bootstrap complete — ${users.length} users checked for pending jobs`
  );
}
