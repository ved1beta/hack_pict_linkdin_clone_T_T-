import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";

// LeetCode GraphQL API
async function fetchLeetCodeData(username: string) {
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          ranking
          realName
        }
        submitStats: submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
      userContestRanking(username: $username) {
        rating
        globalRanking
        attendedContestsCount
      }
    }
  `;

  const response = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Referer": "https://leetcode.com",
    },
    body: JSON.stringify({
      query,
      variables: { username },
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch LeetCode data");
  }

  const data = await response.json();
  
  if (!data.data?.matchedUser) {
    throw new Error("LeetCode user not found");
  }

  const user = data.data.matchedUser;
  const contestRanking = data.data.userContestRanking;
  
  // Get total solved problems
  const totalSolved = user.submitStats.acSubmissionNum.find(
    (item: any) => item.difficulty === "All"
  )?.count || 0;

  return {
    rating: Math.round(contestRanking?.rating || 0),
    solved: totalSolved,
    ranking: contestRanking?.globalRanking || 0,
  };
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leetcodeUsername } = await request.json();

    if (!leetcodeUsername) {
      return NextResponse.json(
        { error: "LeetCode username required" },
        { status: 400 }
      );
    }

    // Fetch LeetCode data
    const leetcodeData = await fetchLeetCodeData(leetcodeUsername);

    await connectDB();

    // Update user profile
    const updatedUser = await User.findOneAndUpdate(
      { userId },
      {
        $set: {
          "codingProfiles.leetcode": {
            username: leetcodeUsername,
            rating: leetcodeData.rating,
            solved: leetcodeData.solved,
            ranking: leetcodeData.ranking,
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
      data: leetcodeData,
      message: "LeetCode profile updated successfully",
    });
  } catch (error: any) {
    console.error("LeetCode API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch LeetCode data" },
      { status: 500 }
    );
  }
}
