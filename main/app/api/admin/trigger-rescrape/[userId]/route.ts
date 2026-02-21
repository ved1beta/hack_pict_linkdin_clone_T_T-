/**
 * POST /api/admin/trigger-rescrape/[userId]
 *
 * Manually trigger an immediate GitHub re-scrape for a specific user.
 * Protected by ADMIN_SECRET header.
 *
 * Usage:
 *   curl -X POST http://localhost:3000/api/admin/trigger-rescrape/user_abc123 \
 *        -H "x-admin-secret: your_admin_secret"
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import { triggerImmediateRescrape } from "@/lib/scheduler";
import { runRescrapeForUser } from "@/lib/githubWebhook";

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
): Promise<NextResponse> {
  // Verify admin secret
  const adminSecret =
    req.headers.get("x-admin-secret") ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = params;
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  await connectDB();

  const user = await User.findOne({ userId }).lean() as any;
  if (!user) {
    return NextResponse.json(
      { error: `User ${userId} not found` },
      { status: 404 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const useScheduler = body?.useScheduler !== false; // Default: use scheduler

  if (useScheduler) {
    // Queue via Agenda for proper async handling
    await triggerImmediateRescrape(userId);
    return NextResponse.json({
      ok: true,
      message: `Rescrape queued via scheduler for user ${userId} (${user.firstName} ${user.lastName})`,
      userId,
    });
  } else {
    // Run synchronously for debugging — blocks the request until complete
    await runRescrapeForUser(userId, "admin");
    return NextResponse.json({
      ok: true,
      message: `Rescrape completed synchronously for user ${userId}`,
      userId,
    });
  }
}
