"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Mail, Trophy, X } from "lucide-react";
import AssignmentDialog from "./AssignmentDialog";
import HackathonDialog from "./HackathonDialog";

interface BulkActionsBarProps {
  selectedCandidates: string[];
  allApplicants: any[];
  onClearSelection: () => void;
  jobId: string;
}

export default function BulkActionsBar({
  selectedCandidates,
  allApplicants,
  onClearSelection,
  jobId,
}: BulkActionsBarProps) {
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [showHackathonDialog, setShowHackathonDialog] = useState(false);

  if (selectedCandidates.length === 0) return null;

  const selectedApplicants = allApplicants.filter((app) =>
    selectedCandidates.includes(app.userId)
  );

  return (
    <>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-primary text-primary-foreground rounded-full shadow-2xl px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-white/20 text-white">
              {selectedCandidates.length}
            </Badge>
            <span className="font-semibold">
              {selectedCandidates.length === 1 ? "candidate" : "candidates"} selected
            </span>
          </div>

          <div className="h-6 w-px bg-white/30" />

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowAssignmentDialog(true)}
            className="bg-white/10 hover:bg-white/20 text-white border-white/30"
          >
            <Mail className="h-4 w-4 mr-2" />
            Send Assignment
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowHackathonDialog(true)}
            className="bg-white/10 hover:bg-white/20 text-white border-white/30"
          >
            <Trophy className="h-4 w-4 mr-2" />
            Schedule Hackathon
          </Button>

          <button
            onClick={onClearSelection}
            className="ml-2 hover:bg-white/10 rounded-full p-1 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <AssignmentDialog
        open={showAssignmentDialog}
        onClose={() => setShowAssignmentDialog(false)}
        selectedApplicants={selectedApplicants}
      />

      <HackathonDialog
        open={showHackathonDialog}
        onClose={() => setShowHackathonDialog(false)}
        selectedApplicants={selectedApplicants}
        jobId={jobId}
      />
    </>
  );
}

