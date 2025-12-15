import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import connectDB from "@/mongodb/db";
import { Job } from "@/mongodb/models/job";
import { User } from "@/mongodb/models/user";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Briefcase, MapPin } from "lucide-react";
import ApplicantCard from "@/components/ApplicantCard";
import { Badge } from "@/components/ui/badge";

async function ApplicantsPage({ params }: { params: { job_id: string } }) {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect("/");
  }

  await connectDB();
  
  const dbUser = await User.findByUserId(clerkUser.id);
  
  if (!dbUser || dbUser.userType !== "recruiter") {
    redirect("/");
  }

  // ✅ FIXED: Use .lean() and serialize data
  const jobDoc = await Job.findById(params.job_id).lean();
  
  if (!jobDoc) {
    return (
      <div className="bg-background min-h-screen py-6">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Job not found</h1>
          <Link href="/recruiter">
            <Button className="btn-primary">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ✅ FIXED: Convert ObjectId to string for comparison
  if (jobDoc.recruiterId?.toString() !== clerkUser.id) {
    redirect("/recruiter");
  }

  // ✅ FIXED: Transform applicants to plain objects (serializable)
  const applicants = (jobDoc.applications || []).map((app: any) => ({
    ...app,
    _id: app._id?.toString() || '',
    userId: app.userId?.toString() || '',
    appliedAt: app.appliedAt ? new Date(app.appliedAt).toISOString() : new Date().toISOString(),
  }));

  const pendingApplicants = applicants.filter((app: any) => app.status === "pending");
  const reviewedApplicants = applicants.filter((app: any) => app.status !== "pending");

  return (
    <div className="bg-background min-h-screen py-6">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/recruiter">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{jobDoc.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
              <div className="flex items-center">
                <Briefcase className="h-4 w-4 mr-1.5" />
                {jobDoc.companyName}
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1.5" />
                {jobDoc.location}
              </div>
              <Badge variant={jobDoc.status === "open" ? "default" : "secondary"}>
                {jobDoc.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-modern p-4">
            <p className="text-sm text-muted-foreground">Total Applicants</p>
            <p className="text-3xl font-bold">{applicants.length}</p>
          </div>
          <div className="card-modern p-4">
            <p className="text-sm text-muted-foreground">Pending Review</p>
            <p className="text-3xl font-bold text-orange-500">{pendingApplicants.length}</p>
          </div>
          <div className="card-modern p-4">
            <p className="text-sm text-muted-foreground">Reviewed</p>
            <p className="text-3xl font-bold text-green-500">{reviewedApplicants.length}</p>
          </div>
        </div>

        {/* Applicants List */}
        {applicants.length > 0 ? (
          <div className="space-y-6">
            {/* Pending Applications */}
            {pendingApplicants.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Pending Review ({pendingApplicants.length})
                </h2>
                <div className="grid gap-4">
                  {pendingApplicants.map((applicant: any, index: number) => (
                    <ApplicantCard
                      key={applicant._id || index} // ✅ FIXED: Use _id instead of index
                      applicant={applicant}
                      jobId={params.job_id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Reviewed Applications */}
            {reviewedApplicants.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Reviewed ({reviewedApplicants.length})
                </h2>
                <div className="grid gap-4">
                  {reviewedApplicants.map((applicant: any, index: number) => (
                    <ApplicantCard
                      key={applicant._id || index} // ✅ FIXED: Use _id instead of index
                      applicant={applicant}
                      jobId={params.job_id}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="card-modern p-12 text-center">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No applicants yet</h2>
            <p className="text-muted-foreground">
              When students apply to this job, they'll appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ApplicantsPage;
