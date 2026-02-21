import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import connectDB from "@/mongodb/db";
import { Project } from "@/mongodb/models/project";
import ProjectsClient from "./ProjectsClient";

async function ProjectsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/");

  await connectDB();

  const projects = await Project.find({
    $or: [
      { createdBy: clerkUser.id },
      { "teamMembers.userId": clerkUser.id },
    ],
  })
    .sort({ createdAt: -1 })
    .lean();

  const serialized = JSON.parse(JSON.stringify(projects));

  return (
    <div className="bg-background min-h-screen py-6">
      <ProjectsClient initialProjects={serialized} currentUserId={clerkUser.id} />
    </div>
  );
}

export default ProjectsPage;
