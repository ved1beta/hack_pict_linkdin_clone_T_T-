"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import AnalyticsGraphs from "./AnalyticsGraphs";
import {
  BarChart3,
  TrendingUp,
  Target,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Briefcase,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Zap,
  Award,
  FileText,
  Github,
  Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

const GitHubContribGraph = dynamic(() => import("@/components/GitHubContribGraph"), { ssr: false });

interface AnalyticsClientProps {
  data: {
    analyses: any[];
    applicationsWithScores: any[];
    latestGeneral: any;
    resumeUploads?: { createdAt: string }[];
    atsScoresForGraphs?: { createdAt: string; score: number }[];
    latestParsed?: {
      name?: string;
      skills: string[];
      workExperience: { company: string; role: string; duration: string }[];
      education: { institution: string; degree: string; year: string }[];
    } | null;
    stats: {
      totalAnalyses: number;
      totalApplications: number;
      avgResumeScore: number;
      avgJobMatch: number;
    };
    user: { firstName: string; lastName: string; skills: string[] };
    git?: {
      repos: { id: string; url: string; repoName: string; owner: string }[];
      latestAnalysis: {
        score: number;
        strengths: string[];
        improvements: string[];
        recommendation: string;
        repoSummary: { repoName: string; languages: string[]; description?: string }[];
        analyzedAt: string;
      } | null;
    };
  };
}

function ScoreRing({
  score,
  label,
  size = 120,
  color = "primary",
}: {
  score: number;
  label: string;
  size?: number;
  color?: "primary" | "accent" | "green" | "orange";
}) {
  const stroke =
    color === "primary"
      ? "hsl(var(--primary))"
      : color === "accent"
      ? "hsl(var(--accent))"
      : color === "green"
      ? "#22c55e"
      : "#f97316";
  const circumference = 2 * Math.PI * 45;
  const safeScore = Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : 0;
  const offset = circumference - (safeScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
          viewBox="0 0 120 120"
        >
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth="10"
          />
          <motion.circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke={stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{safeScore}</span>
        </div>
      </div>
      <span className="text-sm text-muted-foreground mt-2">{label}</span>
    </div>
  );
}

function ProgressBar({ value, label, color = "primary" }: { value: number; label: string; color?: string }) {
  const safeValue = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  const bg =
    color === "primary"
      ? "bg-primary"
      : color === "accent"
      ? "bg-accent"
      : color === "green"
      ? "bg-green-500"
      : "bg-orange-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{safeValue}%</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${bg} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${safeValue}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

type TabType = "resume" | "git";

export default function AnalyticsClient({ data }: AnalyticsClientProps) {
  const [tab, setTab] = useState<TabType>("resume");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzingGit, setAnalyzingGit] = useState(false);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const [analyzeStatus, setAnalyzeStatus] = useState("");
  const [gitStatus, setGitStatus] = useState("");

  const runAnalysis = async (jobId?: string) => {
    setAnalyzing(true);
    setAnalyzeStatus("Connecting to AI…");
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      setAnalyzeStatus("AI is analyzing your profile…");
      const res = await fetch("/api/ats/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: jobId || undefined }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Analysis failed");
      }
      setAnalyzeStatus("Done! Refreshing…");
      window.location.reload();
    } catch (e: any) {
      if (e?.name === "AbortError") {
        setAnalyzeStatus("Timed out – AI is slow. Try again.");
      } else {
        setAnalyzeStatus(e instanceof Error ? e.message : "Analysis failed");
      }
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const runGitAnalysis = async () => {
    setAnalyzingGit(true);
    setGitStatus("Fetching your commits from GitHub…");
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      setGitStatus("AI is analyzing your repos…");
      const res = await fetch("/api/git/analyze", {
        method: "POST",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Analysis failed");
      setGitStatus("Done! Refreshing…");
      window.location.reload();
    } catch (e: any) {
      if (e?.name === "AbortError") {
        setGitStatus("Timed out – AI is slow. Try again.");
      } else {
        setGitStatus(e instanceof Error ? e.message : "Git analysis failed");
      }
      console.error(e);
    } finally {
      setAnalyzingGit(false);
    }
  };

  const { analyses, applicationsWithScores, latestGeneral, latestParsed, stats, user, git, resumeUploads = [], atsScoresForGraphs = [] } = data;
  const gitRepos = git?.repos || [];
  const gitAnalysis = git?.latestAnalysis || null;

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Career Insights
          </h1>
          <p className="text-muted-foreground mt-1">
            Resume scores, job match analysis, and GitHub portfolio insights
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <div className="flex gap-2">
            <Button
              onClick={() => runAnalysis()}
              disabled={analyzing}
              variant={tab === "resume" ? "default" : "outline"}
              className={tab === "resume" ? "btn-primary" : ""}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${analyzing ? "animate-spin" : ""}`}
              />
              {analyzing ? "Analyzing..." : "Analyze My Resume"}
            </Button>
            <Button
              onClick={runGitAnalysis}
              disabled={analyzingGit || gitRepos.length === 0}
              variant={tab === "git" ? "default" : "outline"}
              className={tab === "git" ? "btn-primary" : ""}
            >
              <Github
                className={`h-4 w-4 mr-2 ${analyzingGit ? "animate-spin" : ""}`}
              />
              {analyzingGit ? "Analyzing..." : "Analyze My Git"}
            </Button>
          </div>
          {analyzing && analyzeStatus && (
            <p className="text-xs text-muted-foreground animate-pulse">{analyzeStatus}</p>
          )}
          {analyzingGit && gitStatus && (
            <p className="text-xs text-muted-foreground animate-pulse">{gitStatus}</p>
          )}
          {!analyzing && analyzeStatus && analyzeStatus.includes("failed") && (
            <p className="text-xs text-destructive">{analyzeStatus}</p>
          )}
          {!analyzingGit && gitStatus && gitStatus.includes("failed") && (
            <p className="text-xs text-destructive">{gitStatus}</p>
          )}
        </div>
      </div>

      {/* Landscape Graphs - horizontally scrollable, auto-advance */}
      <AnalyticsGraphs
        resumeUploads={resumeUploads}
        atsScores={atsScoresForGraphs}
        gitRepos={git?.repos || []}
        gitAnalysis={git?.latestAnalysis || null}
      />

      {/* GitHub Contribution Graph */}
      <GitHubContribGraph initialUsername={gitRepos.length > 0 ? gitRepos[0].owner : ""} />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        <button
          onClick={() => setTab("resume")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            tab === "resume"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="h-4 w-4" />
          Resume Insights
        </button>
        <button
          onClick={() => setTab("git")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            tab === "git"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          <Github className="h-4 w-4" />
          Git Insights
        </button>
      </div>

      {/* Resume Insights Tab */}
      {tab === "resume" && (
        <>
      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-modern p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-primary/20">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold">Resume Score</span>
          </div>
          <ScoreRing
            score={stats.avgResumeScore || latestGeneral?.resumeScore || 0}
            label="Average quality"
            color="primary"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-modern p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-accent/20">
              <Briefcase className="h-5 w-5 text-accent" />
            </div>
            <span className="font-semibold">Job Match</span>
          </div>
          <ScoreRing
            score={stats.avgJobMatch || 0}
            label="Avg match to jobs"
            color="accent"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-modern p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-green-500/20">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <span className="font-semibold">Applications</span>
          </div>
          <p className="text-4xl font-bold">{stats.totalApplications}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Jobs applied to
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-modern p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-orange-500/20">
              <Sparkles className="h-5 w-5 text-orange-500" />
            </div>
            <span className="font-semibold">Analyses</span>
          </div>
          <p className="text-4xl font-bold">{stats.totalAnalyses}</p>
          <p className="text-sm text-muted-foreground mt-1">
            ATS reports run
          </p>
        </motion.div>
      </div>

      {/* Your Uploaded Resume (when no analysis yet) */}
      {!latestGeneral && latestParsed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-modern p-6 space-y-6"
        >
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Your Uploaded Resume
          </h2>
          {latestParsed.name && (
            <p className="font-medium">{latestParsed.name}</p>
          )}
          <p className="text-muted-foreground text-sm">
            Your resume was parsed successfully. Score it against a job to see ATS match analysis, or analyze your profile for AI insights.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2 text-primary">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {(latestParsed.skills || []).map((s: string, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded bg-primary/20 text-primary text-sm"
                  >
                    {s}
                  </span>
                ))}
                {(latestParsed.skills || []).length === 0 && (
                  <span className="text-muted-foreground text-sm">No skills extracted</span>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-primary">Experience</h4>
              <ul className="space-y-2">
                {(latestParsed.workExperience || []).map((exp: any, i: number) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium">{exp.role}</span> at {exp.company}
                    {exp.duration && <span className="text-muted-foreground"> · {exp.duration}</span>}
                  </li>
                ))}
                {(latestParsed.workExperience || []).length === 0 && (
                  <li className="text-muted-foreground text-sm">No experience extracted</li>
                )}
              </ul>
            </div>
          </div>
          {(latestParsed.education || []).length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 text-primary">Education</h4>
              <ul className="space-y-1">
                {(latestParsed.education || []).map((edu: any, i: number) => (
                  <li key={i} className="text-sm">
                    {edu.degree} · {edu.institution}
                    {edu.year && <span className="text-muted-foreground"> ({edu.year})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button onClick={() => runAnalysis()} disabled={analyzing} className="btn-primary">
              <Sparkles className="h-4 w-4 mr-2" />
              {analyzing ? "Analyzing..." : "Analyze My Resume"}
            </Button>
            <p className="text-sm text-muted-foreground self-center">
              Or use &quot;Check ATS match score&quot; on any job card to score your resume against that job.
            </p>
          </div>
        </motion.div>
      )}

      {/* Latest General Analysis */}
      {latestGeneral && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-modern p-6 space-y-6"
        >
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Latest Resume Analysis
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <ProgressBar
                value={latestGeneral.resumeScore || 0}
                label="Resume Quality"
                color="primary"
              />
              <ProgressBar
                value={latestGeneral.overallScore || 0}
                label="Overall Score"
                color="accent"
              />
            </div>
            <div className="bg-secondary/50 rounded-xl p-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Recommendation
              </p>
              <p className="text-foreground">{latestGeneral.recommendation}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-500">
                <CheckCircle2 className="h-4 w-4" />
                Strengths
              </h4>
              <ul className="space-y-1">
                {(latestGeneral.strengths || []).map((s: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    {s}
                  </li>
                ))}
                {(!latestGeneral.strengths || latestGeneral.strengths.length === 0) && (
                  <li className="text-sm text-muted-foreground">
                    Run analysis to see strengths
                  </li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2 text-orange-500">
                <AlertCircle className="h-4 w-4" />
                Areas to Improve
              </h4>
              <ul className="space-y-1">
                {(latestGeneral.improvements || []).map((s: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-orange-500">•</span>
                    {s}
                  </li>
                ))}
                {(!latestGeneral.improvements || latestGeneral.improvements.length === 0) && (
                  <li className="text-sm text-muted-foreground">
                    Run analysis for suggestions
                  </li>
                )}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Job Applications with Scores */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-modern p-6 space-y-6"
      >
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Award className="h-5 w-5 text-accent" />
          Your Job Applications & Match Scores
        </h2>

        {applicationsWithScores.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Briefcase className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>You haven&apos;t applied to any jobs yet.</p>
            <p className="text-sm mt-1">
              Apply to jobs from the Jobs or Swipe page to get ATS analysis.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applicationsWithScores.map((app: any) => {
              const isExpanded = expandedJob === app.jobId;
              const score = app.aiScore ?? 0;
              const scoreColor =
                score >= 70
                  ? "text-green-500"
                  : score >= 50
                  ? "text-orange-500"
                  : "text-red-500";

              return (
                <div
                  key={app.jobId}
                  className="border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
                >
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() =>
                      setExpandedJob(isExpanded ? null : app.jobId)
                    }
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl ${
                          score >= 70
                            ? "bg-green-500/20 text-green-500"
                            : score >= 50
                            ? "bg-orange-500/20 text-orange-500"
                            : "bg-red-500/20 text-red-500"
                        }`}
                      >
                        {app.aiScore ?? "—"}
                      </div>
                      <div>
                        <p className="font-semibold">{app.jobTitle}</p>
                        <p className="text-sm text-muted-foreground">
                          {app.companyName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!app.hasAnalysis && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            runAnalysis(app.jobId);
                          }}
                          disabled={analyzing}
                        >
                          Analyze
                        </Button>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                  </div>

                  {isExpanded && app.analysis && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 pt-4 border-t border-border space-y-4"
                    >
                      <p className="text-sm font-medium">
                        {app.analysis.recommendation}
                      </p>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-green-500 mb-1">
                            Matched Skills
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {(app.analysis.matchedSkills || []).map(
                              (s: string, i: number) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs"
                                >
                                  {s}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-orange-500 mb-1">
                            Missing Skills
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {(app.analysis.missingSkills || []).map(
                              (s: string, i: number) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 text-xs"
                                >
                                  {s}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1">
                          Improvements
                        </p>
                        <ul className="text-sm space-y-1">
                          {(app.analysis.improvements || []).map(
                            (s: string, i: number) => (
                              <li key={i} className="flex gap-2">
                                <span className="text-orange-500">•</span>
                                {s}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Empty state - no analyses and no parsed resume */}
      {!latestGeneral && !latestParsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card-modern p-12 text-center"
        >
          <Sparkles className="h-16 w-16 mx-auto text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            Get Your First Resume Analysis
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Our AI will analyze your profile and give you a resume score, strengths,
            and actionable improvements. Click the button above to get started.
          </p>
          <Button onClick={() => runAnalysis()} disabled={analyzing} className="btn-primary">
            <Sparkles className="h-4 w-4 mr-2" />
            Analyze My Resume
          </Button>
        </motion.div>
      )}
        </>
      )}

      {/* Git Insights Tab */}
      {tab === "git" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {gitRepos.length === 0 ? (
            <div className="card-modern p-12 text-center">
              <Github className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Add GitHub Repos First</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Go to Settings and add your public GitHub repository links. Then come back and click &quot;Analyze My Git&quot; to get portfolio insights.
              </p>
              <Button variant="outline" onClick={() => (window.location.href = "/settings")}>
                Go to Settings
              </Button>
            </div>
          ) : !gitAnalysis ? (
            <div className="card-modern p-12 text-center">
              <Code2 className="h-16 w-16 mx-auto text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">View Git Insights</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Click &quot;Analyze My Git&quot; above to analyze your {gitRepos.length} repo{gitRepos.length > 1 ? "s" : ""}. We&apos;ll evaluate your tech stack, project quality, and give improvement suggestions.
              </p>
              <Button
                onClick={runGitAnalysis}
                disabled={analyzingGit}
                className="btn-primary"
              >
                <Github className={`h-4 w-4 mr-2 ${analyzingGit ? "animate-spin" : ""}`} />
                {analyzingGit ? "Analyzing..." : "Analyze My Git"}
              </Button>
            </div>
          ) : (
            <div className="card-modern p-6 space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Github className="h-5 w-5 text-primary" />
                Git Portfolio Analysis
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <ScoreRing
                    score={gitAnalysis.score}
                    label="Portfolio Score"
                    color="primary"
                  />
                </div>
                <div className="space-y-4">
                  <div className="bg-secondary/50 rounded-xl p-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Recommendation
                    </p>
                    <p className="text-foreground">{gitAnalysis.recommendation}</p>
                  </div>
                  {gitAnalysis.repoSummary?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">Repos Analyzed</p>
                      <ul className="space-y-1 text-sm">
                        {gitAnalysis.repoSummary.map((r: any, i: number) => (
                          <li key={i}>
                            <span className="font-medium">{r.repoName}</span>
                            {r.languages?.length > 0 && (
                              <span className="text-muted-foreground ml-2">
                                ({r.languages.join(", ")})
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-500">
                    <CheckCircle2 className="h-4 w-4" />
                    Strengths
                  </h4>
                  <ul className="space-y-1">
                    {(gitAnalysis.strengths || []).map((s: string, i: number) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-green-500">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2 text-orange-500">
                    <AlertCircle className="h-4 w-4" />
                    Areas to Improve
                  </h4>
                  <ul className="space-y-1">
                    {(gitAnalysis.improvements || []).map((s: string, i: number) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-orange-500">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={runGitAnalysis}
                disabled={analyzingGit}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${analyzingGit ? "animate-spin" : ""}`} />
                Re-analyze
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
