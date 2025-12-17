"use client";

import { IJobDocument } from "@/mongodb/models/job";
import SwipeCard from "@/components/SwipeCard";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { 
  Flame, 
  Briefcase, 
  ArrowLeft, 
  RotateCcw,
  Sparkles,
  CheckCircle,
  XCircle
} from "lucide-react";
import Link from "next/link";

interface SwipeContainerProps {
  jobs: IJobDocument[];
  currentUserId: string;
  userEmail: string;
  userName: string;
  userImage?: string;
}

export default function SwipeContainer({
  jobs,
  currentUserId,
  userEmail,
  userName,
  userImage,
}: SwipeContainerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipedJobs, setSwipedJobs] = useState<{ id: string; direction: "left" | "right" }[]>([]);
  const [applying, setApplying] = useState(false);

  const currentJob = jobs[currentIndex];
  const appliedCount = swipedJobs.filter((j) => j.direction === "right").length;
  const skippedCount = swipedJobs.filter((j) => j.direction === "left").length;

  const handleSwipe = async (direction: "left" | "right", jobId: string) => {
    if (direction === "right") {
      setApplying(true);
      try {
        const response = await fetch(`/api/jobs/${jobId}/apply`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: currentUserId,
            userName,
            userEmail,
            userImage,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to apply");
        }

        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <span>Application sent! Good luck 🎉</span>
          </div>
        );
      } catch (error) {
        toast.error("Failed to apply. Please try again.");
      } finally {
        setApplying(false);
      }
    } else {
      toast(
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-rose-400" />
          <span>Job skipped</span>
        </div>
      );
    }

    setSwipedJobs((prev) => [...prev, { id: jobId, direction }]);
    
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 200);
  };

  const handleUndo = () => {
    if (swipedJobs.length === 0 || currentIndex === 0) return;
    
    setSwipedJobs((prev) => prev.slice(0, -1));
    setCurrentIndex((prev) => prev - 1);
    toast.info("Undo successful!");
  };

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6"
        >
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary/20 to-accent/20 
                        rounded-full flex items-center justify-center">
            <Briefcase className="h-16 w-16 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">No jobs available</h2>
          <p className="text-muted-foreground max-w-md">
            You&apos;ve already applied to all available jobs, or no jobs have been posted yet.
            Check back soon!
          </p>
          <Link 
            href="/jobs"
            className="inline-flex items-center gap-2 btn-primary mt-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Link>
        </motion.div>
      </div>
    );
  }

  if (currentIndex >= jobs.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6"
        >
          <motion.div 
            className="w-32 h-32 mx-auto bg-gradient-to-br from-emerald-500/20 to-primary/20 
                      rounded-full flex items-center justify-center"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles className="h-16 w-16 text-emerald-400" />
          </motion.div>
          <h2 className="text-3xl font-bold gradient-text">All caught up!</h2>
          <p className="text-muted-foreground max-w-md">
            You&apos;ve swiped through all available jobs.
          </p>
          
          {/* Stats */}
          <div className="flex justify-center gap-8 py-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-400">{appliedCount}</div>
              <div className="text-sm text-muted-foreground">Applied</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-rose-400">{skippedCount}</div>
              <div className="text-sm text-muted-foreground">Skipped</div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/jobs"
              className="inline-flex items-center justify-center gap-2 btn-secondary"
            >
              <Briefcase className="h-4 w-4" />
              View All Jobs
            </Link>
            <button
              onClick={() => {
                setCurrentIndex(0);
                setSwipedJobs([]);
              }}
              className="inline-flex items-center justify-center gap-2 btn-primary"
            >
              <RotateCcw className="h-4 w-4" />
              Start Over
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/jobs"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Jobs</span>
            </Link>
            
            <div className="flex items-center gap-2">
              <Flame className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg gradient-text">Job Swipe</span>
            </div>

            <button
              onClick={handleUndo}
              disabled={swipedJobs.length === 0}
              className="p-2 rounded-full hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentIndex + 1) / jobs.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {currentIndex + 1}/{jobs.length}
            </span>
          </div>
        </div>
      </div>

      {/* Card Stack */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="relative w-full max-w-md h-[600px]">
          <AnimatePresence mode="wait">
            {currentJob && (
              <SwipeCard
                key={currentJob._id.toString()}
                job={currentJob}
                onSwipe={handleSwipe}
                isTop={true}
              />
            )}
          </AnimatePresence>
          
          {applying && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-3xl z-50">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">Sending application...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Footer */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-lg border-t border-border">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex justify-center gap-12">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-rose-500/10">
                <XCircle className="h-5 w-5 text-rose-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-rose-400">{skippedCount}</div>
                <div className="text-xs text-muted-foreground">Skipped</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-emerald-500/10">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-emerald-400">{appliedCount}</div>
                <div className="text-xs text-muted-foreground">Applied</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions Overlay - shows briefly on first load */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 2.5, duration: 0.5 }}
        className="fixed inset-0 pointer-events-none flex items-end justify-center pb-40"
        style={{ zIndex: 60 }}
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-card/90 backdrop-blur-md px-6 py-3 rounded-full border border-border shadow-xl"
        >
          <p className="text-sm text-muted-foreground">
            👈 <span className="text-rose-400">Swipe left</span> to skip • 
            <span className="text-emerald-400"> Swipe right</span> to apply 👉
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

