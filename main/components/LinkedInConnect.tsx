"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Linkedin, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function LinkedInConnect() {
  const { user } = useUser();
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    fetch("/api/users/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.user?.linkedInUrl) setUrl(data.user.linkedInUrl);
        if (data?.user?.linkedInText) setText(data.user.linkedInText);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    const trimmedUrl = url.trim();
    if (trimmedUrl && !trimmedUrl.includes("linkedin.com/in/")) {
      toast.error("Use format: https://linkedin.com/in/your-username");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          ...(trimmedUrl && { linkedInUrl: trimmedUrl }),
          linkedInText: text.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("LinkedIn profile saved. This will be used to generate your resume.");
    } catch {
      toast.error("Failed to save LinkedIn info");
    } finally {
      setSaving(false);
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
    <div className="card-modern p-6 space-y-5">
      <div>
        <h3 className="font-semibold flex items-center gap-2 mb-1">
          <Linkedin className="h-5 w-5 text-[#0A66C2]" />
          LinkedIn Profile
        </h3>
        <p className="text-sm text-muted-foreground">
          Add your LinkedIn URL and paste your profile summary/experience. This is combined with your GitHub data to build your resume.
        </p>
      </div>

      <div className="space-y-3">
        <Input
          placeholder="https://linkedin.com/in/your-username"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <Textarea
          placeholder={`Paste your LinkedIn About/Summary section and any key experience here, e.g.:
Software engineer with 2 years experience in React, Node.js, and MongoDB.
Education: B.Tech CS, XYZ University (2024)
Experience: SDE Intern at ABC Corp (June–Aug 2023) – built REST APIs...
Skills: React, TypeScript, Python, Docker`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          className="resize-none text-sm"
        />
        <p className="text-xs text-muted-foreground">
          The more detail you add, the better your AI-generated resumes will be.
        </p>
      </div>

      <Button onClick={handleSave} disabled={saving} className="btn-primary">
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        {saving ? "Saving..." : "Save LinkedIn Info"}
      </Button>
    </div>
  );
}
