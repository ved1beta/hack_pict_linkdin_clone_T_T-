/**
 * GET  /api/profile/notifications — list unread notifications
 * POST /api/profile/notifications — mark notification(s) as read
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { Notification } from "@/mongodb/models/notification";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") !== "false";

    const query: Record<string, unknown> = { userId: clerkUser.id };
    if (unreadOnly) query.read = false;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = await Notification.countDocuments({
      userId: clerkUser.id,
      read: false,
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    console.error("[profile/notifications] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ids, markAll } = await req.json().catch(() => ({}));

    await connectDB();

    if (markAll) {
      await Notification.updateMany(
        { userId: clerkUser.id, read: false },
        { $set: { read: true } }
      );
    } else if (Array.isArray(ids) && ids.length > 0) {
      await Notification.updateMany(
        { _id: { $in: ids }, userId: clerkUser.id },
        { $set: { read: true } }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[profile/notifications] POST error:", err);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}
