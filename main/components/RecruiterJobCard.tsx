"use client";

import { IJobDocument } from "@/mongodb/models/job";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { MapPin, Users, Eye, X } from "lucide-react";
import Link from "next/link";
import ReactTimeago from "react-timeago";
import { useState } from "react";
import { toast } from "sonner";

interface RecruiterJobCardProps {
  job: IJobDocument;
}

function RecruiterJobCard({ job }: RecruiterJobCardProps) {
  const [isClosing, setIsClosing] = useState(false);

  const pendingCount = job.applications?.filter(
    (app) => app.status === "pending"
  ).length || 0;

  const handleCloseJob = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to close this job posting?"
    );
    if (!confirmed) return;

    setIsClosing(true);

    try {
      const response = await fetch(`/api/jobs/${job._id}/close`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to close job");
      }

      toast.success("Job closed successfully");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to close job");
      setIsClosing(false);
    }
  };

  return (
    <div className="card-modern p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-xl font-bold">{job.title}</h3>
            <Badge variant={job.status === "open" ? "default" : "secondary"}>
              {job.status}
            </Badge>
            {pendingCount > 0 && (
              <Badge variant="destructive">
                {pendingCount} pending
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {job.companyName} • {job.location}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Posted <ReactTimeago date={new Date(job.postedAt)} />
          </p>
        </div>

        {job.status === "open" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCloseJob}
            disabled={isClosing}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4 mr-1" />
            Close
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center space-x-6 text-sm text-muted-foreground">
        <div className="flex items-center">
          <Users className="h-4 w-4 mr-1.5" />
          {job.applications?.length || 0} applicants
        </div>
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-1.5" />
          {job.jobType}
        </div>
      </div>

      {/* Description Preview */}
      <p className="text-sm text-foreground line-clamp-2">
        {job.description}
      </p>

      {/* Skills */}
      {job.skills && job.skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {job.skills.slice(0, 4).map((skill, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
          {job.skills.length > 4 && (
            <Badge variant="secondary" className="text-xs">
              +{job.skills.length - 4}
            </Badge>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="pt-4 border-t border-border flex items-center space-x-3">
        <Link href={`/recruiter/jobs/${job._id}/applicants`} className="flex-1">
          <Button variant="default" className="w-full">
            <Eye className="h-4 w-4 mr-2" />
            View Applicants ({job.applications?.length || 0})
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default RecruiterJobCard;