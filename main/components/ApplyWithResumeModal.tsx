"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Loader2,
  Sparkles,
  Upload,
  FileText,
  Github,
  Linkedin,
  CheckCircle2,
  Edit3,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface Job {
  _id: string;
  title: string;
  companyName: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  job: Job;
  currentUserId: string;
  onApplied: () => void;
}

type Tab = "ai" | "upload";

export default function ApplyWithResumeModal({
  open,
  onClose,
  job,
  currentUserId,
  onApplied,
}: Props) {
  const [tab, setTab] = useState<Tab>("ai");
  const [generating, setGenerating] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [genError, setGenError] = useState("");
  const [applying, setApplying] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Auto-generate when modal opens
  useEffect(() => {
    if (!open || !job._id) return;
    setResumeText("");
    setGenError("");
    setFile(null);
    setTab("ai");
    generateResume();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, job._id]);

  const generateResume = async () => {
    setGenerating(true);
    setGenError("");
    try {
      const res = await fetch("/api/resume/generate-for-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setResumeText(data.resumeText || "");
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Could not generate resume");
    } finally {
      setGenerating(false);
    }
  };

  const handleApplyWithAI = async () => {
    if (!resumeText.trim()) {
      toast.error("Resume is empty");
      return;
    }
    setApplying(true);
    try {
      const res = await fetch(`/api/jobs/${job._id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId, resumeText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Application failed");
      toast.success("Application submitted!");
      onApplied();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to apply");
    } finally {
      setApplying(false);
    }
  };

  const handleApplyWithFile = async () => {
    if (!file) {
      toast.error("Select a PDF or DOCX file");
      return;
    }
    setUploading(true);
    try {
      // Upload resume first
      const formData = new FormData();
      formData.append("resume", file);
      const uploadRes = await fetch("/api/ats/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

      // Then apply
      const applyRes = await fetch(`/api/jobs/${job._id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId }),
      });
      const applyData = await applyRes.json();
      if (!applyRes.ok) throw new Error(applyData.error || "Application failed");
      toast.success("Resume uploaded & application submitted!");
      onApplied();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Apply to {job.title} · {job.companyName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Your resume is generated from your GitHub repos and LinkedIn profile.
          </p>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border pb-2">
          <button
            onClick={() => setTab("ai")}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
              tab === "ai"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            AI-Generated Resume
          </button>
          <button
            onClick={() => setTab("upload")}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
              tab === "upload"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Upload className="h-4 w-4" />
            Upload PDF / Manual
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
          {tab === "ai" && (
            <>
              {/* Source badges */}
              <div className="flex gap-2 flex-wrap text-xs">
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                  <Github className="h-3 w-3" />
                  GitHub repos
                </span>
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                  <Linkedin className="h-3 w-3 text-[#0A66C2]" />
                  LinkedIn profile
                </span>
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  Uploaded resume
                </span>
              </div>

              {generating ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
                  <div className="relative">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <Sparkles className="h-4 w-4 text-primary absolute -top-1 -right-1" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">
                      Crafting your resume for {job.title}...
                    </p>
                    <p className="text-sm mt-1">
                      Combining GitHub projects, LinkedIn experience, and job requirements
                    </p>
                  </div>
                </div>
              ) : genError ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                  <p className="text-sm text-muted-foreground">{genError}</p>
                  <Button variant="outline" size="sm" onClick={generateResume}>
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium flex items-center gap-2 text-green-500">
                      <CheckCircle2 className="h-4 w-4" />
                      Resume generated — edit as needed
                    </p>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={generateResume}
                        className="text-xs text-muted-foreground"
                      >
                        Regenerate
                      </Button>
                    </div>
                  </div>
                  <div className="relative">
                    <Edit3 className="h-3.5 w-3.5 text-muted-foreground absolute top-3 right-3" />
                    <Textarea
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      rows={18}
                      className="font-mono text-xs leading-relaxed resize-none pr-8"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tip: Add your LinkedIn profile text in Settings → LinkedIn for richer resume generation.
                  </p>
                </div>
              )}
            </>
          )}

          {tab === "upload" && (
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Upload a PDF or DOCX resume. It will be saved to your profile and used for this application.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium">
                  {file ? file.name : "Click to choose PDF or DOCX"}
                </p>
                {!file && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Max 5MB
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="border-t border-border pt-4 gap-2">
          <Button variant="outline" onClick={onClose} disabled={applying || uploading}>
            Cancel
          </Button>
          {tab === "ai" ? (
            <Button
              onClick={handleApplyWithAI}
              disabled={applying || generating || !resumeText.trim()}
              className="btn-primary"
            >
              {applying ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {applying ? "Submitting..." : "Apply with this Resume"}
            </Button>
          ) : (
            <Button
              onClick={handleApplyWithFile}
              disabled={uploading || !file}
              className="btn-primary"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {uploading ? "Uploading..." : "Upload & Apply"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
