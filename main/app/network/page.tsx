import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import { Followers } from "@/mongodb/models/followers";
import NetworkPageContent from "@/components/NetworkPageContent";
import { redirect } from "next/navigation";
import { UsersIcon } from "lucide-react";

async function NetworkPage() {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      redirect("/");
    }

    await connectDB();

    // Get all users
    const users = await User.getAllUsers();
    if (!users) {
      throw new Error("No users found");
    }

    // Get current user's following list - with fallback
    let followingIds: string[] = [];
    try {
      const following = await Followers.getAllFollowing(clerkUser.id);
      followingIds = following ? following.map((f: any) => f.following || f.userId) : [];
    } catch (followError) {
      console.error("Error fetching following:", followError);
      // Continue with empty following list
      followingIds = [];
    }

    // Properly serialize data
    const serializedUsers = users.map((user: any) => ({
      _id: user._id?.toString() || "",
      userId: user.userId || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      userImage: user.userImage || "",
      bio: user.bio || "",
      location: user.location || "",
      companyName: user.companyName || "",
      skills: user.skills || [],
      userType: user.userType || "student",
    }));

    const serializedFollowingIds = followingIds.filter(id => id).map((id: any) => 
      typeof id === 'string' ? id : id.toString()
    );

    return (
      <div className="bg-background min-h-screen py-6">
        <div className="max-w-5xl mx-auto px-4">
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
  } catch (error) {
    console.error("Network page error:", error);
    
    return (
      <div className="bg-background min-h-screen py-6">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-8 space-y-2">
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 p-3 rounded-xl">
                <UsersIcon className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold">My Network</h1>
            </div>
          </div>
          
          <div className="card-modern p-12 text-center">
            <UsersIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Unable to load network</h3>
            <p className="text-muted-foreground mb-2">
              Something went wrong while loading your network.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn-primary mt-4"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default NetworkPage;
