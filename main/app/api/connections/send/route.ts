import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    
    const { targetUserId } = await request.json();

    const currentUser = await User.findOne({ userId });
    const targetUser = await User.findOne({ userId: targetUserId });

    if (!currentUser || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (currentUser.connections?.includes(targetUserId)) {
      return NextResponse.json({ 
        error: "Already following this user" 
      }, { status: 400 });
    }

    // Add connection
    await User.updateOne(
      { userId },
      { $addToSet: { connections: targetUserId } }
    );

    await User.updateOne(
      { userId: targetUserId },
      { $addToSet: { connections: userId } }
    );

    return NextResponse.json({ 
      success: true, 
      message: "Following successfully" 
    });
  } catch (error) {
    console.error("Connection error:", error);
    return NextResponse.json(
      { error: "Failed to follow user" },
      { status: 500 }
    );
  }
}
