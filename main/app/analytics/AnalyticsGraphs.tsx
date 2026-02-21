"use client";

import { useState, useEffect, useRef } from "react";
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
} from "recharts";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

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
  const sortedDates = dateOrder;

  let cumulative = 0;
  let progressData: ProgressData[] = sortedDates.map((d) => {
    cumulative += uploadsByDate[d];
    const scoreEntry = atsScores.find(
      (s) =>
        new Date(s.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }) === d
    );
    return {
      date: d,
      uploads: uploadsByDate[d],
      cumulative,
      score: scoreEntry?.score,
    };
  });

  if (progressData.length === 0 && resumeUploads.length > 0) {
    progressData = [
      {
        date: new Date(resumeUploads[0].createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        uploads: resumeUploads.length,
        cumulative: resumeUploads.length,
        score: atsScores[0]?.score,
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
      width: 380,
      content: (
        <ResponsiveContainer width="100%" height={200}>
          {gitRepoData.length > 0 ? (
            <BarChart
              data={gitRepoData}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={180}
                tickFormatter={(v) => truncate(v, 22)}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tick={{ fill: "hsl(var(--foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value, _name, props) => {
                  const p = props?.payload as GitRepoData;
                  return p?.languages ? `${p.name}: ${p.languages}` : `Languages: ${value ?? 0}`;
                }}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm text-center px-4">
              Add repos in Settings
            </div>
          )}
        </ResponsiveContainer>
      ),
    },
    {
      id: "progress",
      title: "Resume Progress",
      subtitle: "Uploads & scores over time",
      width: 380,
      content: (
        <ResponsiveContainer width="100%" height={200}>
          {progressData.length > 0 ? (
            <LineChart data={progressData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tick={{ fill: "hsl(var(--foreground))" }}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tick={{ fill: "hsl(var(--foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(_value, _name, props) => {
                  const p = props?.payload as ProgressData;
                  return p ? `Uploads: ${p.uploads}, Cumulative: ${p.cumulative}${p.score != null ? `, Score: ${p.score}%` : ""}` : "";
                }}
              />
              <Line type="monotone" dataKey="cumulative" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 5" />
            </LineChart>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm text-center px-4">
              Upload resumes to see progress
            </div>
          )}
        </ResponsiveContainer>
      ),
    },
    {
      id: "scores",
      title: "Score Distribution",
      subtitle: "ATS match scores",
      width: 340,
      content: (
        <ResponsiveContainer width="100%" height={200}>
          {scoreRanges.some((r) => r.value > 0) ? (
            <PieChart>
              <Pie
                data={scoreRanges.filter((r) => r.value > 0)}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {scoreRanges.filter((r) => r.value > 0).map((r, i) => (
                  <Cell key={i} fill={r.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm text-center px-4">
              Score jobs to see distribution
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
    <div className="card-modern p-6 space-y-4">
      <h2 className="text-xl font-bold">Insights at a Glance</h2>
      <p className="text-sm text-muted-foreground">
        Horizontally scrollable graphs — auto-advance every 2s
      </p>
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto overflow-y-hidden pb-2 scroll-smooth"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "hsl(var(--border)) transparent",
        }}
      >
        {graphs.map((g) => (
          <div
            key={g.id}
            className="flex-shrink-0 rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors"
            style={{ width: g.width, minWidth: g.width }}
          >
            <h3 className="font-semibold text-base mb-1 text-foreground">{g.title}</h3>
            <p className="text-xs text-muted-foreground mb-4">{g.subtitle}</p>
            <div style={{ height: 200 }}>{g.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
