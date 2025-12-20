"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "lucide-react";
import { toast } from "sonner";

interface ScheduleInterviewDialogProps {
  candidateId: string;
  candidateName: string;
  companyName: string;
  jobId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ScheduleInterviewDialog({
  candidateId,
  candidateName,
  companyName,
  jobId,
  isOpen,
  onClose,
  onSuccess,
}: ScheduleInterviewDialogProps) {
  const [loading, setLoading] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");

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
          candidateId,
          companyName,
          jobId,
          scheduledAt,
          notes,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Interview scheduled successfully!");
        setScheduledAt("");
        setNotes("");
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || "Failed to schedule interview");
      }
    } catch (error) {
      console.error("Schedule error:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Interview
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Scheduling interview with <span className="font-semibold">{candidateName}</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="datetime">Interview Date & Time</Label>
            <Input
              id="datetime"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional details about the interview..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={loading}>
            {loading ? "Scheduling..." : "Schedule Interview"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
