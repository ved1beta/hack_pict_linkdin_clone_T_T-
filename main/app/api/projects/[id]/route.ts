import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { Project } from "@/mongodb/models/project";
import mongoose from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const project = await Project.findOne({
      _id: new mongoose.Types.ObjectId(params.id),
      $or: [
        { createdBy: user.id },
        { "teamMembers.userId": user.id },
      ],
    }).lean();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ project: JSON.parse(JSON.stringify(project)) });
  } catch (err) {
    console.error("Project fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const project = await Project.findOne({
      _id: new mongoose.Types.ObjectId(params.id),
      createdBy: user.id,
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    const body = await req.json();
    const { title, synopsis, gitRepo, weblinks, teamMembers } = body;

    if (title != null) project.title = title;
    if (synopsis != null) project.synopsis = synopsis;
    if (gitRepo !== undefined) project.gitRepo = gitRepo || undefined;
    if (Array.isArray(weblinks)) project.weblinks = weblinks;
    if (Array.isArray(teamMembers)) project.teamMembers = teamMembers;

    await project.save();

    return NextResponse.json({
      success: true,
      project: JSON.parse(JSON.stringify(project)),
    });
  } catch (err) {
    console.error("Project update error:", err);
    return NextResponse.json(
      { error: "Failed to update project" },
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

    await connectDB();

    const result = await Project.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(params.id),
      createdBy: user.id,
    });

    if (!result) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Project delete error:", err);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
