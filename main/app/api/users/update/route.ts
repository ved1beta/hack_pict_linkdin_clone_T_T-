import { NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    await connectDB();
    const { userId: currentUserId } = auth();

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, ...updateData } = body;

    if (userId !== currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update user
    // @ts-ignore
    const user = await User.createOrUpdateUser({
      userId,
      ...updateData,
    });

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
