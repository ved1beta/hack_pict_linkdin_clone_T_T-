import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { Project } from "@/mongodb/models/project";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const projects = await Project.find({
      $or: [
        { createdBy: user.id },
        { "teamMembers.userId": user.id },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      projects: JSON.parse(JSON.stringify(projects)),
    });
  } catch (err) {
    console.error("Projects fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, synopsis, gitRepo, weblinks, teamMembers } = body;

    if (!title || !synopsis) {
      return NextResponse.json(
        { error: "Title and synopsis are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const project = await Project.create({
      title,
      synopsis,
      gitRepo: gitRepo || undefined,
      weblinks: Array.isArray(weblinks) ? weblinks : [],
      createdBy: user.id,
      teamMembers: Array.isArray(teamMembers) ? teamMembers : [],
    });

    return NextResponse.json({
      success: true,
      project: JSON.parse(JSON.stringify(project)),
    });
  } catch (err) {
    console.error("Project create error:", err);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
