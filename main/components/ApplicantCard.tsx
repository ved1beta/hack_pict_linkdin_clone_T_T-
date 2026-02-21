"use client";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Mail, Calendar, Download, CheckCircle, XCircle, Clock, User, Star, Award, MapPin, Briefcase, GraduationCap, StarOff, BarChart3, Sparkles, ChevronDown, ChevronUp, Shield } from "lucide-react";
import dynamic from "next/dynamic";

const AnalyticsGraphs = dynamic(() => import("@/app/analytics/AnalyticsGraphs"), { ssr: false });
const GitHubContribGraph = dynamic(() => import("@/components/GitHubContribGraph"), { ssr: false });
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
    collegeVerified?: boolean;
    collegeName?: string;
  };
  jobId: string;
  companyName: string;
}

function ApplicantCard({ applicant, jobId, companyName }: ApplicantCardProps) {
  const [status, setStatus] = useState(applicant.status);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [candidate, setCandidate] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  
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

  // Fetch candidate profile + analytics when expanded
  useEffect(() => {
    if (expanded && !candidate) {
      fetchCandidate();
    }
  }, [expanded]);

  const fetchCandidate = async () => {
    setLoadingProfile(true);
    setAnalytics(null);
    try {
      const [candRes, analyticsRes] = await Promise.all([
        fetch(`/api/candidate/${applicant.userId}`),
        fetch(`/api/candidate/${applicant.userId}/analytics`),
      ]);
      const candData = await candRes.json();
      setCandidate(candData.candidate);
      if (candData.candidate?.recommendations) {
        setRecommendations(candData.candidate.recommendations);
      }
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
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
          candidateId: applicant.userId,
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
      <div className="bg-card border rounded-lg overflow-hidden hover:border-primary/50 transition-all shadow-sm">
        {/* Main Row - Always visible */}
        <div className="p-6 space-y-4">
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
                
                {/* College Verification Badge - Show immediately if verified */}
                {(applicant.collegeVerified || candidate?.collegeVerification?.status === "approved") && (
                  <div className="mt-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-xs">
                      <Shield className="h-2.5 w-2.5 mr-1" />
                      Verified Student - {applicant.collegeName || candidate?.collegeVerification?.collegeName}
                    </Badge>
                  </div>
                )}
                
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
              {typeof applicant.aiScore === 'number' && (
                <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300 font-semibold">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Match: {applicant.aiScore}%
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 pt-4 border-t border-border">
            {/* Expand/Collapse Button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-background"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
              {expanded ? "Collapse" : "View Details"}
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
                  Remove Rec
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

        {/* Expandable Details Section */}
        {expanded && (
          <div className="border-t border-border bg-secondary/20 p-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
            {loadingProfile ? (
              <div className="space-y-4">
                <div className="h-20 w-20 rounded-full bg-muted animate-pulse" />
                <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                <div className="h-4 w-64 bg-muted animate-pulse rounded" />
              </div>
            ) : candidate ? (
              <>
                {/* Profile Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  {candidate.bio && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">About</h4>
                      <p className="text-sm text-foreground">{candidate.bio}</p>
                    </div>
                  )}

                  {candidate.experience && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" />
                        Experience
                      </h4>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{candidate.experience}</p>
                    </div>
                  )}

                  {candidate.education && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                        <GraduationCap className="h-3.5 w-3.5" />
                        Education
                      </h4>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{candidate.education}</p>
                    </div>
                  )}

                  {candidate.location && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        Location
                      </h4>
                      <p className="text-sm text-foreground">{candidate.location}</p>
                    </div>
                  )}
                </div>

                {candidate.skills && candidate.skills.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map((skill: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {recommendations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-yellow-500" />
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

                {/* Candidate Analytics - Charts */}
                {analytics && (
                  <div className="pt-4 border-t border-border space-y-4">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      Candidate Insights & Analytics
                    </h4>
                    <AnalyticsGraphs
                      resumeUploads={analytics.resumeUploads || []}
                      atsScores={analytics.atsScores || []}
                      gitRepos={analytics.gitRepos || []}
                      gitAnalysis={analytics.gitAnalysis || null}
                    />
                    {analytics.gitHubUsername && (
                      <GitHubContribGraph initialUsername={analytics.gitHubUsername} compact />
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="text-center text-muted-foreground py-4">Candidate not found</p>
            )}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
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
