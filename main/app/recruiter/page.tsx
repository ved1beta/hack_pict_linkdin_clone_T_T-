import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import { Job } from "@/mongodb/models/job";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  Users, 
  FileText, 
  TrendingUp,
  Plus,
  Eye
} from "lucide-react";
import RecruiterJobCard from "@/components/RecruiterJobCard";

async function RecruiterDashboard() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect("/");
  }

  await connectDB();
  
  const dbUser = await User.findByUserId(clerkUser.id);
  
  if (!dbUser || dbUser.userType !== "recruiter") {
    redirect("/");
  }

  // Fetch recruiter's jobs
  const jobs = await Job.find({ recruiterId: clerkUser.id }).sort({ postedAt: -1 }).lean();
  
  // Calculate stats
  const totalJobs = jobs.length;
  const openJobs = jobs.filter((job: any) => job.status === "open").length;
  const totalApplications = jobs.reduce((sum: number, job: any) => 
    sum + (job.applications?.length || 0), 0
  );
  const pendingApplications = jobs.reduce((sum: number, job: any) => 
    sum + (job.applications?.filter((app: any) => app.status === "pending").length || 0), 0
  );

  return (
    <div className="bg-background min-h-screen py-6">
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        {/* Header */}
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            icon={<Briefcase className="h-6 w-6" />}
            title="Total Jobs"
            value={totalJobs}
            bgColor="bg-blue-500/10"
            iconColor="text-blue-500"
          />
          <StatsCard
            icon={<TrendingUp className="h-6 w-6" />}
            title="Open Positions"
            value={openJobs}
            bgColor="bg-green-500/10"
            iconColor="text-green-500"
          />
          <StatsCard
            icon={<Users className="h-6 w-6" />}
            title="Total Applications"
            value={totalApplications}
            bgColor="bg-purple-500/10"
            iconColor="text-purple-500"
          />
          <StatsCard
            icon={<FileText className="h-6 w-6" />}
            title="Pending Reviews"
            value={pendingApplications}
            bgColor="bg-orange-500/10"
            iconColor="text-orange-500"
          />
        </div>

        {/* Posted Jobs */}
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
              <h3 className="text-xl font-semibold mb-2">No jobs posted yet</h3>
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

// Stats Card Component
function StatsCard({ 
  icon, 
  title, 
  value, 
  bgColor, 
  iconColor 
}: { 
  icon: React.ReactNode;
  title: string;
  value: number;
  bgColor: string;
  iconColor: string;
}) {
  return (
    <div className="card-modern p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-xl ${bgColor}`}>
          <div className={iconColor}>{icon}</div>
        </div>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
    </div>
  );
}

export default RecruiterDashboard;