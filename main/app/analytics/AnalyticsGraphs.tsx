"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { TrendingUp, GitBranch, Target, ChevronLeft, ChevronRight } from "lucide-react";

interface GitRepoData {
  name: string;
  value: number;
  languages?: string;
}

interface ProgressData {
  date: string;
  uploads: number;
  cumulative: number;
  score?: number;
  analyses?: number;
  avgScore?: number;
}

interface ContributionDay {
  date: string;
  count: number;
  level?: number;
}

interface AnalyticsGraphsProps {
  resumeUploads: { createdAt: string }[];
  atsScores: { createdAt: string; score: number }[];
  gitRepos: { repoName: string; languages?: string[] }[];
  gitAnalysis?: { repoSummary?: { repoName: string; languages: string[] }[] } | null;
  githubUsername?: string;
}

export default function AnalyticsGraphs({
  resumeUploads,
  atsScores,
  gitRepos,
  gitAnalysis,
  githubUsername = "",
}: AnalyticsGraphsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [gitContributions, setGitContributions] = useState<ContributionDay[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch git contributions when githubUsername changes (re-sync updates this)
  useEffect(() => {
    if (!githubUsername) {
      setGitContributions([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/github/contributions?username=${encodeURIComponent(githubUsername)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.contributions) {
          setGitContributions(data.contributions || []);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [githubUsername]);

  // Auto-rotate every 3 seconds when not hovered
  useEffect(() => {
    if (isHovered) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % 4);
    }, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isHovered, activeIndex]);

  const truncate = (s: string, len: number) =>
    s.length > len ? `${s.slice(0, len)}…` : s;

  // Git repo data (for tech stack bar → convert to line+scatter)
  const gitRepoData: { name: string; value: number; languages?: string }[] =
    (gitAnalysis?.repoSummary?.length
      ? gitAnalysis.repoSummary.map((r) => ({
          name: r.repoName,
          value: r.languages?.length || 1,
          languages: r.languages?.join(", ") || "N/A",
        }))
      : gitRepos.map((r) => ({
          name: r.repoName,
          value: (r as { languages?: string[] }).languages?.length || 1,
          languages: (r as { languages?: string[] }).languages?.join(", ") || "N/A",
        }))) || [];

  // Git commit progress: contributions over time (line + scatter)
  const gitProgressRaw = gitContributions
    .filter((d) => d.count > 0)
    .map((d) => ({
      date: d.date,
      count: d.count,
      cumulative: 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  let cum = 0;
  const gitProgressData = gitProgressRaw.map((d) => {
    cum += d.count;
    return {
      ...d,
      dateLabel: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      cumulative: cum,
    };
  });

  // Resume progress
  const uploadsByDate = resumeUploads.reduce((acc: Record<string, number>, u) => {
    const d = new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});

  const dateOrder: string[] = [];
  resumeUploads.forEach((u) => {
    const d = new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!dateOrder.includes(d)) dateOrder.push(d);
  });
  atsScores.forEach((s) => {
    const d = new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!dateOrder.includes(d)) dateOrder.push(d);
  });

  const scoresByDate = atsScores.reduce((acc: Record<string, number[]>, s) => {
    const d = new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    acc[d] = [...(acc[d] || []), s.score];
    return acc;
  }, {});

  let cumulative = 0;
  let progressData: ProgressData[] = dateOrder.map((d) => {
    cumulative += uploadsByDate[d] || 0;
    const scores = scoresByDate[d] || [];
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return {
      date: d,
      uploads: uploadsByDate[d] || 0,
      cumulative,
      score: scores[scores.length - 1],
      analyses: (atsScores.filter((s) => new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) === d)).length,
      avgScore,
    };
  });

  if (progressData.length === 0 && resumeUploads.length > 0) {
    const scores = atsScores.map((s) => s.score);
    progressData = [{
      date: new Date(resumeUploads[0].createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      uploads: resumeUploads.length,
      cumulative: resumeUploads.length,
      score: atsScores[0]?.score,
      analyses: atsScores.length,
      avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    }];
  }

  // ATS scores over time (line + scatter)
  const scoreLineData = atsScores
    .map((s, i) => ({
      index: i + 1,
      date: new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      score: s.score,
    }))
    .reverse();

  const charts = [
    {
      id: "git-progress",
      title: "Git Commit Progress",
      subtitle: "Your contribution activity over time",
      icon: GitBranch,
      content: gitProgressData.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={gitProgressData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis dataKey="dateLabel" stroke="hsl(var(--muted-foreground))" fontSize={10} tick={{ fill: "hsl(var(--foreground))" }} interval="preserveStartEnd" />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tick={{ fill: "hsl(var(--foreground))" }} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
              formatter={(value: number, name: string) => [value, name === "count" ? "Commits (day)" : "Cumulative"]}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.date ? `Date: ${payload[0].payload.date}` : ""}
            />
            <Line type="monotone" dataKey="cumulative" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4, fill: "#22c55e" }} activeDot={{ r: 6 }} name="Cumulative" />
            <Scatter dataKey="count" fill="#06b6d4" shape="circle" r={5} name="Daily commits" />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground">
          <GitBranch className="h-12 w-12 mb-2 opacity-50" />
          <span className="text-sm">Connect GitHub in Settings to see commit progress</span>
        </div>
      ),
    },
    {
      id: "resume-progress",
      title: "Resume Progress",
      subtitle: "Uploads & ATS scores over time",
      icon: TrendingUp,
      content: progressData.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={progressData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tick={{ fill: "hsl(var(--foreground))" }} />
            <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={11} tick={{ fill: "hsl(var(--foreground))" }} />
            <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={11} tick={{ fill: "hsl(var(--foreground))" }} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = { cumulative: "Cumulative uploads", score: "Latest score", avgScore: "Avg score" };
                return [value, labels[name] || name];
              }}
            />
            <Line yAxisId="left" type="monotone" dataKey="cumulative" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Cumulative" />
            <Line yAxisId="right" type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2} dot={{ r: 4, fill: "#22c55e" }} strokeDasharray="0" name="Score" />
            <Line yAxisId="right" type="monotone" dataKey="avgScore" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: "#f59e0b" }} strokeDasharray="4 4" name="Avg score" />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground">
          <TrendingUp className="h-12 w-12 mb-2 opacity-50" />
          <span className="text-sm">Upload resumes to see progress</span>
        </div>
      ),
    },
    {
      id: "score-timeline",
      title: "ATS Score Timeline",
      subtitle: "Job match scores over time",
      icon: Target,
      content: scoreLineData.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={scoreLineData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tick={{ fill: "hsl(var(--foreground))" }} />
            <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} tick={{ fill: "hsl(var(--foreground))" }} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
              formatter={(value: number) => [`${value}%`, "Score"]}
            />
            <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 5, fill: "#8b5cf6" }} activeDot={{ r: 7 }} name="Score" />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground">
          <Target className="h-12 w-12 mb-2 opacity-50" />
          <span className="text-sm">Score jobs to see timeline</span>
        </div>
      ),
    },
    {
      id: "repo-stack",
      title: "Repo Tech Stack",
      subtitle: "Languages per repository",
      icon: GitBranch,
      content: gitRepoData.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={gitRepoData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tick={{ fill: "hsl(var(--foreground))" }} tickFormatter={(v) => truncate(v, 10)} />
            <YAxis dataKey="value" stroke="hsl(var(--muted-foreground))" fontSize={11} tick={{ fill: "hsl(var(--foreground))" }} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
              formatter={(value: number, _n: string, props: { payload?: { languages?: string } }) =>
                [props?.payload?.languages || `Languages: ${value}`, "Tech stack"]}
            />
            <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ r: 5, fill: "#6366f1" }} activeDot={{ r: 7 }} name="Languages" />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground">
          <GitBranch className="h-12 w-12 mb-2 opacity-50" />
          <span className="text-sm">Add repos in Settings</span>
        </div>
      ),
    },
  ];

  const goTo = useCallback((idx: number) => {
    setActiveIndex(idx);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card-modern p-8 space-y-6 bg-gradient-to-br from-card via-card to-card/50 border border-border/50"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Insights at a Glance
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Line & scatter charts • Auto-rotates every 3s • Hover to pause & scroll
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goTo((activeIndex - 1 + charts.length) % charts.length)}
            className="p-2 rounded-lg border border-border hover:bg-secondary transition-colors"
            aria-label="Previous chart"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-xs text-muted-foreground min-w-[80px] text-center">
            {activeIndex + 1} / {charts.length}
          </span>
          <button
            type="button"
            onClick={() => goTo((activeIndex + 1) % charts.length)}
            className="p-2 rounded-lg border border-border hover:bg-secondary transition-colors"
            aria-label="Next chart"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative min-h-[320px] rounded-2xl border border-border/50 bg-card/50 overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {(() => {
            const chart = charts[activeIndex];
            return (
              <motion.div
                key={chart.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <chart.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{chart.title}</h3>
                    <p className="text-xs text-muted-foreground">{chart.subtitle}</p>
                  </div>
                </div>
                <div className="w-full" style={{ height: 280 }}>
                  {chart.content}
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>

      <div className="flex justify-center gap-2 pt-2">
        {charts.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => goTo(idx)}
            className={`h-2 rounded-full transition-all ${
              activeIndex === idx
                ? "bg-gradient-to-r from-primary to-accent w-8"
                : "bg-secondary hover:bg-muted-foreground/50 w-2"
            }`}
            aria-label={`View chart ${idx + 1}`}
          />
        ))}
      </div>
    </motion.div>
  );
}
