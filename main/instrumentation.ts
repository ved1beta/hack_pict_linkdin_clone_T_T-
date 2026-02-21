/**
 * Next.js Instrumentation — runs once when the server starts.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * We use this to bootstrap the Agenda.js scheduler so that 7-day
 * re-scrape jobs are registered as soon as the server is up.
 *
 * This file is intentionally kept minimal. All scheduler logic lives
 * in lib/scheduler.ts.
 */

export async function register() {
  // Only run in Node.js runtime (not Edge), and only on the server
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // TODO: Uncomment after verifying the rest of the app works
    /*
    const { bootstrapScheduler } = await import("@/lib/scheduler");
    await bootstrapScheduler().catch((err) => {
      console.error("[instrumentation] Scheduler bootstrap failed:", err);
      // Non-fatal — the app still starts, jobs just won't run automatically
    });
    */
  }
}
