"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { GraduationCap, Briefcase, Github } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AccountTypeSelectorProps {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
}

function AccountTypeSelector({ userId, email, firstName, lastName, imageUrl }: AccountTypeSelectorProps) {
  const [selected, setSelected] = useState<"student" | "recruiter" | null>(null);
  const [githubUsername, setGithubUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!selected) {
      toast.error("Please select an account type");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/users/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          email,
          firstName,
          lastName,
          userImage: imageUrl,
          userType: selected,
          ...(selected === "student" && githubUsername.trim() && { githubUsername: githubUsername.trim() }),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to setup account");
      }

      if (selected === "student" && githubUsername.trim()) {
        toast.info("Connecting GitHub & generating your profile...");
        const setupRes = await fetch("/api/github/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ githubUsername: githubUsername.trim() }),
        });
        if (setupRes.ok) {
          const setupData = await setupRes.json();
          toast.success(`Added ${setupData.addedRepos || 0} pinned repo(s)`);
          const genRes = await fetch("/api/github/generate-resume", { method: "POST" });
          if (genRes.ok) {
            toast.success("Resume generated from GitHub!");
          }
        }
      }

      toast.success(`Welcome! Your ${selected} account is ready 🎉`);
      router.refresh();
    } catch (error) {
      toast.error("Failed to setup account. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card-modern max-w-2xl w-full p-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold gradient-text">Welcome to HEXjuy&apos;s!</h2>
          <p className="text-muted-foreground">
            Let&apos;s set up your account. Choose your account type:
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Student Card */}
          <button
            onClick={() => setSelected("student")}
            className={`p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
              selected === "student"
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className={`p-4 rounded-full ${
                selected === "student" ? "bg-primary" : "bg-secondary"
              }`}>
                <GraduationCap className={`h-12 w-12 ${
                  selected === "student" ? "text-white" : "text-foreground"
                }`} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Student</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Connect with peers, showcase projects, find opportunities
                </p>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Auto-profile from GitHub</li>
                <li>✓ Join hackathon teams</li>
                <li>✓ Apply for jobs</li>
                <li>✓ Network with students</li>
              </ul>
            </div>
          </button>

          {/* Recruiter Card */}
          <button
            onClick={() => setSelected("recruiter")}
            className={`p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
              selected === "recruiter"
                ? "border-accent bg-accent/10"
                : "border-border hover:border-accent/50"
            }`}
          >
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className={`p-4 rounded-full ${
                selected === "recruiter" ? "bg-accent" : "bg-secondary"
              }`}>
                <Briefcase className={`h-12 w-12 ${
                  selected === "recruiter" ? "text-white" : "text-foreground"
                }`} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Recruiter</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Post jobs, find talented students, AI-powered matching
                </p>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Post job openings</li>
                <li>✓ AI candidate matching</li>
                <li>✓ Browse resumes</li>
                <li>✓ Direct messaging</li>
              </ul>
            </div>
          </button>
        </div>

        {selected === "student" && (
          <div className="space-y-2 p-4 rounded-xl border border-border bg-secondary/30">
            <label className="text-sm font-medium flex items-center gap-2">
              <Github className="h-4 w-4" />
              GitHub username (optional – auto-fills resume & repos)
            </label>
            <Input
              placeholder="e.g. octocat"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              className="max-w-xs"
            />
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!selected || loading}
          className="w-full btn-primary py-6 text-lg"
        >
          {loading ? "Setting up..." : "Continue"}
        </Button>
      </div>
    </div>
  );
}

export default AccountTypeSelector;