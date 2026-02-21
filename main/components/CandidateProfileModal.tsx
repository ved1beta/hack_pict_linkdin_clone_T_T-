"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Mail, MapPin, Award, Briefcase, Star, GraduationCap, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";

const AnalyticsGraphs = dynamic(() => import("@/app/analytics/AnalyticsGraphs"), { ssr: false });

interface CandidateProfileModalProps {
  candidateId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CandidateProfileModal({
  candidateId,
  isOpen,
  onClose,
}: CandidateProfileModalProps) {
  const [candidate, setCandidate] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && candidateId) {
      fetchCandidate();
      fetchAnalytics();
    }
  }, [isOpen, candidateId]);

  const fetchCandidate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/candidate/${candidateId}`);
      const data = await res.json();
      setCandidate(data.candidate);
    } catch (error) {
      console.error("Failed to fetch candidate:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/candidate/${candidateId}/analytics`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Candidate Profile</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        ) : candidate ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 ring-4 ring-primary/20">
                <AvatarImage src={candidate.userImage} alt={candidate.firstName} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-accent text-white">
                  {candidate.firstName?.charAt(0)}{candidate.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{candidate.firstName} {candidate.lastName}</h2>
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

            {/* Recommendations */}
            {candidate.recommendations && candidate.recommendations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Recommendations
                </h3>
                <div className="flex flex-wrap gap-2">
                  {candidate.recommendations.map((rec: any, idx: number) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="bg-green-500/10 text-green-700 border-green-500/20"
                    >
                      <Award className="h-3 w-3 mr-1" />
                      ✓ Recommended by {rec.companyName}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Scheduled Interviews */}
            {candidate.interviews && candidate.interviews.filter((int: any) => int.status === 'SCHEDULED').length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  Scheduled Interviews
                </h3>
                <div className="space-y-2">
                  {candidate.interviews
                    .filter((int: any) => int.status === 'SCHEDULED')
                    .map((interview: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{interview.companyName}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(interview.scheduledAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline">{interview.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bio */}
            {candidate.bio && (
              <div>
                <h3 className="text-lg font-semibold mb-2">About</h3>
                <p className="text-muted-foreground">{candidate.bio}</p>
              </div>
            )}

            {/* Experience */}
            {candidate.experience && (
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Experience
                </h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{candidate.experience}</p>
              </div>
            )}

            {/* Education */}
            {candidate.education && (
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Education
                </h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{candidate.education}</p>
              </div>
            )}

            {/* Skills */}
            {candidate.skills && candidate.skills.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill: string, idx: number) => (
                    <Badge key={idx} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Candidate Analytics - visible to recruiter */}
            {analytics && (
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Candidate Insights
                </h3>
                <AnalyticsGraphs
                  resumeUploads={analytics.resumeUploads || []}
                  atsScores={analytics.atsScores || []}
                  gitRepos={analytics.gitRepos || []}
                  gitAnalysis={analytics.gitAnalysis || null}
                />
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">Candidate not found</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
