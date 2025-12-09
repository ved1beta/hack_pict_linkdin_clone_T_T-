import { NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const { userId, email, firstName, lastName, userImage, userType } = body;

    if (!userId || !email || !userType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create or update user with type
    const user = await User.createOrUpdateUser({
      userId,
      email,
      firstName,
      lastName,
      userImage,
      userType,
    });

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error) {
    console.error("Error setting up user:", error);
    return NextResponse.json(
      { error: "Failed to setup user" },
      { status: 500 }
    );
  }
}

// Get user by userId
export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    const user = await User.findByUserId(userId);

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}