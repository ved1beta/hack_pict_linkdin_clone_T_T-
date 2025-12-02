import { SignedIn } from "@clerk/nextjs";
import PostFeed from "@/components/PostFeed";
import PostForm from "@/components/PostForm";
import UserInformation from "@/components/UserInformation";
import Widget from "@/components/Widget";
import connectDB from "@/mongodb/db";
import { Post } from "@/mongodb/models/post";

async function Home() {
  await connectDB();
  
  // Fetch posts from database
  const posts = await Post.getAllPosts();

  return (
    <div className="bg-background min-h-screen py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - User Info */}
          <aside className="lg:col-span-3 space-y-6">
            <SignedIn>
              <UserInformation posts={posts} />
            </SignedIn>
          </aside>

          {/* Main Feed */}
          <main className="lg:col-span-6 space-y-6">
            <SignedIn>
              <PostForm />
            </SignedIn>
            
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