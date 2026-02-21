"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import { Mail } from "lucide-react";

interface AssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  selectedApplicants: any[];
}

export default function AssignmentDialog({
  open,
  onClose,
  selectedApplicants,
}: AssignmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    assignmentLink: "",
    deadline: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const candidateIds = selectedApplicants.map((app) => app.userId);

      const response = await fetch("/api/recruiter/send-assignment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidateIds,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send assignment");
      }

      toast.success(`Assignment sent to ${selectedApplicants.length} candidate(s)!`);
      onClose();
      setFormData({
        subject: "",
        message: "",
        assignmentLink: "",
        deadline: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to send assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Assignment to {selectedApplicants.length} Candidate(s)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g., Coding Assignment for Software Engineer Role"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Write your message here..."
              rows={6}
              required
              disabled={loading}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignmentLink">Assignment Link</Label>
            <Input
              id="assignmentLink"
              type="url"
              value={formData.assignmentLink}
              onChange={(e) => setFormData({ ...formData, assignmentLink: e.target.value })}
              placeholder="https://..."
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Assignment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

