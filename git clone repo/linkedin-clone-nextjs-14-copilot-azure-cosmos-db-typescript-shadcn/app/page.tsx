import { currentUser } from "@clerk/nextjs/server";
import PostFeed from "@/components/PostFeed";
import PostForm from "@/components/PostForm";
import UserInformation from "@/components/UserInformation";
import Widget from "@/components/Widget";
import AccountTypeSelector from "@/components/AccountTypeSelector";
import connectDB from "@/mongodb/db";
import { Post } from "@/mongodb/models/post";
import { User } from "@/mongodb/models/user";
import { Job } from "@/mongodb/models/job";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

async function Home() {
  await connectDB();
  
  // Get current Clerk user
  const clerkUser = await currentUser();
  
  // If not signed in, show welcome page
  if (!clerkUser) {
    return (
      <div className="bg-background min-h-screen py-20">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <h1 className="text-5xl font-bold gradient-text">
            Welcome to HEXjuy's
          </h1>
          <p className="text-xl text-muted-foreground">
            The student professional network. Connect, collaborate, and grow your career.
          </p>
          <Button className="btn-primary text-lg px-8 py-6">
            <SignInButton mode="modal" />
          </Button>
        </div>
      </div>
    );
  }
  
  // Check if user has set account type
  const dbUser = await User.findByUserId(clerkUser.id);
  
  // If user is signed in but hasn't set account type, show selector
  const needsAccountSetup = !dbUser || !dbUser.userType;
  
  if (needsAccountSetup) {
    return (
      <AccountTypeSelector
        userId={clerkUser.id}
        email={clerkUser.emailAddresses[0].emailAddress}
        firstName={clerkUser.firstName || ""}
        lastName={clerkUser.lastName || ""}
        imageUrl={clerkUser.imageUrl}
      />
    );
  }

  // If recruiter, show recruiter dashboard
  if (dbUser.userType === "recruiter") {
    const jobs = await Job.getJobsByRecruiter(clerkUser.id);
    
  }

  // If student, show normal feed
  const posts = await Post.getAllPosts();

  return (
    <div className="bg-background min-h-screen py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - User Info */}
          <aside className="lg:col-span-3 space-y-6">
            <UserInformation posts={posts} />
          </aside>

          {/* Main Feed */}
          <main className="lg:col-span-6 space-y-6">
            <PostForm />
            
            {/* Posts Feed */}
            {posts && posts.length > 0 ? (
              <PostFeed posts={posts} />
            ) : (
              <div className="card-modern p-8 text-center">
                <p className="text-muted-foreground">
                  No posts yet. Be the first to share something! 🚀
                </p>
              </div>
            )}
          </main>

          {/* Right Sidebar - Widgets */}
          <aside className="lg:col-span-3 space-y-6 hidden lg:block">
            <Widget />
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Home;