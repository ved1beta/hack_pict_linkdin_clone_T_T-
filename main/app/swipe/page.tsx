import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { Job } from "@/mongodb/models/job";
import { User } from "@/mongodb/models/user";
import { redirect } from "next/navigation";
import SwipeContainer from "./SwipeContainer";

async function SwipePage() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/");
  }

  await connectDB();

  const dbUser = await (User as any).findByUserId(clerkUser.id);

  if (!dbUser) {
    redirect("/");
  }

  // Fetch all open jobs that user hasn't applied to yet
  const allJobs = await (Job as any).getAllJobs();
  
  // Filter out jobs user has already applied to
  const availableJobs = allJobs.filter(
    (job: any) => !job.applications?.some((app: any) => app.userId === clerkUser.id)
  );
  
  const serializedJobs = JSON.parse(JSON.stringify(availableJobs));

  return (
    <div className="min-h-screen bg-background">
      <SwipeContainer 
        jobs={serializedJobs} 
        currentUserId={clerkUser.id}
        userEmail={clerkUser.emailAddresses[0]?.emailAddress || ""}
        userName={clerkUser.fullName || clerkUser.firstName || "User"}
        userImage={clerkUser.imageUrl}
      />
    </div>
  );
}

export default SwipePage;

