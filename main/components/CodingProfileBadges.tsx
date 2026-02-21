import { Code2, Trophy, Star, Award } from "lucide-react";
import Link from "next/link";

interface CodingProfileBadgesProps {
  codingProfiles?: {
    leetcode?: {
      username: string;
      rating: number;
      solved: number;
      ranking: number;
    };
    codechef?: {
      username: string;
      rating: number;
      stars: string;
      ranking: number;
    };
  };
}

export default function CodingProfileBadges({ codingProfiles }: CodingProfileBadgesProps) {
  const hasLeetCode = codingProfiles?.leetcode?.username;
  const hasCodeChef = codingProfiles?.codechef?.username;

  if (!hasLeetCode && !hasCodeChef) {
    return null;
  }

  return (
    <div className="bg-card rounded-xl border border-white/5 p-4 sm:p-5 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-secondary rounded-lg">
          <Award className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-semibold text-sm">Coding Profiles</h3>
      </div>

      <div className="grid gap-3">
        {/* LeetCode Badge */}
        {hasLeetCode && codingProfiles.leetcode && (
          <Link
            href={`https://leetcode.com/${codingProfiles.leetcode.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden bg-secondary/30 hover:bg-secondary/50 
                     border border-white/5 hover:border-orange-500/30 rounded-xl p-4 transition-all duration-300"
          >
            <div className="flex items-start justify-between relative z-10">
              <div className="flex gap-3">
                <div className="p-2 bg-black/40 rounded-lg h-fit border border-white/5 group-hover:border-orange-500/20 transition-colors">
                  <Code2 className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground group-hover:text-orange-400 transition-colors">LeetCode</p>
                  <p className="text-xs text-muted-foreground">@{codingProfiles.leetcode.username}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-orange-400 font-mono tracking-tight">
                  {codingProfiles.leetcode.rating}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Rating</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 relative z-10">
              <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Solved</p>
                <p className="font-mono font-medium text-sm text-foreground/90">
                  {codingProfiles.leetcode.solved}
                </p>
              </div>
              <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Rank</p>
                <p className="font-mono font-medium text-sm text-foreground/90">
                  #{codingProfiles.leetcode.ranking?.toLocaleString()}
                </p>
              </div>
            </div>
            
            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </Link>
        )}

        {/* CodeChef Badge */}
        {hasCodeChef && codingProfiles.codechef && (
          <Link
            href={`https://www.codechef.com/users/${codingProfiles.codechef.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden bg-secondary/30 hover:bg-secondary/50 
                     border border-white/5 hover:border-amber-600/30 rounded-xl p-4 transition-all duration-300"
          >
            <div className="flex items-start justify-between relative z-10">
              <div className="flex gap-3">
                <div className="p-2 bg-black/40 rounded-lg h-fit border border-white/5 group-hover:border-amber-600/20 transition-colors">
                  <Trophy className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground group-hover:text-amber-500 transition-colors">CodeChef</p>
                  <p className="text-xs text-muted-foreground">@{codingProfiles.codechef.username}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-amber-600 font-mono tracking-tight">
                  {codingProfiles.codechef.rating}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Rating</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 relative z-10">
              <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Stars</p>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  <p className="font-mono font-medium text-sm text-foreground/90">
                    {codingProfiles.codechef.stars}
                  </p>
                </div>
              </div>
              <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Rank</p>
                <p className="font-mono font-medium text-sm text-foreground/90">
                  #{codingProfiles.codechef.ranking?.toLocaleString()}
                </p>
              </div>
            </div>

             {/* Hover Glow Effect */}
             <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </Link>
        )}
      </div>
    </div>
  );
}
