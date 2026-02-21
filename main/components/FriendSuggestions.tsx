"use client";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { UserPlus, UserMinus, Users, MapPin, Briefcase, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

interface FriendSuggestion {
  _id: string;
  userId: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  bio?: string;
  location?: string;
  companyName?: string;
  topSkills: string[];
  isConnected?: boolean;
  collegeVerification?: {
    collegeName: string;
    status: string;
  };
}

interface FriendSuggestionsProps {
  suggestions: FriendSuggestion[];
  currentUserId: string;
}

export default function FriendSuggestions({ suggestions, currentUserId }: FriendSuggestionsProps) {
  const [followStatus, setFollowStatus] = useState<{ [key: string]: boolean }>(
    Object.fromEntries(suggestions.map(s => [s.userId, s.isConnected || false]))
  );
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});

  const handleFollow = async (userId: string, firstName: string) => {
    if (loadingStates[userId]) return;
    
    setLoadingStates(prev => ({ ...prev, [userId]: true }));

    try {
      const response = await fetch(`/api/followers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId: userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to follow");
      }

      setFollowStatus(prev => ({ ...prev, [userId]: true }));
      toast.success(`You are now following ${firstName}`);
    } catch (error) {
      toast.error("Failed to follow user");
    } finally {
      setLoadingStates(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleUnfollow = async (userId: string, firstName: string) => {
    if (loadingStates[userId]) return;
    
    setLoadingStates(prev => ({ ...prev, [userId]: true }));

    try {
      const response = await fetch(`/api/followers`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId: userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to unfollow");
      }

      setFollowStatus(prev => ({ ...prev, [userId]: false }));
      toast.success(`Unfollowed ${firstName}`);
    } catch (error) {
      toast.error("Failed to unfollow user");
    } finally {
      setLoadingStates(prev => ({ ...prev, [userId]: false }));
    }
  };

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="card-modern p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <h3 className="font-semibold flex items-center text-base">
          <Users className="h-5 w-5 mr-2 text-primary" />
          People You May Know
        </h3>
      </div>

      {/* Suggestions List - scrollable */}
      <div className="space-y-4 max-h-[420px] overflow-y-auto overflow-x-hidden pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
        {suggestions.map((person) => {
          const isFollowing = followStatus[person.userId];
          const isLoading = loadingStates[person.userId];

          return (
            <div
              key={person._id}
              className="bg-card border rounded-xl p-4 flex flex-col items-center space-y-3 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Avatar & Name */}
              <Link 
                href={`/user/${person.userId}`} 
                className="flex flex-col items-center space-y-2 w-full"
              >
                <Avatar className="h-16 w-16 cursor-pointer hover:opacity-80 transition-opacity ring-2 ring-primary/20">
                  <AvatarImage src={person.imageUrl} alt={person.firstName} />
                  <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-primary to-accent text-white">
                    {person.firstName?.charAt(0)}
                    {person.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="text-center space-y-1 w-full">
                  <h4 className="font-bold text-sm truncate max-w-[180px] mx-auto hover:text-primary transition-colors">
                    {person.firstName} {person.lastName}
                  </h4>
                  {person.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-2 max-w-[180px] mx-auto">
                      {person.bio}
                    </p>
                  )}
                </div>
              </Link>

              {/* Info Section */}
              <div className="w-full space-y-1.5 text-xs text-muted-foreground">
                {person.location && (
                  <div className="flex items-center justify-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{person.location}</span>
                  </div>
                )}
                {person.companyName && (
                  <div className="flex items-center justify-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    <span className="truncate">{person.companyName}</span>
                  </div>
                )}
              </div>

              {/* College Verification Badge */}
              {person.collegeVerification?.status === "approved" && (
                <div className="w-full">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-xs w-full justify-center">
                    <Shield className="h-3 w-3 mr-1" />
                    {person.collegeVerification.collegeName}
                  </Badge>
                </div>
              )}

              {/* Skills */}
              {person.topSkills && person.topSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 justify-center w-full">
                  {person.topSkills.slice(0, 3).map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Connect/Following Button */}
              <Button
                variant={isFollowing ? "secondary" : "default"}
                className="w-full"
                onClick={() => 
                  isFollowing 
                    ? handleUnfollow(person.userId, person.firstName)
                    : handleFollow(person.userId, person.firstName)
                }
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
        })}
      </div>

      {/* View All Link */}
      {suggestions.length > 10 && (
        <Link 
          href="/network" 
          className="block text-center text-sm text-primary hover:underline font-medium pt-2"
        >
          View all suggestions →
        </Link>
      )}
    </div>
  );
}
