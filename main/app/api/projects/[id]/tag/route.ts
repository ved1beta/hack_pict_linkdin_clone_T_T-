import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { Project } from "@/mongodb/models/project";
import mongoose from "mongoose";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, userName, userImage, role } = await req.json();

    if (!userId || !userName) {
      return NextResponse.json(
        { error: "userId and userName are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const project = await Project.findOne({
      _id: new mongoose.Types.ObjectId(params.id),
      createdBy: user.id,
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    const alreadyTagged = project.teamMembers.some(
      (m: any) => m.userId === userId
    );
    if (alreadyTagged) {
      return NextResponse.json(
        { error: "User already tagged in this project" },
        { status: 400 }
      );
    }

    project.teamMembers.push({
      userId,
      userName,
      userImage: userImage || undefined,
      role: role || undefined,
      taggedAt: new Date(),
    });
    await project.save();

    return NextResponse.json({
      success: true,
      project: JSON.parse(JSON.stringify(project)),
    });
  } catch (err) {
    console.error("Tag member error:", err);
    return NextResponse.json(
      { error: "Failed to tag member" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId query param is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const project = await Project.findOne({
      _id: new mongoose.Types.ObjectId(params.id),
      createdBy: user.id,
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    project.teamMembers = project.teamMembers.filter(
      (m: any) => m.userId !== userId
    );
    await project.save();

    return NextResponse.json({
      success: true,
      project: JSON.parse(JSON.stringify(project)),
    });
  } catch (err) {
    console.error("Untag member error:", err);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
