"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing?: boolean;
}

function FollowButton({ targetUserId, initialIsFollowing = false }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  // We might want to check if following on mount if initialIsFollowing is not provided reliably
  // But for now let's rely on props or default to false.
  // Ideally the parent component fetches this status.

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
          targetUserId: targetUserId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to follow");
      }

      setIsFollowing(true);
      toast.success("You are now following this user");
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
          targetUserId: targetUserId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to unfollow");
      }

      setIsFollowing(false);
      toast.success("Unfollowed successfully");
    } catch (error) {
      toast.error("Failed to unfollow user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={isFollowing ? "secondary" : "default"}
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
  );
}

export default FollowButton;
