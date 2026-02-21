import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { ResumeUpload } from "@/mongodb/models/resumeUpload";
import { ParsedResume } from "@/mongodb/models/parsedResume";
import { User } from "@/mongodb/models/user";
import { getRoadmapSlugFromSkills, getRoadmapUrl } from "@/lib/roadmap-mapper";
import { searchYouTube } from "@/lib/youtube";
import { chatWithClaude } from "@/lib/localClaude";

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

    // Filter skills using AI to remove irrelevant ones (e.g. "massala maggie")
    let validSkills = skills;
    if (skills.length > 0) {
      try {
        const prompt = `Filter this list of skills and keep ONLY technical, professional, or job-relevant skills (e.g. programming languages, tools, soft skills for work). Remove anything that looks like food, hobbies, or nonsense (e.g. "massala maggie", "cooking", "sleeping").
        
        List: ${JSON.stringify(skills)}
        
        Respond with ONLY a JSON array of strings. Example: ["React", "Python"]`;
        
        const response = await chatWithClaude(
          [{ role: "user", content: prompt }],
          "You are a helpful assistant that filters skill lists."
        );
        
        const jsonMatch = response.replace(/```json\n?|\n?```/g, "").trim();
        const cleaned = JSON.parse(jsonMatch);
        if (Array.isArray(cleaned)) {
          validSkills = cleaned;
        }
      } catch (aiError) {
        console.error("Skill filtering failed, using raw list:", aiError);
      }
    }

    const slug = getRoadmapSlugFromSkills(validSkills);
    const url = getRoadmapUrl(slug);
    const displayName = slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    // Fetch diverse resources for top valid skills
    const uniqueSkills = Array.from(new Set(validSkills)).slice(0, 3);
    const resources: any[] = [];

    // Parallel fetch for speed
    await Promise.all(
      uniqueSkills.map(async (skill) => {
        const videos = await searchYouTube(skill, 2); // Get 2 videos per skill
        if (videos.length > 0) {
          resources.push({
            skill,
            videos,
          });
        }
      })
    );

    return NextResponse.json({
      slug,
      url,
      displayName,
      basedOnSkills: validSkills.slice(0, 10),
      resources, 
    });
  } catch (err) {
    console.error("Roadmap API error:", err);
    return NextResponse.json(
      { error: "Failed to get roadmap" },
      { status: 500 }
    );
  }
}
