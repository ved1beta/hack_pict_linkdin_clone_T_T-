import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import connectDB from "@/mongodb/db";
import { CollegeVerificationRequest } from "@/mongodb/models/collegeVerificationRequest";
import CollegeAdminClient from "@/components/CollegeAdminClient";
import { Shield, GraduationCap } from "lucide-react";

export default async function CollegeAdminPage() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/");
  }

  await connectDB();

  // Fetch all pending verification requests
  const pendingRequests = await CollegeVerificationRequest.getPendingRequests();
  const serializedRequests = JSON.parse(JSON.stringify(pendingRequests));

  return (
    <div className="bg-background min-h-screen py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 space-y-2">
          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">College Verification Admin</h1>
              <p className="text-muted-foreground">
                Review and approve student verification requests
              </p>
            </div>
          </div>
        </div>

        {serializedRequests.length === 0 ? (
          <div className="card-modern p-12 text-center">
            <GraduationCap className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No Pending Requests</h2>
            <p className="text-muted-foreground">
              There are no verification requests waiting for approval.
            </p>
          </div>
        ) : (
          <CollegeAdminClient requests={serializedRequests} />
        )}
      </div>
    </div>
  );
}


