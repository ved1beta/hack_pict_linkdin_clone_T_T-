"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  ReferenceLine,
  Area,
  AreaChart,
  ComposedChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { TrendingUp, GitBranch, Target } from "lucide-react";

const COLORS = {
  primary: "#6366f1",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  cyan: "#06b6d4",
  gradient1: "url(#gradient1)",
  gradient2: "url(#gradient2)",
};

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

interface AnalyticsGraphsProps {
  resumeUploads: { createdAt: string }[];
  atsScores: { createdAt: string; score: number }[];
  gitRepos: { repoName: string; languages?: string[] }[];
  gitAnalysis?: { repoSummary?: { repoName: string; languages: string[] }[] } | null;
}

export default function AnalyticsGraphs({
  resumeUploads,
  atsScores,
  gitRepos,
  gitAnalysis,
}: AnalyticsGraphsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Git repo contribution (languages/code distribution)
  const gitRepoData: GitRepoData[] =
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

  // Resume progress over time (line graph)
  const uploadsByDate = resumeUploads.reduce((acc: Record<string, number>, u) => {
    const d = new Date(u.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
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
  const sortedDates = dateOrder;

  // Calculate analyses by date
  const analysesByDate = atsScores.reduce((acc: Record<string, number>, s) => {
    const d = new Date(s.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});

  // Calculate average score by date
  const scoresByDate = atsScores.reduce((acc: Record<string, number[]>, s) => {
    const d = new Date(s.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    acc[d] = [...(acc[d] || []), s.score];
    return acc;
  }, {});

  let cumulative = 0;
  let progressData: ProgressData[] = sortedDates.map((d) => {
    cumulative += uploadsByDate[d] || 0;
    const scores = scoresByDate[d] || [];
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return {
      date: d,
      uploads: uploadsByDate[d] || 0,
      cumulative,
      score: scores[scores.length - 1],
      analyses: analysesByDate[d] || 0,
      avgScore,
    };
  });

  if (progressData.length === 0 && resumeUploads.length > 0) {
    const scores = atsScores.map(s => s.score);
    progressData = [
      {
        date: new Date(resumeUploads[0].createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        uploads: resumeUploads.length,
        cumulative: resumeUploads.length,
        score: atsScores[0]?.score,
        analyses: atsScores.length,
        avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      },
    ];
  }

  // Score distribution (pie)
  const scoreRanges = [
    { name: "70-100 (Strong)", value: 0, color: "#22c55e" },
    { name: "50-69 (Good)", value: 0, color: "#f59e0b" },
    { name: "0-49 (Improve)", value: 0, color: "#ef4444" },
  ];
  atsScores.forEach((s) => {
    if (s.score >= 70) scoreRanges[0].value++;
    else if (s.score >= 50) scoreRanges[1].value++;
    else scoreRanges[2].value++;
  });

  const truncate = (s: string, len: number) =>
    s.length > len ? `${s.slice(0, len)}…` : s;

  const graphs = [
    {
      id: "git",
      title: "Git Repo Contribution",
      subtitle: "Repositories & tech stack",
      icon: GitBranch,
      width: 420,
      content: (
        <ResponsiveContainer width="100%" height={240}>
          {gitRepoData.length > 0 ? (
            <BarChart
              data={gitRepoData}
              layout="vertical"
              margin={{ top: 5, right: 24, left: 8, bottom: 5 }}
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis
                type="number"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={140}
                tickFormatter={(v) => truncate(v, 18)}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tick={{ fill: "hsl(var(--foreground))", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(0, 0, 0, 0.9)",
                  border: "1px solid hsl(var(--primary))",
                  borderRadius: "12px",
                  padding: "8px 12px",
                  boxShadow: "0 8px 24px rgba(99, 102, 241, 0.2)",
                }}
                labelStyle={{ color: "white" }}
                formatter={(value, _name, props) => {
                  const p = props?.payload as GitRepoData;
                  return p?.languages ? `📚 ${p.languages}` : `Languages: ${value ?? 0}`;
                }}
              />
              <Bar dataKey="value" fill="url(#barGradient)" radius={[0, 6, 6, 0]} animationDuration={800} />
            </BarChart>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <GitBranch className="h-10 w-10 mb-2 opacity-50" />
              <span className="text-sm">Add repos in Settings</span>
            </div>
          )}
        </ResponsiveContainer>
      ),
    },
    {
      id: "progress",
      title: "Resume Progress",
      subtitle: "Multi-metric performance tracking",
      icon: TrendingUp,
      width: 480,
      content: (
        <ResponsiveContainer width="100%" height={240}>
          {progressData.length > 0 ? (
            <ComposedChart data={progressData} margin={{ top: 5, right: 24, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="uploadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tick={{ fill: "hsl(var(--foreground))", fontWeight: 500 }}
              />
              <YAxis
                yAxisId="left"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tick={{ fill: "hsl(var(--foreground))" }}
                label={{ value: "Count", angle: -90, position: "insideLeft" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tick={{ fill: "hsl(var(--foreground))" }}
                label={{ value: "Score %", angle: 90, position: "insideRight" }}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(0, 0, 0, 0.95)",
                  border: "2px solid hsl(var(--primary))",
                  borderRadius: "12px",
                  padding: "10px 14px",
                  boxShadow: "0 12px 32px rgba(99, 102, 241, 0.3)",
                }}
                labelStyle={{ color: "white", fontWeight: "bold" }}
                formatter={(value, name) => {
                  const names: Record<string, string> = {
                    uploads: "📤 Uploads",
                    cumulative: "📊 Cumulative",
                    score: "🎯 Latest Score",
                    analyses: "🔍 Analyses",
                    avgScore: "⭐ Avg Score",
                  };
                  return [value, names[name as string] || name];
                }}
              />
              <ReferenceLine yAxisId="left" y={0} stroke="hsl(var(--border))" />
              <Bar yAxisId="left" dataKey="uploads" fill="#8b5cf6" radius={[4, 4, 0, 0]} animationDuration={600} opacity={0.7} />
              <Area yAxisId="left" type="monotone" dataKey="cumulative" stroke="#6366f1" strokeWidth={3} fill="url(#uploadGradient)" animationDuration={800} />
              <Line yAxisId="right" type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 5, fill: "#22c55e" }} activeDot={{ r: 7 }} animationDuration={800} name="Score" />
              <Line yAxisId="right" type="monotone" dataKey="avgScore" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 5, fill: "#f59e0b" }} activeDot={{ r: 7 }} strokeDasharray="4 4" animationDuration={800} name="AvgScore" />
              <Legend verticalAlign="top" height={25} />
            </ComposedChart>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <TrendingUp className="h-10 w-10 mb-2 opacity-50" />
              <span className="text-sm">Upload resumes to see progress</span>
            </div>
          )}
        </ResponsiveContainer>
      ),
    },
    {
      id: "scores",
      title: "Score Distribution",
      subtitle: "ATS match scores",
      icon: Target,
      width: 380,
      content: (
        <ResponsiveContainer width="100%" height={240}>
          {scoreRanges.some((r) => r.value > 0) ? (
            <PieChart>
              <Pie
                data={scoreRanges.filter((r) => r.value > 0)}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                animationDuration={800}
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                labelLine={true}
              >
                {scoreRanges.filter((r) => r.value > 0).map((r, i) => (
                  <Cell key={i} fill={r.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "rgba(0, 0, 0, 0.9)",
                  border: "1px solid hsl(var(--primary))",
                  borderRadius: "12px",
                  padding: "8px 12px",
                  boxShadow: "0 8px 24px rgba(99, 102, 241, 0.2)",
                }}
                labelStyle={{ color: "white" }}
                formatter={(value) => `${value} scores`}
              />
              <Legend verticalAlign="bottom" height={20} />
            </PieChart>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Target className="h-10 w-10 mb-2 opacity-50" />
              <span className="text-sm">Score jobs to see distribution</span>
            </div>
          )}
        </ResponsiveContainer>
      ),
    },
  ];

  // Auto-scroll every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % graphs.length);
      scrollRef.current?.scrollTo({
        left: ((activeIndex + 1) % graphs.length) * 400,
        behavior: "smooth",
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [graphs.length, activeIndex]);

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
            Real-time analytics & performance metrics
          </p>
        </div>
        <div className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-lg border border-border/50">
          Auto-scrolling • Every 2 seconds
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto overflow-y-hidden pb-3 scroll-smooth"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "hsl(var(--primary),.3) transparent",
        }}
      >
        {graphs.map((g, idx) => {
          const Icon = g.icon;
          const isActive = activeIndex === idx;
          return (
            <motion.div
              key={g.id}
              initial={{ opacity: 0.5, scale: 0.95 }}
              animate={{ opacity: isActive ? 1 : 0.7, scale: isActive ? 1 : 0.95 }}
              transition={{ duration: 0.3 }}
              className={`flex-shrink-0 rounded-2xl border transition-all duration-300 p-6 ${
                isActive
                  ? "border-primary/50 bg-gradient-to-br from-primary/10 to-accent/10 shadow-xl shadow-primary/20"
                  : "border-border/30 bg-card hover:border-primary/20 hover:shadow-lg"
              }`}
              style={{ width: g.width, minWidth: g.width }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-bold text-base text-foreground">{g.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground px-0.5">{g.subtitle}</p>
                </div>
              </div>
              <div style={{ height: 240 }} className="rounded-xl overflow-hidden">
                {g.content}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Scroll indicators */}
      <div className="flex justify-center gap-2 pt-2">
        {graphs.map((_g, idx) => (
          <motion.div
            key={idx}
            className={`h-1.5 rounded-full transition-all ${
              activeIndex === idx
                ? "bg-gradient-to-r from-primary to-accent w-6"
                : "bg-secondary hover:bg-muted-foreground/50 w-1.5"
            }`}
            animate={{
              width: activeIndex === idx ? 24 : 6,
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </motion.div>
  );
}
