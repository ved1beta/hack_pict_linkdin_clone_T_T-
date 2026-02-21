/**
 * GET /api/profile/update-history
 *
 * Returns the authenticated user's profile update history — a chronological
 * log of every GitHub re-scrape, LinkedIn sync, and webhook-triggered update.
 */

import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { ProfileUpdateHistory } from "@/mongodb/models/profileUpdateHistory";

export async function GET(): Promise<NextResponse> {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const history = await ProfileUpdateHistory.find({
      userId: clerkUser.id,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ history });
  } catch (err) {
    console.error("[profile/update-history] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch update history" },
      { status: 500 }
    );
  }
}
