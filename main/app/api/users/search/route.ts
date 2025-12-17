import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    await connectDB();

    let users;

    if (query.length === 0) {
      // If no search query, return recent users
      users = await User.find({ userType: "student" })
        .limit(10)
        .sort({ createdAt: -1 })
        .select("userId firstName lastName userImage")
        .lean();
    } else {
      // Search users by name
      users = await User.find({
        $or: [
          { firstName: { $regex: query, $options: "i" } },
          { lastName: { $regex: query, $options: "i" } },
        ],
        userType: "student",
      })
        .limit(10)
        .select("userId firstName lastName userImage")
        .lean();
    }

    const formattedUsers = users.map((user: any) => ({
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.userImage,
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error("Search users error:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
