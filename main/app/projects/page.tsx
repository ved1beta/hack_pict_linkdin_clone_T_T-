import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import connectDB from "@/mongodb/db";
import { Project } from "@/mongodb/models/project";
import { GitRepo } from "@/mongodb/models/gitRepo";
import { GitAnalysis } from "@/mongodb/models/gitAnalysis";
import ProjectsClient from "./ProjectsClient";

async function ProjectsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/");

  await connectDB();

  const [projects, gitRepos, gitAnalysis] = await Promise.all([
    Project.find({
      $or: [
        { createdBy: clerkUser.id },
        { "teamMembers.userId": clerkUser.id },
      ],
    })
      .sort({ createdAt: -1 })
      .lean(),
    GitRepo.find({ userId: clerkUser.id }).sort({ createdAt: -1 }).lean(),
    GitAnalysis.find({ userId: clerkUser.id }).sort({ analyzedAt: -1 }).limit(1).lean(),
  ]);

  const serializedProjects = JSON.parse(JSON.stringify(projects));
  const serializedRepos = JSON.parse(JSON.stringify(gitRepos));
  const latestGitAnalysis = gitAnalysis.length > 0 ? JSON.parse(JSON.stringify(gitAnalysis[0])) : null;

  return (
    <div className="bg-background min-h-screen py-6">
      <ProjectsClient
        initialProjects={serializedProjects}
        currentUserId={clerkUser.id}
        gitRepos={serializedRepos}
        gitAnalysis={latestGitAnalysis}
      />
    </div>
  );
}

export default ProjectsPage;
