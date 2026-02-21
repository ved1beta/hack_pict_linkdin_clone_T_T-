"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Github, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function GitHubConnect() {
  const { user } = useUser();
  const [githubUsername, setGithubUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    fetch("/api/users/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.user?.githubUsername) setGithubUsername(data.user.githubUsername);
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
    try {
      const setupRes = await fetch("/api/github/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUsername: trimmed }),
      });
      const setupData = await setupRes.json();
      if (!setupRes.ok) throw new Error(setupData.error || "Setup failed");
      toast.success(`Connected. Added ${setupData.addedRepos || 0} repo(s)`);

      const genRes = await fetch("/api/github/generate-resume", { method: "POST" });
      if (genRes.ok) {
        toast.success("Resume generated from GitHub!");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to connect GitHub");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="card-modern p-6 flex gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <div className="card-modern p-6 space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Github className="h-5 w-5 text-primary" />
        GitHub Profile
      </h3>
      <p className="text-sm text-muted-foreground">
        Connect GitHub to auto-import pinned repos and generate your resume. Insights use only your commits.
      </p>
      <div className="flex gap-2">
        <Input
          placeholder="GitHub username"
          value={githubUsername}
          onChange={(e) => setGithubUsername(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleConnect} disabled={syncing || !githubUsername.trim()}>
          {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {syncing ? "Syncing..." : "Connect & Generate"}
        </Button>
      </div>
    </div>
  );
}