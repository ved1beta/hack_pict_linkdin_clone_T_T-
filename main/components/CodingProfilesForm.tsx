"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { Code2, Trophy, Star } from "lucide-react";

interface CodingProfilesFormProps {
  user: any;
}

export default function CodingProfilesForm({ user }: CodingProfilesFormProps) {
  const [leetcodeUsername, setLeetcodeUsername] = useState(
    user.codingProfiles?.leetcode?.username || ""
  );
  const [codechefUsername, setCodechefUsername] = useState(
    user.codingProfiles?.codechef?.username || ""
  );
  const [isLoading, setIsLoading] = useState({ leetcode: false, codechef: false });

 const handleLeetCodeSync = async () => {
  if (!leetcodeUsername.trim()) {
    toast.error("Please enter your LeetCode username");
    return;
  }

  setIsLoading({ ...isLoading, leetcode: true });

  try {
    console.log("Sending request with username:", leetcodeUsername);
    
    const response = await fetch("/api/coding-profiles/leetcode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leetcodeUsername }),
    });

    console.log("Response status:", response.status);

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned non-JSON response");
    }

    const text = await response.text();
    console.log("Response text:", text);

    if (!text) {
      throw new Error("Empty response from server");
    }

    const data = JSON.parse(text);

    if (!response.ok) {
      throw new Error(data.error || "Failed to sync");
    }

    toast.success("LeetCode profile synced successfully! 🎉");
    setTimeout(() => window.location.reload(), 1500);
  } catch (error: any) {
    console.error("LeetCode sync error:", error);
    toast.error(error.message || "Failed to sync LeetCode profile");
  } finally {
    setIsLoading({ ...isLoading, leetcode: false });
  }
};


  const handleCodeChefSync = async () => {
  if (!codechefUsername.trim()) {
    toast.error("Please enter your CodeChef username");
    return;
  }

  setIsLoading({ ...isLoading, codechef: true });

  try {
    console.log("Sending request with username:", codechefUsername);
    
    const response = await fetch("/api/coding-profiles/codechef", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codechefUsername }),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);

    // Check if response has content
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned non-JSON response");
    }

    const text = await response.text();
    console.log("Response text:", text);

    if (!text) {
      throw new Error("Empty response from server");
    }

    const data = JSON.parse(text);

    if (!response.ok) {
      throw new Error(data.error || "Failed to sync");
    }

    toast.success("CodeChef profile synced successfully! 🎉");
    setTimeout(() => window.location.reload(), 1500);
  } catch (error: any) {
    console.error("CodeChef sync error:", error);
    toast.error(error.message || "Failed to sync CodeChef profile");
  } finally {
    setIsLoading({ ...isLoading, codechef: false });
  }
};


  return (
    <div className="space-y-6">
      {/* LeetCode Section */}
      <div className="card-modern p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="bg-orange-500/10 p-3 rounded-xl">
            <Code2 className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold">LeetCode Profile</h3>
            <p className="text-sm text-muted-foreground">
              Sync your LeetCode stats and rating
            </p>
          </div>
        </div>

        {user.codingProfiles?.leetcode?.username && (
          <div className="bg-secondary p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Rating:</span>
              <span className="text-lg font-bold text-orange-500">
                {user.codingProfiles.leetcode.rating || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Problems Solved:</span>
              <span className="text-lg font-bold">
                {user.codingProfiles.leetcode.solved || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Global Rank:</span>
              <span className="text-lg font-bold">
                #{user.codingProfiles.leetcode.ranking?.toLocaleString() || "N/A"}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="leetcode" className="text-sm font-medium">
            LeetCode Username
          </label>
          <Input
            id="leetcode"
            value={leetcodeUsername}
            onChange={(e) => setLeetcodeUsername(e.target.value)}
            placeholder="Enter your LeetCode username"
          />
        </div>

        <Button
          onClick={handleLeetCodeSync}
          disabled={isLoading.leetcode}
          className="w-full btn-primary"
        >
          {isLoading.leetcode ? "Syncing..." : "Sync LeetCode Profile"}
        </Button>
      </div>

      {/* CodeChef Section */}
      <div className="card-modern p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-700/10 p-3 rounded-xl">
            <Trophy className="h-6 w-6 text-amber-700" />
          </div>
          <div>
            <h3 className="text-xl font-bold">CodeChef Profile</h3>
            <p className="text-sm text-muted-foreground">
              Sync your CodeChef stats and rating
            </p>
          </div>
        </div>

        {user.codingProfiles?.codechef?.username && (
          <div className="bg-secondary p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Rating:</span>
              <span className="text-lg font-bold text-amber-700">
                {user.codingProfiles.codechef.rating || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Stars:</span>
              <span className="text-lg font-bold flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                {user.codingProfiles.codechef.stars || "Unrated"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Global Rank:</span>
              <span className="text-lg font-bold">
                #{user.codingProfiles.codechef.ranking?.toLocaleString() || "N/A"}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="codechef" className="text-sm font-medium">
            CodeChef Username
          </label>
          <Input
            id="codechef"
            value={codechefUsername}
            onChange={(e) => setCodechefUsername(e.target.value)}
            placeholder="Enter your CodeChef username"
          />
        </div>

        <Button
          onClick={handleCodeChefSync}
          disabled={isLoading.codechef}
          className="w-full btn-primary"
        >
          {isLoading.codechef ? "Syncing..." : "Sync CodeChef Profile"}
        </Button>
      </div>
    </div>
  );
}
