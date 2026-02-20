"use client";

import { IUserDocument } from "@/mongodb/models/user";
import { useState } from "react";
import UserCard from "./UserCard";
import { Search } from "lucide-react";
import { Input } from "./ui/input";

interface NetworkPageContentProps {
  users: IUserDocument[];
  currentUserId: string;
  followingIds: string[];
}

function NetworkPageContent({ users, currentUserId, followingIds }: NetworkPageContentProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const username = user.userId.toLowerCase(); // Assuming userId might be used or we can add username field later
    // Actually user model doesn't have username field visible in the interface I saw, but let's search by name.
    return fullName.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative max-w-md mx-auto md:mx-0">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search people by name..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Users Grid */}
      {filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <UserCard
              key={user._id as string}
              user={user}
              currentUserId={currentUserId}
              isFollowing={followingIds.includes(user.userId)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No users found matching &quot;{searchTerm}&quot;
        </div>
      )}
    </div>
  );
}

export default NetworkPageContent;
