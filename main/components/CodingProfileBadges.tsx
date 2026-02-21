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
    <div className="card-modern p-5 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <h3 className="font-semibold flex items-center text-base">
          <Award className="h-5 w-5 mr-2 text-primary" />
          Coding Profiles
        </h3>
      </div>

      <div className="space-y-3">
        {/* LeetCode Badge */}
        {hasLeetCode && codingProfiles.leetcode && (
          <Link
            href={`https://leetcode.com/${codingProfiles.leetcode.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/5 
                     border border-orange-500/20 rounded-lg hover:border-orange-500/40 
                     transition-all hover:shadow-lg group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-orange-500/20 rounded-lg group-hover:bg-orange-500/30 transition-colors">
                  <Code2 className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="font-bold text-foreground">LeetCode</p>
                  <p className="text-xs text-muted-foreground">
                    @{codingProfiles.leetcode.username}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-500">
                  {codingProfiles.leetcode.rating}
                </p>
                <p className="text-xs text-muted-foreground">Rating</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-background/50 p-2 rounded">
                <p className="text-xs text-muted-foreground">Solved</p>
                <p className="font-bold text-foreground">
                  {codingProfiles.leetcode.solved}
                </p>
              </div>
              <div className="bg-background/50 p-2 rounded">
                <p className="text-xs text-muted-foreground">Global Rank</p>
                <p className="font-bold text-foreground">
                  #{codingProfiles.leetcode.ranking?.toLocaleString()}
                </p>
              </div>
            </div>
          </Link>
        )}

        {/* CodeChef Badge */}
        {hasCodeChef && codingProfiles.codechef && (
          <Link
            href={`https://www.codechef.com/users/${codingProfiles.codechef.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-gradient-to-br from-amber-700/10 to-amber-800/5 
                     border border-amber-700/20 rounded-lg hover:border-amber-700/40 
                     transition-all hover:shadow-lg group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-700/20 rounded-lg group-hover:bg-amber-700/30 transition-colors">
                  <Trophy className="h-5 w-5 text-amber-700" />
                </div>
                <div>
                  <p className="font-bold text-foreground">CodeChef</p>
                  <p className="text-xs text-muted-foreground">
                    @{codingProfiles.codechef.username}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-amber-700">
                  {codingProfiles.codechef.rating}
                </p>
                <p className="text-xs text-muted-foreground">Rating</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-background/50 p-2 rounded">
                <p className="text-xs text-muted-foreground">Stars</p>
                <p className="font-bold text-foreground flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  {codingProfiles.codechef.stars}
                </p>
              </div>
              <div className="bg-background/50 p-2 rounded">
                <p className="text-xs text-muted-foreground">Global Rank</p>
                <p className="font-bold text-foreground">
                  #{codingProfiles.codechef.ranking?.toLocaleString()}
                </p>
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
    