"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Github, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function GitHubConnect() {
  const { user } = useUser();
  const [githubUsername, setGithubUsername] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    fetch("/api/users/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user?.githubUsername) {
          setGithubUsername(data.user.githubUsername);
          setSaved(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleConnect = async () => {
    const trimmed = githubUsername.trim();
    if (!trimmed) {
      toast.error("Enter your GitHub username");
      return;
    }
    setSyncing(true);
    setStatus("Saving username & fetching repos…");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const setupRes = await fetch("/api/github/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUsername: trimmed }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const setupData = await setupRes.json();
      if (!setupRes.ok) throw new Error(setupData.error || "Setup failed");
      setSaved(true);
      toast.success(
        `Connected! Added ${setupData.addedRepos || 0} repo(s). Go to Analytics to generate insights.`
      );
      setStatus("");
    } catch (e: any) {
      clearTimeout(timeout);
      if (e?.name === "AbortError") {
        setStatus("Timed out – GitHub may be slow. Username was likely saved. Try again or go to Analytics.");
        toast.error("Timed out. Try again.");
      } else {
        setStatus("");
        toast.error(e instanceof Error ? e.message : "Failed to connect GitHub");
      }
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="card-modern p-6 flex gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading…
      </div>
    );
  }

  return (
    <div className="card-modern p-6 space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Github className="h-5 w-5 text-primary" />
        GitHub Profile
        {saved && (
          <span className="text-xs text-green-500 flex items-center gap-1 ml-2">
            <CheckCircle2 className="h-3.5 w-3.5" /> Connected
          </span>
        )}
      </h3>
      <p className="text-sm text-muted-foreground">
        Enter your GitHub username to import your top 3 repos. Resume & insights are generated on the Analytics page.
      </p>
      <div className="flex gap-2">
        <Input
          placeholder="GitHub username"
          value={githubUsername}
          onChange={(e) => setGithubUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleConnect()}
          className="flex-1"
        />
        <Button onClick={handleConnect} disabled={syncing || !githubUsername.trim()}>
          {syncing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1" />
          )}
          {syncing ? "Syncing…" : saved ? "Re-sync" : "Connect"}
        </Button>
      </div>
      {status && (
        <p className={`text-xs ${status.includes("Timed") ? "text-destructive" : "text-muted-foreground animate-pulse"}`}>
          {status}
        </p>
      )}
    </div>
  );
}
