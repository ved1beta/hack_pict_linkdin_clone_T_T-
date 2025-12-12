"use client";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { IUserDocument } from "@/mongodb/models/user";
import { useState } from "react";
import { toast } from "sonner";
import { UserPlus, UserMinus, MapPin, Briefcase } from "lucide-react";
import Link from "next/link";

interface UserCardProps {
  user: IUserDocument;
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
