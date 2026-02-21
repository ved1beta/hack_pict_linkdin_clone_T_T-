"use client";

import { useState, useEffect, useMemo } from "react";
import { Github, Loader2, Users, BookOpen, GitFork, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ContributionDay {
  date: string;
  count: number;
  level: number;
}

interface GitHubProfile {
  name?: string;
  avatarUrl?: string;
  publicRepos: number;
  followers: number;
  following: number;
  bio?: string;
}

interface GitHubContribGraphProps {
  initialUsername?: string;
  onUsernameSet?: (username: string) => void;
  compact?: boolean;
}

export default function GitHubContribGraph({
  initialUsername = "",
  onUsernameSet,
  compact = false,
}: GitHubContribGraphProps) {
  const [username, setUsername] = useState(initialUsername);
  const [inputValue, setInputValue] = useState(initialUsername);
  const [loading, setLoading] = useState(false);
  const [contributions, setContributions] = useState<ContributionDay[]>([]);
  const [totalContributions, setTotalContributions] = useState(0);
  const [profile, setProfile] = useState<GitHubProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialUsername) {
      setUsername(initialUsername);
      setInputValue(initialUsername);
    }
  }, [initialUsername]);

  useEffect(() => {
    if (username) {
      fetchContributions(username);
    }
  }, [username]);

  const fetchContributions = async (user: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/github/contributions?username=${encodeURIComponent(user)}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setContributions(data.contributions || []);
      setTotalContributions(data.totalContributions || 0);
      setProfile(data.profile || null);
    } catch {
      setError("Could not fetch GitHub data. Check the username.");
      setContributions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setUsername(inputValue.trim());
      onUsernameSet?.(inputValue.trim());
    }
  };

  // Build contribution grid (last 52 weeks)
  const grid = useMemo(() => {
    if (contributions.length === 0) return [];

    // Flatten contributions into a map
    const contribMap: Record<string, { count: number; level: number }> = {};
    contributions.forEach((day) => {
      contribMap[day.date] = { count: day.count, level: day.level };
    });

    // Build 52 weeks x 7 days grid
    const today = new Date();
    const weeks: { date: string; count: number; level: number }[][] = [];
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364); // ~52 weeks ago
    // Align to Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());

    let currentDate = new Date(startDate);
    let currentWeek: { date: string; count: number; level: number }[] = [];

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const entry = contribMap[dateStr] || { count: 0, level: 0 };
      currentWeek.push({ date: dateStr, ...entry });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    return weeks;
  }, [contributions]);

  const getColor = (level: number) => {
    const colors = [
      "bg-secondary",        // 0
      "bg-green-200 dark:bg-green-900", // 1
      "bg-green-400 dark:bg-green-700", // 2
      "bg-green-500 dark:bg-green-500", // 3
      "bg-green-700 dark:bg-green-300", // 4
    ];
    return colors[Math.min(level, 4)];
  };

  // Month labels
  const monthLabels = useMemo(() => {
    if (grid.length === 0) return [];
    const labels: { label: string; index: number }[] = [];
    let lastMonth = -1;
    grid.forEach((week, i) => {
      const date = new Date(week[0].date);
      const month = date.getMonth();
      if (month !== lastMonth) {
        labels.push({
          label: date.toLocaleDateString("en-US", { month: "short" }),
          index: i,
        });
        lastMonth = month;
      }
    });
    return labels;
  }, [grid]);

  if (!username && !initialUsername) {
    return (
      <div className="card-modern p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          <h3 className="font-semibold text-lg">GitHub Contributions</h3>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter GitHub username"
            className="flex-1"
          />
          <Button type="submit" size="sm" className="btn-primary">
            Load
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className={`card-modern ${compact ? "p-4" : "p-6"} space-y-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          <h3 className="font-semibold text-lg">GitHub Contributions</h3>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="GitHub username"
            className="w-40 h-8 text-sm"
          />
          <Button type="submit" size="sm" variant="outline" className="h-8 text-xs">
            Update
          </Button>
        </form>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading contributions...</span>
        </div>
      ) : error ? (
        <p className="text-sm text-red-500 py-4">{error}</p>
      ) : (
        <>
          {/* Profile Stats */}
          {profile && (
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="font-semibold text-foreground">{totalContributions}</span> contributions
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span className="font-semibold text-foreground">{profile.publicRepos}</span> repos
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="font-semibold text-foreground">{profile.followers}</span> followers
              </div>
            </div>
          )}

          {/* Contribution Grid */}
          {grid.length > 0 && (
            <div className="overflow-x-auto">
              <div className="inline-block">
                {/* Month labels */}
                <div className="flex ml-8 mb-1">
                  {monthLabels.map((m, i) => (
                    <div
                      key={i}
                      className="text-[10px] text-muted-foreground"
                      style={{
                        position: "relative",
                        left: `${m.index * 14}px`,
                        width: 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {m.label}
                    </div>
                  ))}
                </div>
                {/* Grid */}
                <div className="flex gap-[3px]">
                  {/* Day labels */}
                  <div className="flex flex-col gap-[3px] mr-1">
                    {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
                      <div key={i} className="h-[11px] text-[9px] text-muted-foreground leading-[11px]">
                        {d}
                      </div>
                    ))}
                  </div>
                  {grid.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-[3px]">
                      {week.map((day, di) => (
                        <div
                          key={di}
                          className={`w-[11px] h-[11px] rounded-[2px] ${getColor(day.level)}`}
                          title={`${day.date}: ${day.count} contribution${day.count !== 1 ? "s" : ""}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                {/* Legend */}
                <div className="flex items-center gap-1.5 mt-2 justify-end">
                  <span className="text-[10px] text-muted-foreground">Less</span>
                  {[0, 1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`w-[11px] h-[11px] rounded-[2px] ${getColor(level)}`}
                    />
                  ))}
                  <span className="text-[10px] text-muted-foreground">More</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

