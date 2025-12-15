"use client";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { 
  Mail, 
  Calendar, 
  Download, 
  CheckCircle, 
  XCircle,
  Clock,
  ExternalLink
} from "lucide-react";
import ReactTimeago from "react-timeago";
import { useState } from "react";
import { toast } from "sonner";

interface ApplicantCardProps {
  applicant: {
    _id: string;
    userId: string;
    userName: string;
    userEmail: string;
    userImage?: string;
    resumeUrl?: string;
    appliedAt: string; // ISO string now
    status: "pending" | "reviewed" | "accepted" | "rejected";
    aiScore?: number;
  };
  jobId: string;
}
function ApplicantCard({ applicant, jobId }: ApplicantCardProps) {
  const [status, setStatus] = useState(applicant.status);
  const [loading, setLoading] = useState(false);

  const updateStatus = async (newStatus: "reviewed" | "accepted" | "rejected") => {
    setLoading(true);

    try {
      const response = await fetch(`/api/jobs/${jobId}/applicants/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({  
          userId: applicant.userId,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      setStatus(newStatus);
      toast.success(`Application ${newStatus}!`);
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    const variants = {
      pending: { variant: "secondary" as const, icon: <Clock className="h-3 w-3 mr-1" />, text: "Pending" },
      reviewed: { variant: "default" as const, icon: <CheckCircle className="h-3 w-3 mr-1" />, text: "Reviewed" },
      accepted: { variant: "default" as const, icon: <CheckCircle className="h-3 w-3 mr-1" />, text: "Accepted", color: "bg-green-500" },
      rejected: { variant: "destructive" as const, icon: <XCircle className="h-3 w-3 mr-1" />, text: "Rejected" },
    };

    const config = variants[status];

    return (
      <Badge variant={config.variant} className={config.color || ""}>
        {config.icon}
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="card-modern p-6 space-y-4 hover:border-primary/50 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16 ring-2 ring-primary/20">
            <AvatarImage src={applicant.userImage} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-semibold text-lg">
              {applicant.userName.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>

          <div>
            <h3 className="text-lg font-bold">{applicant.userName}</h3>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
              <Mail className="h-3 w-3" />
              <a 
                href={`mailto:${applicant.userEmail}`}
                className="hover:text-primary transition-colors"
              >
                {applicant.userEmail}
              </a>
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Calendar className="h-3 w-3 mr-1" />
              Applied <ReactTimeago date={new Date(applicant.appliedAt)} />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end space-y-2">
          {getStatusBadge()}
          {applicant.aiScore && (
            <Badge variant="secondary" className="bg-purple-500/10 text-purple-500">
              AI Score: {applicant.aiScore}%
            </Badge>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-3 pt-4 border-t border-border">
        {applicant.resumeUrl && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => window.open(applicant.resumeUrl, "_blank")}
          >
            <Download className="h-4 w-4 mr-2" />
            View Resume
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(`/profile/${applicant.userId}`, "_blank")}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Profile
        </Button>

        {status === "pending" && (
          <>
            <Button
              variant="default"
              size="sm"
              onClick={() => updateStatus("accepted")}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Accept
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => updateStatus("rejected")}
              disabled={loading}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </>
        )}

        {status === "reviewed" && (
          <>
            <Button
              variant="default"
              size="sm"
              onClick={() => updateStatus("accepted")}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              Accept
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => updateStatus("rejected")}
              disabled={loading}
            >
              Reject
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default ApplicantCard;