import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import { Post } from "@/mongodb/models/post";
import { User } from "@/mongodb/models/user";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const text = formData.get("text") as string;
    const imageFile = formData.get("image") as File | null;

    if (!text && !imageFile) {
      return NextResponse.json(
        { error: "Post must have text or image" },
        { status: 400 }
      );
    }

    let imageUrl = "";

    // Convert image to base64 for storage (temporary solution)
    if (imageFile) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString('base64');
      imageUrl = `data:${imageFile.type};base64,${base64}`;
    }

    // Create the post
    const newPost = await Post.create({
      user: {
        userId: user.userId,
        userImage: user.userImage,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      text: text || "",
      imageUrl: imageUrl || undefined,
    });

    return NextResponse.json(
      { 
        success: true, 
        post: newPost,
        message: "Post created successfully" 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create post" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    await connectDB();

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Get posts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
