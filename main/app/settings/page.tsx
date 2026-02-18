import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import CodingProfilesForm from "@/components/CodingProfilesForm";
import ResumeUploadATS from "@/components/ResumeUploadATS";
import { Settings } from "lucide-react";

export default async function SettingsPage() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/");
  }

  await connectDB();
  const dbUser = await User.findOne({ userId: clerkUser.id }).lean();

  if (!dbUser) {
    redirect("/");
  }

  const serializedUser = JSON.parse(JSON.stringify(dbUser));

  return (
    <div className="bg-background min-h-screen py-6">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 space-y-2">
          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Settings</h1>
          </div>
          <p className="text-muted-foreground">
            Manage your coding profiles and preferences
          </p>
        </div>

        {serializedUser.userType === "student" && (
          <div className="mb-8">
            <ResumeUploadATS />
          </div>
        )}

        <CodingProfilesForm user={serializedUser} />
      </div>
    </div>
  );
}
