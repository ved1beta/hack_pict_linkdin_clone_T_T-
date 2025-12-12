import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import { Followers } from "@/mongodb/models/followers";
import NetworkPageContent from "@/components/NetworkPageContent";
import { redirect } from "next/navigation";
import { UsersIcon } from "lucide-react";

async function NetworkPage() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/");
  }

  await connectDB();

  // Get all users
  // @ts-ignore
  const users = await User.getAllUsers();

  // Get current user's following list
  // @ts-ignore
  const following = await Followers.getAllFollowing(clerkUser.id);
  const followingIds = following.map((f: any) => f.following);

  // Serialize data
  const serializedUsers = JSON.parse(JSON.stringify(users));
  const serializedFollowingIds = JSON.parse(JSON.stringify(followingIds));

  return (
    <div className="bg-background min-h-screen py-6">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 p-3 rounded-xl">
              <UsersIcon className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">My Network</h1>
          </div>
          <p className="text-muted-foreground">
            Connect with professionals and grow your network
          </p>
        </div>

        <NetworkPageContent 
          users={serializedUsers} 
          currentUserId={clerkUser.id}
          followingIds={serializedFollowingIds}
        />
      </div>
    </div>
  );
}

export default NetworkPage;
