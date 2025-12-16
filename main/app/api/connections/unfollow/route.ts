import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import { Followers } from "@/mongodb/models/followers";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    
    const { targetUserId } = await request.json();

    if (!targetUserId) {
      return NextResponse.json({ error: "Target user ID required" }, { status: 400 });
    }

    // Remove follower relationship
    await Followers.deleteOne({
      follower: userId,
      following: targetUserId,
    });

    // Remove reverse relationship
    await Followers.deleteOne({
      follower: targetUserId,
      following: userId,
    });

    return NextResponse.json({ 
      success: true, 
      message: "Unfollowed successfully" 
    });
  } catch (error) {
    console.error("Unfollow error:", error);
    return NextResponse.json(
      { error: "Failed to unfollow user" },
      { status: 500 }
    );
  }
}
