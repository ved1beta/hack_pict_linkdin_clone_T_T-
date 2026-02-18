"use client";

import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ResumeUploadATSProps {
  onUploadComplete?: (resumeId: string) => void;
  jobId?: string;
  jobTitle?: string;
  compact?: boolean;
}

export default function ResumeUploadATS({
  onUploadComplete,
  jobId,
  jobTitle,
  compact = false,
}: ResumeUploadATSProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [lastResumeId, setLastResumeId] = useState<string | null>(null);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const valid = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (!valid.includes(f.type)) {
      toast.error("Only PDF and DOCX files are allowed");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB");
      return;
    }
    setFile(f);
    setLastResumeId(null);
    setLastScore(null);
    setBreakdown(null);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Select a file first");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);

      const res = await fetch("/api/ats/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      const data = await res.json();
      setLastResumeId(data.resumeId);
      toast.success("Resume uploaded and parsed successfully!");
      onUploadComplete?.(data.resumeId);

      if (jobId && data.resumeId) {
        setScoring(true);
        const scoreRes = await fetch("/api/ats/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeUploadId: data.resumeId,
            jobId,
          }),
        });

        if (scoreRes.ok) {
          const scoreData = await scoreRes.json();
          setLastScore(scoreData.score);
          setBreakdown(scoreData.breakdown);
          toast.success(`ATS Score: ${scoreData.score}/100`);
        } else {
          const err = await scoreRes.json();
          toast.error(err.error || "Scoring failed");
        }
        setScoring(false);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <FileText className="h-4 w-4 mr-1" />
            {file ? file.name.slice(0, 20) + "..." : "Choose file"}
          </Button>
          <Button
            size="sm"
            onClick={handleUpload}
            disabled={!file || uploading || scoring}
          >
            {(uploading || scoring) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Upload className="h-4 w-4 mr-1" />
                Upload & Score
              </>
            )}
          </Button>
        </div>
        {lastScore !== null && (
          <p className="text-sm text-primary font-semibold">
            ATS Score: {lastScore}/100
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="card-modern p-6 space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        Upload Resume (ATS)
      </h3>
      <p className="text-sm text-muted-foreground">
        Upload PDF or DOCX. We extract text, parse with AI, and score against job
        descriptions. All processing stays on our platform.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {file ? file.name : "Choose PDF or DOCX"}
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!file || uploading || scoring}
        >
          {(uploading || scoring) ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {uploading ? "Uploading..." : scoring ? "Scoring..." : "Upload & Parse"}
        </Button>
      </div>

      {lastResumeId && (
        <div className="flex items-center gap-2 text-green-500 text-sm">
          <CheckCircle2 className="h-4 w-4" />
          Resume uploaded and parsed.
        </div>
      )}

      {jobId && jobTitle && lastScore !== null && (
        <div className="border border-border rounded-xl p-4 space-y-3">
          <h4 className="font-semibold">Score vs {jobTitle}</h4>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-primary">{lastScore}</div>
            <span className="text-muted-foreground">/ 100</span>
          </div>
          {breakdown && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Skill Match</p>
                <p className="font-medium">{breakdown.skillMatch}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Experience</p>
                <p className="font-medium">{breakdown.experienceMatch}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Education</p>
                <p className="font-medium">{breakdown.educationMatch}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Keywords</p>
                <p className="font-medium">{breakdown.keywordDensity}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Semantic</p>
                <p className="font-medium">{breakdown.semanticSimilarity}%</p>
              </div>
            </div>
          )}
          {breakdown?.missingSkills?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Missing skills to add
              </p>
              <div className="flex flex-wrap gap-1">
                {breakdown.missingSkills.map((s: string, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 text-xs"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
