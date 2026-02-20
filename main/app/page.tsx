import { currentUser } from "@clerk/nextjs/server";
import PostFeed from "@/components/PostFeed";
import PostForm from "@/components/PostForm";
import UserInformation from "@/components/UserInformation";
import FriendSuggestions from "@/components/FriendSuggestions";
import AccountTypeSelector from "@/components/AccountTypeSelector";
import connectDB from "@/mongodb/db";
import { Post } from "@/mongodb/models/post";
import { User } from "@/mongodb/models/user";
import { Job } from "@/mongodb/models/job";
import { Followers } from "@/mongodb/models/followers";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Briefcase, Users, FileText, TrendingUp, Plus } from "lucide-react";
import RecruiterJobCard from "@/components/RecruiterJobCard";

async function Home() {
  await connectDB();

  const clerkUser = await currentUser();

  // Not signed in - show welcome page
  if (!clerkUser) {
    return (
      <div className="bg-background min-h-screen py-20">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <h1 className="text-5xl font-bold gradient-text">
            Welcome to HEXjuy&apos;s
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

  const dbUser = await User.findByUserId(clerkUser.id);
  const needsAccountSetup = !dbUser || !dbUser.userType;

  // Need account setup
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

  // =========================
  // RECRUITER DASHBOARD
  // =========================
  if (dbUser.userType === "recruiter") {
    const jobs = await Job.find({ recruiterId: clerkUser.id }).sort({ postedAt: -1 }).lean();

    const totalJobs = jobs.length;
    const openJobs = jobs.filter((job: any) => job.status === "open").length;
    const totalApplications = jobs.reduce(
      (sum: number, job: any) => sum + (job.applications?.length || 0),
      0
    );
    const pendingApplications = jobs.reduce(
      (sum: number, job: any) =>
        sum +
        (job.applications?.filter((app: any) => app.status === "pending")
          .length || 0),
      0
    );

    return (
      <div className="bg-background min-h-screen py-6">
        <div className="max-w-7xl mx-auto px-4 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {dbUser.firstName}!
              </p>
            </div>
            <Link href="/recruiter/post-job">
              <Button className="btn-primary">
                <Plus className="h-5 w-5 mr-2" />
                Post New Job
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card-modern p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Briefcase className="h-6 w-6 text-blue-500" />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Jobs</p>
                <p className="text-3xl font-bold">{totalJobs}</p>
              </div>
            </div>

            <div className="card-modern p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-green-500/10">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Open Positions</p>
                <p className="text-3xl font-bold">{openJobs}</p>
              </div>
            </div>

            <div className="card-modern p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-purple-500/10">
                  <Users className="h-6 w-6 text-purple-500" />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Applications</p>
                <p className="text-3xl font-bold">{totalApplications}</p>
              </div>
            </div>

            <div className="card-modern p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-orange-500/10">
                  <FileText className="h-6 w-6 text-orange-500" />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Reviews</p>
                <p className="text-3xl font-bold">{pendingApplications}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Your Job Postings</h2>
            </div>

            {jobs && jobs.length > 0 ? (
              <div className="grid gap-6">
                {jobs.map((job: any) => (
                  <RecruiterJobCard key={job._id} job={job} />
                ))}
              </div>
            ) : (
              <div className="card-modern p-12 text-center">
                <Briefcase className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  No jobs posted yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Start by posting your first job opportunity
                </p>
                <Link href="/recruiter/post-job">
                  <Button className="btn-primary">
                    <Plus className="h-5 w-5 mr-2" />
                    Post Your First Job
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // STUDENT DASHBOARD
  // =========================

  const posts = (await Post.getAllPosts()) || [];

  // Safely compute counts for current user
  const userPostsCount = posts.filter((post: any) => {
    const authorId =
      post.author?.userId || post.user?.userId || post.userId || null;
    return authorId === clerkUser.id;
  }).length;

  const userCommentsCount = posts.reduce((count: number, post: any) => {
    const commentsArray = Array.isArray(post.comments) ? post.comments : [];
    const postComments = commentsArray.filter((c: any) => {
      const commentUserId =
        c.user?.userId || c.author?.userId || c.userId || null;
      return commentUserId === clerkUser.id;
    });
    return count + postComments.length;
  }, 0);

  // Fetch users from database
  let allUsers: any[] = [];
  try {
    allUsers = await User.find({ userType: "student" }).limit(20).lean();
  } catch (error) {
    console.error("Error fetching users:", error);
    allUsers = [];
  }

  // Get current user's following from Followers model
  let currentUserFollowing: string[] = [];
  try {
    const following = await Followers.getAllFollowing(clerkUser.id);
    currentUserFollowing = following
      ? following.map((f: any) => f.following || f.userId)
      : [];
  } catch (error) {
    console.error("Error fetching following:", error);
    currentUserFollowing = [];
  }

  // Map users with connection status
  const friendSuggestions = allUsers
    .filter((user: any) => user.userId !== clerkUser.id)
    .map((user: any) => ({
      _id: user._id?.toString() || "",
      userId: user.userId || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      imageUrl: user.userImage || user.imageUrl || "",
      bio: user.bio || "Student Developer",
      location: user.location || "",
      companyName: user.companyName || "",
      topSkills: user.skills?.slice(0, 3) || ["React", "JavaScript", "Node.js"],
      isConnected: currentUserFollowing.includes(user.userId),
    }))
    .slice(0, 5);

  return (
    <div className="bg-background min-h-screen py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT SIDEBAR – paste this aside block here */}
           <aside className="lg:col-span-3 space-y-6">
             <UserInformation posts={posts} />
           </aside>
   
          <main className="lg:col-span-6 space-y-6">
            <PostForm />

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

          <aside className="lg:col-span-3 space-y-6 hidden lg:block">
            <FriendSuggestions
              suggestions={friendSuggestions}
              currentUserId={clerkUser.id}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Home;
