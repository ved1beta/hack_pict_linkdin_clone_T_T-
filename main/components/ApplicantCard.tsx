"use client";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Mail, Calendar, Download, CheckCircle, XCircle, Clock, User, Star, Award, MapPin, Briefcase, GraduationCap, StarOff } from "lucide-react";
import ReactTimeago from "react-timeago";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface ApplicantCardProps {
  applicant: {
    _id: string;
    userId: string;
    userName: string;
    userEmail: string;
    userImage?: string;
    resumeUrl?: string;
    appliedAt: string;
    status: "pending" | "reviewed" | "accepted" | "rejected";
    aiScore?: number;
  };
  jobId: string;
  companyName: string;
}

function ApplicantCard({ applicant, jobId, companyName }: ApplicantCardProps) {
  const [status, setStatus] = useState(applicant.status);
  const [loading, setLoading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [candidate, setCandidate] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  
  const isRecommended = recommendations.some(rec => rec.companyName === companyName);

  // Load recommendations on mount
  useEffect(() => {
    loadRecommendations();
  }, [applicant.userId]);

  const loadRecommendations = async () => {
    setLoadingRecommendations(true);
    try {
      const res = await fetch(`/api/candidate/${applicant.userId}`);
      const data = await res.json();
      
      if (data.candidate?.recommendations) {
        setRecommendations(data.candidate.recommendations);
      } else {
        setRecommendations([]);
      }
    } catch (error) {
      console.error("Failed to load recommendations:", error);
      setRecommendations([]);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Fetch candidate profile when modal opens
  useEffect(() => {
    if (showProfileModal && applicant.userId) {
      fetchCandidate();
    }
  }, [showProfileModal, applicant.userId]);

  const fetchCandidate = async () => {
    setLoadingProfile(true);
    try {
      const res = await fetch(`/api/candidate/${applicant.userId}`);
      const data = await res.json();
      setCandidate(data.candidate);
      
      if (data.candidate?.recommendations) {
        setRecommendations(data.candidate.recommendations);
      }
    } catch (error) {
      console.error("Failed to fetch candidate:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  const updateStatus = async (newStatus: "reviewed" | "accepted" | "rejected") => {
    setLoading(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/applicants/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: applicant.userId, status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      setStatus(newStatus);
      toast.success(`Application ${newStatus}!`);
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleRecommend = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recruiter/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          candidateId: applicant.userId, // THIS IS THE CANDIDATE'S ID
          companyName, 
          jobId 
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.action === "removed") {
          toast.success("Recommendation removed");
        } else {
          toast.success(data.message);
        }
        // Reload recommendations immediately
        await loadRecommendations();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Failed to process recommendation");
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduledAt) {
      toast.error("Please select a date and time");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/recruiter/schedule-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: applicant.userId,
          candidateEmail: applicant.userEmail,
          candidateName: applicant.userName,
          companyName,
          jobId,
          scheduledAt,
          notes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Interview scheduled and email sent!");
        setScheduledAt("");
        setNotes("");
        setShowScheduleModal(false);
      } else {
        toast.error(data.error || "Failed to schedule");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    const variants = {
      pending: { 
        className: "bg-gray-100 text-gray-700 border-gray-300", 
        icon: <Clock className="h-3 w-3 mr-1" />, 
        text: "Pending" 
      },
      reviewed: { 
        className: "bg-blue-100 text-blue-700 border-blue-300", 
        icon: <CheckCircle className="h-3 w-3 mr-1" />, 
        text: "Reviewed" 
      },
      accepted: { 
        className: "bg-green-100 text-green-700 border-green-300", 
        icon: <CheckCircle className="h-3 w-3 mr-1" />, 
        text: "Accepted" 
      },
      rejected: { 
        className: "bg-red-100 text-red-700 border-red-300", 
        icon: <XCircle className="h-3 w-3 mr-1" />, 
        text: "Rejected" 
      },
    };
    const config = variants[status];
    return (
      <Badge variant="outline" className={config.className}>
        {config.icon}
        {config.text}
      </Badge>
    );
  };

  return (
    <>
      <div className="bg-card border rounded-lg p-6 space-y-4 hover:border-primary/50 transition-all shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 ring-2 ring-primary/20">
              <AvatarImage src={applicant.userImage} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-semibold text-lg">
                {applicant.userName.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-bold text-foreground">{applicant.userName}</h3>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                <Mail className="h-3 w-3" />
                <a href={`mailto:${applicant.userEmail}`} className="hover:text-primary transition-colors">
                  {applicant.userEmail}
                </a>
              </div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Calendar className="h-3 w-3 mr-1" />
                Applied <ReactTimeago date={new Date(applicant.appliedAt)} />
              </div>
              
              {/* Show ALL recommendations */}
              {!loadingRecommendations && recommendations.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {recommendations.map((rec: any, idx: number) => (
                    <Badge key={idx} variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                      <Award className="h-2.5 w-2.5 mr-1" />
                      {rec.companyName}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            {getStatusBadge()}
            {applicant.aiScore && (
              <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                AI Score: {applicant.aiScore}%
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 pt-4 border-t border-border">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-background"
            onClick={() => setShowProfileModal(true)}
          >
            <User className="h-4 w-4 mr-1" />
            Profile
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRecommend} 
            disabled={loading || loadingRecommendations}
            className={
              isRecommended 
                ? "bg-green-50 text-green-700 border-green-300 hover:bg-green-100" 
                : "bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100"
            }
          >
            {isRecommended ? (
              <>
                <StarOff className="h-4 w-4 mr-1" />
                Remove Recommendation
              </>
            ) : (
              <>
                <Star className="h-4 w-4 mr-1" />
                Recommend
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-background"
            onClick={() => setShowScheduleModal(true)}
          >
            <Calendar className="h-4 w-4 mr-1" />
            Schedule
          </Button>
          
          {applicant.resumeUrl && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open(applicant.resumeUrl, "_blank")}
            >
              <Download className="h-4 w-4 mr-2" />
              Resume
            </Button>
          )}
          
          {status === "pending" && (
            <>
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => updateStatus("accepted")} 
                disabled={loading} 
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Accept
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => updateStatus("rejected")} 
                disabled={loading}
                className="bg-red-600 hover:bg-red-700"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowProfileModal(false)}>
          <div className="bg-card rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold">Candidate Profile</h2>
              <button onClick={() => setShowProfileModal(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {loadingProfile ? (
              <div className="space-y-4">
                <div className="h-20 w-20 rounded-full bg-muted animate-pulse" />
                <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                <div className="h-4 w-64 bg-muted animate-pulse rounded" />
              </div>
            ) : candidate ? (
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20 ring-4 ring-primary/20">
                    <AvatarImage src={candidate.userImage} />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-accent text-white">
                      {candidate.firstName?.charAt(0)}{candidate.lastName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold">{candidate.firstName} {candidate.lastName}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {candidate.email}
                      </span>
                      {candidate.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {candidate.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {recommendations.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      Recommendations ({recommendations.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {recommendations.map((rec: any, idx: number) => (
                        <Badge key={idx} variant="outline" className="bg-green-100 text-green-700 border-green-300">
                          <Award className="h-3 w-3 mr-1" />
                          ✓ {rec.companyName}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {candidate.bio && (
                  <div>
                    <h4 className="text-lg font-semibold mb-2">About</h4>
                    <p className="text-muted-foreground">{candidate.bio}</p>
                  </div>
                )}

                {candidate.experience && (
                  <div>
                    <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Experience
                    </h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">{candidate.experience}</p>
                  </div>
                )}

                {candidate.education && (
                  <div>
                    <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Education
                    </h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">{candidate.education}</p>
                  </div>
                )}

                {candidate.skills && candidate.skills.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold mb-3">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map((skill: string, idx: number) => (
                        <Badge key={idx} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">Candidate not found</p>
            )}
          </div>
        </div>
      )}

      {/* Schedule Modal - Same as before */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowScheduleModal(false)}>
          <div className="bg-card rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule Interview
              </h2>
              <button onClick={() => setShowScheduleModal(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Scheduling interview with <strong>{applicant.userName}</strong>
              </p>

              <div className="space-y-2">
                <label htmlFor="datetime" className="text-sm font-medium">Interview Date & Time</label>
                <input
                  id="datetime"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</label>
                <textarea
                  id="notes"
                  placeholder="Add any additional details about the interview..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSchedule} disabled={loading}>
                  {loading ? "Scheduling..." : "Schedule Interview"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ApplicantCard;
