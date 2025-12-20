import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import { Job } from "@/mongodb/models/job";
import ApplicantCard from "@/components/ApplicantCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Briefcase } from "lucide-react";
import Link from "next/link";

interface JobApplicantsPageProps {
  params: Promise<{
    job_id: string;
  }>;
}

async function JobApplicantsPage({ params }: JobApplicantsPageProps) {
  // Await params first
  const { job_id } = await params;
  
  let clerkUser;
  try {
    clerkUser = await currentUser();
  } catch (error) {
    console.error("Clerk error:", error);
    redirect("/");
  }
  
  if (!clerkUser) {
    redirect("/");
  }

  await connectDB();
  
  const dbUser = await User.findByUserId(clerkUser.id);
  
  if (!dbUser || dbUser.userType !== "recruiter") {
    redirect("/");
  }

  // Fetch the job
  const job = await Job.findById(job_id).lean();
  
  if (!job) {
    return (
      <div className="bg-background min-h-screen py-6">
        <div className="max-w-5xl mx-auto px-4">
          <div className="card-modern p-12 text-center">
            <Briefcase className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Job not found</h3>
            <p className="text-muted-foreground mb-6">
              This job posting doesn&apos;t exist or has been removed
            </p>
            <Link href="/recruiter/dashboard">
              <Button className="btn-primary">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Verify the job belongs to this recruiter
  if (job.recruiterId !== clerkUser.id) {
    redirect("/recruiter/dashboard");
  }

  const applicants = job.applications || [];

  return (
    <div className="bg-background min-h-screen py-6">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/recruiter/dashboard">
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">{job.title}</h1>
            <p className="text-muted-foreground">
              {job.companyName} • {applicants.length} applicant{applicants.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-5 w-5" />
            <span className="text-2xl font-bold">{applicants.length}</span>
          </div>
        </div>

        {/* Applicants List */}
        {applicants.length > 0 ? (
          <div className="space-y-4">
            {applicants.map((applicant: any) => (
              <ApplicantCard
                key={applicant._id?.toString() || applicant.userId}
                applicant={{
                  ...applicant,
                  _id: applicant._id?.toString() || applicant.userId,
                }}
                jobId={job._id.toString()}
                companyName={job.companyName}
              />
            ))}
          </div>
        ) : (
          <div className="card-modern p-12 text-center">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No applicants yet</h3>
            <p className="text-muted-foreground">
              Applications will appear here once candidates start applying
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default JobApplicantsPage;
