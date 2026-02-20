"use client";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useState } from "react";
import { toast } from "sonner";
import { UserPlus, UserMinus, MapPin, Briefcase, Award } from "lucide-react";
import Link from "next/link";

interface UserCardUser {
  _id: string;
  userId: string;
  firstName: string;
  lastName: string;
  userImage?: string;
  bio?: string;
  location?: string;
  companyName?: string;
  skills?: string[];
  recommendations?: { companyName: string; jobId?: string }[];
}

interface UserCardProps {
  user: UserCardUser;
  currentUserId: string;
  isFollowing: boolean;
}

function UserCard({ user, currentUserId, isFollowing: initialIsFollowing }: UserCardProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/followers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId: user.userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to follow");
      }

      setIsFollowing(true);
      toast.success(`You are now following ${user.firstName}`);
    } catch (error) {
      toast.error("Failed to follow user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/followers`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId: user.userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to unfollow");
      }

      setIsFollowing(false);
      toast.success(`Unfollowed ${user.firstName}`);
    } catch (error) {
      toast.error("Failed to unfollow user");
    } finally {
      setIsLoading(false);
    }
  };

  if (user.userId === currentUserId) return null;

  return (
    <div className="bg-card border rounded-xl p-4 flex flex-col items-center space-y-4 shadow-sm hover:shadow-md transition-shadow">
      <Link href={`/user/${user.userId}`} className="flex flex-col items-center space-y-4 w-full">
        <Avatar className="h-20 w-20 cursor-pointer hover:opacity-80 transition-opacity">
          <AvatarImage src={user.userImage} />
          <AvatarFallback className="text-xl font-bold">
            {user.firstName?.charAt(0)}
            {user.lastName?.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="text-center space-y-1 w-full">
          <h3 className="font-bold text-lg truncate max-w-[200px] mx-auto hover:text-primary transition-colors">
            {user.firstName} {user.lastName}
          </h3>
          <p className="text-sm text-muted-foreground truncate max-w-[200px] mx-auto">
            {user.bio || "No bio available"}
          </p>
        </div>
      </Link>

      <div className="w-full space-y-2 text-sm text-muted-foreground">
        {user.location && (
          <div className="flex items-center justify-center gap-1">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{user.location}</span>
          </div>
        )}
        {user.companyName && (
          <div className="flex items-center justify-center gap-1">
            <Briefcase className="h-3 w-3" />
            <span className="truncate">{user.companyName}</span>
          </div>
        )}
      </div>

      {/* NEW: Recommendations Badge */}
      {user.recommendations && user.recommendations.length > 0 && (
        <div className="w-full pt-2 border-t border-border">
          <div className="flex items-center justify-center gap-1 mb-2 text-xs text-muted-foreground">
            <Award className="h-3 w-3 text-yellow-500" />
            <span>Recommended by</span>
          </div>
          <div className="flex flex-wrap gap-1 justify-center">
            {user.recommendations.slice(0, 2).map((rec: any, idx: number) => (
              <Badge 
                key={idx} 
                variant="secondary" 
                className="bg-green-500/10 text-green-700 border-green-500/20 text-xs"
              >
                ✓ {rec.companyName}
              </Badge>
            ))}
            {user.recommendations.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{user.recommendations.length - 2} more
              </Badge>
            )}
          </div>
        </div>
      )}

      <Button
        variant={isFollowing ? "secondary" : "default"}
        className="w-full"
        onClick={isFollowing ? handleUnfollow : handleFollow}
        disabled={isLoading}
      >
        {isFollowing ? (
          <>
            <UserMinus className="mr-2 h-4 w-4" />
            Following
          </>
        ) : (
          <>
            <UserPlus className="mr-2 h-4 w-4" />
            Connect
          </>
        )}
      </Button>
    </div>
  );
}

export default UserCard;
