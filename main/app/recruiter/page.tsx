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

import RecruiterAnalytics from "@/components/RecruiterAnalytics"; // Import Analytics

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
  const jobsRaw = await Job.find({ recruiterId: clerkUser.id }).sort({ postedAt: -1 }).lean();
  const jobs = JSON.parse(JSON.stringify(jobsRaw));
  
  // Calculate stats
  const totalJobs = jobs.length;
  const openJobs = jobs.filter((job: any) => job.status === "open").length;
  
  // Aggregate Applications Data
  let totalApplications = 0;
  let pendingApplications = 0;
  let totalScore = 0;
  let scoreCount = 0;
  
  const statusCounts: Record<string, number> = {
    pending: 0,
    reviewed: 0,
    accepted: 0,
    rejected: 0
  };

  const scoreBuckets: Record<string, number> = {
    "0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0
  };

  const appsByDate: Record<string, number> = {};
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  // Initialize last 30 days with 0
  for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    appsByDate[dateStr] = 0;
  }

  jobs.forEach((job: any) => {
    if (job.applications) {
      job.applications.forEach((app: any) => {
        totalApplications++;
        
        // Status
        if (app.status === "pending") pendingApplications++;
        if (statusCounts[app.status] !== undefined) {
          statusCounts[app.status]++;
        }

        // AI Score
        if (typeof app.aiScore === 'number') {
          totalScore += app.aiScore;
          scoreCount++;
          
          if (app.aiScore <= 20) scoreBuckets["0-20"]++;
          else if (app.aiScore <= 40) scoreBuckets["21-40"]++;
          else if (app.aiScore <= 60) scoreBuckets["41-60"]++;
          else if (app.aiScore <= 80) scoreBuckets["61-80"]++;
          else scoreBuckets["81-100"]++;
        }

        // Applications Over Time
        if (app.appliedAt) {
          const appDate = new Date(app.appliedAt);
          if (appDate >= thirtyDaysAgo) {
            const dateStr = appDate.toISOString().split('T')[0];
            if (appsByDate[dateStr] !== undefined) {
              appsByDate[dateStr]++;
            }
          }
        }
      });
    }
  });

  const averageScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

  const statusDistribution = [
    { name: "Pending", value: statusCounts.pending, color: "#64748b" }, // slate-500
    { name: "Reviewed", value: statusCounts.reviewed, color: "#3b82f6" }, // blue-500
    { name: "Accepted", value: statusCounts.accepted, color: "#22c55e" }, // green-500
    { name: "Rejected", value: statusCounts.rejected, color: "#ef4444" }, // red-500
  ].filter(item => item.value > 0);

  const scoreDistribution = Object.entries(scoreBuckets).map(([range, count]) => ({
    range,
    count
  }));

  const applicationsOverTime = Object.entries(appsByDate)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({
      date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      count
    }));

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

        {/* Analytics Section */}
        {totalApplications > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Applicant Insights</h2>
            <RecruiterAnalytics 
              totalApplications={totalApplications}
              averageScore={averageScore}
              statusDistribution={statusDistribution}
              scoreDistribution={scoreDistribution}
              applicationsOverTime={applicationsOverTime}
            />
          </div>
        )}

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