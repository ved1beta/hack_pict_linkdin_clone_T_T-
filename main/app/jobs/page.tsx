import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { Job } from "@/mongodb/models/job";
import { User } from "@/mongodb/models/user";
import JobCard from "@/components/JobCard";
import { redirect } from "next/navigation";
import { Briefcase } from "lucide-react";

async function JobsPage() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect("/");
  }

  await connectDB();
  
  const dbUser = await User.findByUserId(clerkUser.id);
  
  if (!dbUser) {
    redirect("/");
  }

  // Fetch all open jobs
  const jobs = await Job.getAllJobs();
  const serializedJobs = JSON.parse(JSON.stringify(jobs));

  return (
    <div className="bg-background min-h-screen py-6">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Job Opportunities</h1>
          </div>
          <p className="text-muted-foreground">
            Discover exciting opportunities from top companies
          </p>
        </div>

        {/* Jobs Grid */}
        {serializedJobs && serializedJobs.length > 0 ? (
          <div className="grid gap-6">
            {serializedJobs.map((job: any) => (
              <JobCard key={job._id} job={job} currentUserId={clerkUser.id} />
            ))}
          </div>
        ) : (
          <div className="card-modern p-12 text-center">
            <Briefcase className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No jobs posted yet</h2>
            <p className="text-muted-foreground">
              Check back soon for new opportunities!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default JobsPage;