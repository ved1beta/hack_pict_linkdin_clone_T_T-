"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnalyticsClientProps {
  data: {
    analyses: any[];
    applicationsWithScores: any[];
    latestGeneral: any;
    stats: {
      totalAnalyses: number;
      totalApplications: number;
      avgResumeScore: number;
      avgJobMatch: number;
    };
    user: { firstName: string; lastName: string; skills: string[] };
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

export default function AnalyticsClient({ data }: AnalyticsClientProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const runAnalysis = async (jobId?: string) => {
    setAnalyzing(true);
    try {
      await fetch("/api/ats/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: jobId || undefined }),
      });
      window.location.reload();
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const { analyses, applicationsWithScores, latestGeneral, stats, user } = data;

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
            Your resume scores, job match analysis, and improvement suggestions
          </p>
        </div>
        <Button
          onClick={() => runAnalysis()}
          disabled={analyzing}
          className="btn-primary"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${analyzing ? "animate-spin" : ""}`}
          />
          {analyzing ? "Analyzing..." : "Analyze My Resume"}
        </Button>
      </div>

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

      {/* Empty state - no analyses yet */}
      {!latestGeneral && analyses.length === 0 && (
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
    </div>
  );
}
