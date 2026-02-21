import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import { ResumeAnalysis } from "@/mongodb/models/resumeAnalysis";
import { AtsScore } from "@/mongodb/models/atsScore";
import { ResumeUpload } from "@/mongodb/models/resumeUpload";
import { ParsedResume } from "@/mongodb/models/parsedResume";
import { GitRepo } from "@/mongodb/models/gitRepo";
import { GitAnalysis } from "@/mongodb/models/gitAnalysis";
import { Job } from "@/mongodb/models/job";
import AnalyticsClient from "./AnalyticsClient";

async function AnalyticsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/");

  await connectDB();

  const dbUser = await User.findByUserId(clerkUser.id);
  if (!dbUser) redirect("/");

  // Students only - recruiters don't need this
  if (dbUser.userType === "recruiter") redirect("/");

  const [analyses, atsScores, latestUpload, gitRepos, gitAnalyses] = await Promise.all([
    ResumeAnalysis.find({ userId: clerkUser.id }).sort({ analyzedAt: -1 }).lean(),
    AtsScore.find({ userId: clerkUser.id }).sort({ createdAt: -1 }).lean(),
    ResumeUpload.findOne({ userId: clerkUser.id }).sort({ createdAt: -1 }).lean(),
    GitRepo.find({ userId: clerkUser.id }).sort({ createdAt: -1 }).lean(),
    GitAnalysis.find({ userId: clerkUser.id }).sort({ analyzedAt: -1 }).limit(1).lean(),
  ]);

  let latestParsed = null;
  if (latestUpload) {
    const parsed = await ParsedResume.findOne({ resumeUploadId: latestUpload._id }).lean();
    if (parsed) {
      latestParsed = {
        name: (parsed as any).name,
        skills: (parsed as any).skills || [],
        workExperience: (parsed as any).workExperience || [],
        education: (parsed as any).education || [],
      };
    }
  }

  const allJobs = await Job.find({}).lean();
  const appliedJobs = allJobs.filter((job: any) =>
    job.applications?.some((a: any) => a.userId === clerkUser.id)
  );
  const appliedJobIds = new Set(
    appliedJobs.map((j: any) => j._id?.toString())
  );
  const scoredButNotApplied = allJobs.filter(
    (job: any) =>
      atsScores.some((s: any) => s.jobId === job._id?.toString()) &&
      !appliedJobIds.has(job._id?.toString())
  );

  const applicationsWithScores = [
    ...appliedJobs.map((job: any) => {
    const app = job.applications.find((a: any) => a.userId === clerkUser.id);
    const analysis = analyses.find(
      (a: any) => a.jobId?.toString() === job._id?.toString()
    );
    const atsScore = atsScores.find(
      (s: any) => s.jobId === job._id?.toString()
    );

    const score = app?.aiScore ?? atsScore?.score ?? analysis?.jobMatchScore ?? analysis?.overallScore ?? null;
    const breakdown = atsScore?.breakdown as any;
    const recommendation =
      analysis?.recommendation ??
      (score >= 70
        ? "Strong match - apply now"
        : score >= 50
        ? "Good match - consider applying"
        : "Improve resume for better match");

    return {
      jobId: job._id?.toString(),
      jobTitle: job.title,
      companyName: job.companyName,
      appliedAt: app?.appliedAt,
      status: app?.status,
      aiScore: score,
      hasAnalysis: !!(analysis || atsScore),
      analysis:
        analysis || atsScore
          ? {
              strengths: analysis?.strengths ?? (breakdown?.commonSkills ? [`Matched skills: ${breakdown.commonSkills.join(", ")}`] : []),
              improvements: analysis?.improvements ?? [],
              matchedSkills: analysis?.matchedSkills ?? breakdown?.commonSkills ?? [],
              missingSkills: analysis?.missingSkills ?? breakdown?.missingSkills ?? [],
              recommendation,
            }
          : null,
    };
  }),
    ...scoredButNotApplied.map((job: any) => {
      const atsScore = atsScores.find(
        (s: any) => s.jobId === job._id?.toString()
      );
      const breakdown = atsScore?.breakdown as any;
      return {
        jobId: job._id?.toString(),
        jobTitle: job.title,
        companyName: job.companyName,
        appliedAt: null,
        status: null,
        aiScore: atsScore?.score ?? null,
        hasAnalysis: !!atsScore,
        analysis: atsScore
          ? {
              strengths: breakdown?.commonSkills
                ? [`Matched: ${breakdown.commonSkills.join(", ")}`]
                : [],
              improvements: breakdown?.missingSkills
                ? [`Add: ${breakdown.missingSkills.join(", ")}`]
                : [],
              matchedSkills: breakdown?.commonSkills ?? [],
              missingSkills: breakdown?.missingSkills ?? [],
              recommendation:
                (atsScore.score >= 70
                  ? "Strong match - apply now"
                  : atsScore.score >= 50
                  ? "Good match - consider applying"
                  : "Improve resume first"),
            }
          : null,
      };
    }),
  ];

  const latestGeneral = analyses.find((a: any) => !a.jobId);

  let latestFromUpload = null;
  if (atsScores.length > 0) {
    const latest = atsScores[0];
    const b = latest.breakdown as any;
    latestFromUpload = {
      resumeScore: latest.score,
      overallScore: latest.score,
      strengths: b?.commonSkills ? [`Matched: ${b.commonSkills.join(", ")}`] : [],
      improvements: b?.missingSkills ? [`Add these skills: ${b.missingSkills.join(", ")}`] : [],
      recommendation:
        latest.score >= 70
          ? "Strong match - apply now"
          : latest.score >= 50
          ? "Good match - consider applying"
          : "Improve resume for better match",
    };
  }

  const allScores = [
    ...analyses.map((a: any) => ({ resumeScore: a.resumeScore, jobMatchScore: a.jobMatchScore })),
    ...atsScores.map((s: any) => ({ resumeScore: s.score, jobMatchScore: s.score })),
  ];
  const avgResumeScore =
    allScores.length > 0
      ? allScores.reduce((sum, s) => sum + (s.resumeScore || s.jobMatchScore || 0), 0) /
        allScores.length
      : 0;

  const jobScores = [
    ...analyses.filter((a: any) => a.jobId).map((a: any) => a.jobMatchScore),
    ...atsScores.map((s: any) => s.score),
  ];
  const avgJobMatch =
    jobScores.length > 0
      ? jobScores.reduce((s, v) => s + (v || 0), 0) / jobScores.length
      : 0;

  const latestGitAnalysis = (gitAnalyses as any[])?.[0] || null;

  const serialized = {
    analyses: analyses.map((a: any) => ({
      ...a,
      _id: a._id.toString(),
      userId: a.userId.toString(),
      analyzedAt: a.analyzedAt ? new Date(a.analyzedAt).toISOString() : null,
    })),
    applicationsWithScores: JSON.parse(JSON.stringify(applicationsWithScores)),
    latestGeneral: (latestGeneral || latestFromUpload)
      ? JSON.parse(JSON.stringify(latestGeneral || latestFromUpload))
      : null,
    latestParsed: latestParsed ? JSON.parse(JSON.stringify(latestParsed)) : null,
    stats: {
      totalAnalyses: analyses.length + atsScores.length,
      totalApplications: applicationsWithScores.length,
      avgResumeScore: Math.round(avgResumeScore),
      avgJobMatch: Math.round(avgJobMatch),
    },
    user: {
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      skills: dbUser.skills || [],
    },
    git: {
      repos: (gitRepos as any[]).map((r) => ({
        id: r._id.toString(),
        url: r.url,
        repoName: r.repoName,
        owner: r.owner,
        // Ensure no other complex fields are passed
      })),
      latestAnalysis: latestGitAnalysis
        ? {
            id: latestGitAnalysis._id.toString(),
            score: latestGitAnalysis.score,
            strengths: latestGitAnalysis.strengths || [],
            improvements: latestGitAnalysis.improvements || [],
            recommendation: latestGitAnalysis.recommendation || "",
            repoSummary: (latestGitAnalysis.repoSummary || []).map((s: any) => ({
              repoName: s.repoName,
              languages: s.languages,
              description: s.description,
            })),
            analyzedAt: latestGitAnalysis.analyzedAt
              ? new Date(latestGitAnalysis.analyzedAt).toISOString()
              : new Date(latestGitAnalysis.createdAt).toISOString(),
          }
        : null,
    },
  };

  return (
    <div className="bg-background min-h-screen py-6">
      <AnalyticsClient data={serialized} />
    </div>
  );
}

export default AnalyticsPage;
