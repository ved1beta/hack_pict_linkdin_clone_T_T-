import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";

// Simplified scraping without cheerio
async function fetchCodeChefData(username: string) {
  try {
    const response = await fetch(`https://www.codechef.com/users/${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error("CodeChef user not found");
    }

    const html = await response.text();

    // Extract rating using regex
    const ratingMatch = html.match(/rating-number["\s>]+(\d+)/i);
    const rating = ratingMatch ? parseInt(ratingMatch[1]) : 0;

    // Calculate stars based on rating
    let stars = "Unrated";
    if (rating >= 2500) stars = "7★";
    else if (rating >= 2200) stars = "6★";
    else if (rating >= 1800) stars = "5★";
    else if (rating >= 1600) stars = "4★";
    else if (rating >= 1400) stars = "3★";
    else if (rating >= 1200) stars = "2★";
    else if (rating > 0) stars = "1★";

    // Extract global rank using regex
    const rankMatch = html.match(/rank["\s>]+(\d+)/i);
    const ranking = rankMatch ? parseInt(rankMatch[1].replace(/,/g, '')) : 0;

    return {
      rating,
      stars,
      ranking,
    };
  } catch (error) {
    console.error("CodeChef fetch error:", error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { codechefUsername } = body;

    if (!codechefUsername) {
      return NextResponse.json(
        { error: "CodeChef username required" },
        { status: 400 }
      );
    }

    console.log("Fetching CodeChef data for:", codechefUsername);

    // Fetch CodeChef data
    const codechefData = await fetchCodeChefData(codechefUsername);

    console.log("CodeChef data fetched:", codechefData);

    await connectDB();

    // Update user profile
    const updatedUser = await User.findOneAndUpdate(
      { userId },
      {
        $set: {
          "codingProfiles.codechef": {
            username: codechefUsername,
            rating: codechefData.rating,
            stars: codechefData.stars,
            ranking: codechefData.ranking,
            lastUpdated: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: codechefData,
      message: "CodeChef profile updated successfully",
    });
  } catch (error: any) {
    console.error("CodeChef API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch CodeChef data" },
      { status: 500 }
    );
  }
}
