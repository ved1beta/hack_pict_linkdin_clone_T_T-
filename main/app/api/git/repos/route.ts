import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { GitRepo } from "@/mongodb/models/gitRepo";

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const trimmed = url.trim();
  // github.com/owner/repo or https://github.com/owner/repo
  const match = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/]+?)(?:\/|\.git)?$/
  );
  if (match) return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
  return null;
}

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const repos = await GitRepo.find({ userId: user.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      repos: repos.map((r: any) => ({
        id: r._id.toString(),
        url: r.url,
        repoName: r.repoName,
        owner: r.owner,
        addedAt: r.createdAt,
      })),
    });
  } catch (err) {
    console.error("Git repos GET error:", err);
    return NextResponse.json(
      { error: "Failed to list repos" },
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

    const { url } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Valid GitHub URL required" },
        { status: 400 }
      );
    }

    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid GitHub URL. Use format: https://github.com/owner/repo" },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await GitRepo.findOne({
      userId: user.id,
      url: url.trim(),
    });
    if (existing) {
      return NextResponse.json(
        { error: "Repo already added" },
        { status: 400 }
      );
    }

    const repo = await GitRepo.create({
      userId: user.id,
      url: url.trim(),
      repoName: parsed.repo,
      owner: parsed.owner,
    });

    return NextResponse.json({
      success: true,
      repo: {
        id: repo._id.toString(),
        url: repo.url,
        repoName: repo.repoName,
        owner: repo.owner,
        addedAt: repo.createdAt,
      },
    });
  } catch (err) {
    console.error("Git repos POST error:", err);
    return NextResponse.json(
      { error: "Failed to add repo" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Repo ID required" },
        { status: 400 }
      );
    }

    await connectDB();
    const deleted = await GitRepo.findOneAndDelete({
      _id: id,
      userId: user.id,
    });

    if (!deleted) {
      return NextResponse.json(
        { error: "Repo not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Git repos DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to remove repo" },
      { status: 500 }
    );
  }
}
