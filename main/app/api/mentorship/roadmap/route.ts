import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { ResumeUpload } from "@/mongodb/models/resumeUpload";
import { ParsedResume } from "@/mongodb/models/parsedResume";
import { User } from "@/mongodb/models/user";
import { getRoadmapSlugFromSkills, getRoadmapUrl } from "@/lib/roadmap-mapper";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    let skills: string[] = [];

    // Try parsed resume first
    const latestUpload = await ResumeUpload.findOne({ userId: user.id })
      .sort({ createdAt: -1 })
      .lean();
    if (latestUpload) {
      const parsed = await ParsedResume.findOne({
        resumeUploadId: latestUpload._id,
      }).lean();
      if (parsed?.skills?.length) {
        skills = (parsed as any).skills;
      }
    }

    // Fallback to profile skills
    if (skills.length === 0) {
      const dbUser = await User.findByUserId(user.id);
      if (dbUser?.skills?.length) {
        skills = dbUser.skills;
      }
    }

    const slug = getRoadmapSlugFromSkills(skills);
    const url = getRoadmapUrl(slug);
    const displayName = slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    return NextResponse.json({
      slug,
      url,
      displayName,
      basedOnSkills: skills.slice(0, 10),
    });
  } catch (err) {
    console.error("Roadmap API error:", err);
    return NextResponse.json(
      { error: "Failed to get roadmap" },
      { status: 500 }
    );
  }
}
