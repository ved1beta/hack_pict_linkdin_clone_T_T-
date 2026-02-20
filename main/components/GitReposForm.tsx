"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Github, Plus, Trash2, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Repo {
  id: string;
  url: string;
  repoName: string;
  owner: string;
}

export default function GitReposForm() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchRepos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/git/repos");
      if (res.ok) {
        const data = await res.json();
        setRepos(data.repos || []);
      }
    } catch {
      toast.error("Failed to load repos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  const handleAdd = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      toast.error("Enter a GitHub URL");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/git/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add");
      setRepos((prev) => [data.repo, ...prev]);
      setUrl("");
      toast.success(`Added ${data.repo.repoName}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add repo");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/git/repos?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove");
      setRepos((prev) => prev.filter((r) => r.id !== id));
      toast.success("Repo removed");
    } catch {
      toast.error("Failed to remove repo");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="card-modern p-6 space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Github className="h-5 w-5 text-primary" />
        GitHub Repositories
      </h3>
      <p className="text-sm text-muted-foreground">
        Add public GitHub repo links. We&apos;ll analyze them for your portfolio score on the Analytics page.
      </p>

      <div className="flex gap-2">
        <Input
          placeholder="https://github.com/username/repo"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="flex-1"
        />
        <Button onClick={handleAdd} disabled={adding || !url.trim()}>
          {adding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      ) : repos.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          No repos added yet. Add your public GitHub repositories above.
        </p>
      ) : (
        <ul className="space-y-2">
          {repos.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Github className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:text-primary truncate block"
                  >
                    {r.owner}/{r.repoName}
                  </a>
                  <p className="text-xs text-muted-foreground truncate">{r.url}</p>
                </div>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 p-1 hover:bg-background rounded"
                >
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(r.id)}
                disabled={deleting === r.id}
              >
                {deleting === r.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 text-destructive" />
                )}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
