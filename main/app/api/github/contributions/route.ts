import { NextResponse } from "next/server";

// Fetch GitHub contribution data using the public GraphQL-like scraping endpoint
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  try {
    // Use GitHub's public contributions page
    const response = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=last`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!response.ok) {
      // Fallback: try the GitHub profile page for basic stats
      const profileRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
        headers: {
          "Accept": "application/vnd.github.v3+json",
          ...(process.env.GITHUB_TOKEN ? { "Authorization": `token ${process.env.GITHUB_TOKEN}` } : {}),
        },
      });

      if (!profileRes.ok) {
        return NextResponse.json({ error: "GitHub user not found" }, { status: 404 });
      }

      const profile = await profileRes.json();
      return NextResponse.json({
        username,
        totalContributions: profile.public_repos || 0,
        profile: {
          name: profile.name,
          avatarUrl: profile.avatar_url,
          publicRepos: profile.public_repos,
          followers: profile.followers,
          following: profile.following,
        },
        contributions: [],
      });
    }

    const data = await response.json();

    // Also fetch basic profile info
    let profile = null;
    try {
      const profileRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
        headers: {
          "Accept": "application/vnd.github.v3+json",
          ...(process.env.GITHUB_TOKEN ? { "Authorization": `token ${process.env.GITHUB_TOKEN}` } : {}),
        },
      });
      if (profileRes.ok) {
        const p = await profileRes.json();
        profile = {
          name: p.name,
          avatarUrl: p.avatar_url,
          publicRepos: p.public_repos,
          followers: p.followers,
          following: p.following,
          bio: p.bio,
        };
      }
    } catch {
      // Non-critical
    }

    return NextResponse.json({
      username,
      totalContributions: data.total?.lastYear || data.total?.["last"] || 0,
      contributions: data.contributions || [],
      profile,
    });
  } catch (error) {
    console.error("GitHub contributions fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch GitHub data" },
      { status: 500 }
    );
  }
}

