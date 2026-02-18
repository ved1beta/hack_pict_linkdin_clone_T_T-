"use client";

import { IJobDocument } from "@/mongodb/models/job";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { MapPin, Briefcase, Clock, DollarSign, Users, BarChart3 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import ReactTimeago from "react-timeago";
import ResumeUploadATS from "./ResumeUploadATS";

interface JobCardProps {
  job: IJobDocument;
  currentUserId: string;
}

function JobCard({ job, currentUserId }: JobCardProps) {
  const [applying, setApplying] = useState(false);
  const [showAts, setShowAts] = useState(false);

  const hasApplied = job.applications?.some(
    (app) => app.userId === currentUserId
  );

  const handleApply = async () => {
    if (hasApplied) {
      toast.info("You've already applied to this job");
      return;
    }

    setApplying(true);

    try {
      const response = await fetch(`/api/jobs/${job._id}/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: currentUserId }),
      });

      if (!response.ok) {
        throw new Error("Failed to apply");
      }

      toast.success("Application submitted successfully! 🎉");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to apply. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="card-modern p-6 space-y-4 hover:border-primary/50 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="h-14 w-14 ring-2 ring-primary/20">
            <AvatarImage src={job.companyLogo || job.recruiterImage} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-semibold">
              {job.companyName.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div>
            <h3 className="text-xl font-bold hover:text-primary cursor-pointer transition-colors">
              {job.title}
            </h3>
            <p className="text-sm text-muted-foreground">{job.companyName}</p>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <Clock className="h-3 w-3 mr-1" />
              Posted <ReactTimeago date={new Date(job.postedAt)} />
            </p>
          </div>
        </div>

        <Badge variant={hasApplied ? "secondary" : "default"}>
          {hasApplied ? "Applied" : "Open"}
        </Badge>
      </div>

      {/* Job Details */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-1.5" />
          {job.location}
        </div>
        <div className="flex items-center">
          <Briefcase className="h-4 w-4 mr-1.5" />
          {job.jobType}
        </div>
        {job.salary && (
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-1.5" />
            {job.salary}
          </div>
        )}
        <div className="flex items-center">
          <Users className="h-4 w-4 mr-1.5" />
          {job.applications?.length || 0} applicants
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-foreground line-clamp-3">{job.description}</p>

      {/* Skills */}
      {job.skills && job.skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {job.skills.slice(0, 5).map((skill, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
          {job.skills.length > 5 && (
            <Badge variant="secondary" className="text-xs">
              +{job.skills.length - 5} more
            </Badge>
          )}
        </div>
      )}

      {/* ATS Score - expandable */}
      {!hasApplied && (
        <div className="border-t border-border pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => setShowAts(!showAts)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {showAts ? "Hide" : "Check"} ATS match score
          </Button>
          {showAts && (
            <div className="mt-3 p-3 bg-secondary/50 rounded-lg">
              <ResumeUploadATS
                jobId={job._id?.toString()}
                jobTitle={job.title}
                compact
              />
            </div>
          )}
        </div>
      )}

      {/* Action Button */}
      <div className="pt-2 border-t border-border">
        <Button
          onClick={handleApply}
          disabled={applying || hasApplied}
          className={hasApplied ? "btn-secondary w-full" : "btn-primary w-full"}
        >
          {applying
            ? "Applying..."
            : hasApplied
            ? "Already Applied"
            : "Apply Now"}
        </Button>
      </div>
    </div>
  );
}

export default JobCard;