import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import PostJobForm from "@/components/PostJobForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function PostJobPage() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect("/");
  }

  await connectDB();
  
  const dbUser = await User.findByUserId(clerkUser.id);
  
  if (!dbUser || dbUser.userType !== "recruiter") {
    redirect("/");
  }

  return (
    <div className="bg-background min-h-screen py-6">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/recruiter">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Post a New Job</h1>
            <p className="text-muted-foreground">
              Find the perfect candidates for your position
            </p>
          </div>
        </div>

        {/* Form */}
        <PostJobForm 
          recruiterId={clerkUser.id}
          recruiterName={`${dbUser.firstName} ${dbUser.lastName}`}
          recruiterImage={dbUser.userImage}
          companyName={dbUser.companyName || ""}
        />
      </div>
    </div>
  );
}

export default PostJobPage;