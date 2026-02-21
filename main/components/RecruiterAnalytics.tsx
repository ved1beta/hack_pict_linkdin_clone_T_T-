"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { Users, TrendingUp, Award, Target } from "lucide-react";

interface RecruiterAnalyticsProps {
  totalApplications: number;
  averageScore: number;
  statusDistribution: { name: string; value: number; color: string }[];
  scoreDistribution: { range: string; count: number }[];
  applicationsOverTime: { date: string; count: number }[];
}

export default function RecruiterAnalytics({
  totalApplications,
  averageScore,
  statusDistribution,
  scoreDistribution,
  applicationsOverTime,
}: RecruiterAnalyticsProps) {
  return (
    <div className="space-y-6">
      {/* Summary Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card-modern p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Average Match</p>
            <p className="text-3xl font-bold">{averageScore}%</p>
          </div>
        </div>
        <div className="card-modern p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-500/10">
            <Award className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Applicants</p>
            <p className="text-3xl font-bold">{totalApplications}</p>
          </div>
        </div>
      </div>

      {/* Applications Trend - Full Width Line Chart */}
      <div className="card-modern p-6">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Applications Over Time</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Daily application volume (last 30 days)</p>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={applicationsOverTime}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
              <XAxis 
                dataKey="date" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
                interval="preserveStartEnd"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                allowDecimals={false}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorCount)"
                dot={{ fill: "hsl(var(--primary))", r: 3 }}
                activeDot={{ r: 5 }}
                name="Applications"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column: Status + Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="card-modern p-6">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Application Status</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Breakdown by review status</p>
          
          {statusDistribution.length > 0 ? (
            <>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      itemStyle={{ color: "hsl(var(--foreground))" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 flex-wrap mt-2">
                {statusDistribution.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2 text-sm">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-muted-foreground">
                      {entry.name}: <span className="font-semibold text-foreground">{entry.value}</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
              No applications yet
            </div>
          )}
        </div>

        {/* AI Score Distribution */}
        <div className="card-modern p-6">
          <div className="flex items-center gap-2 mb-1">
            <Award className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">AI Match Scores</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Distribution of candidate match scores</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                <XAxis
                  dataKey="range"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--primary) / 0.05)" }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  name="Applicants"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
