"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { Trophy, X } from "lucide-react";

interface HackathonDialogProps {
  open: boolean;
  onClose: () => void;
  selectedApplicants: any[];
  jobId: string;
}

export default function HackathonDialog({
  open,
  onClose,
  selectedApplicants,
  jobId,
}: HackathonDialogProps) {
  const [loading, setLoading] = useState(false);
  const [prizes, setPrizes] = useState<string[]>([]);
  const [currentPrize, setCurrentPrize] = useState("");
  const [requirements, setRequirements] = useState<string[]>([]);
  const [currentRequirement, setCurrentRequirement] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "online" as "online" | "offline",
    venue: "",
    date: "",
    startTime: "",
    endTime: "",
    duration: "",
    maxParticipants: selectedApplicants.length,
  });

  const addPrize = () => {
    if (currentPrize.trim() && !prizes.includes(currentPrize.trim())) {
      setPrizes([...prizes, currentPrize.trim()]);
      setCurrentPrize("");
    }
  };

  const removePrize = (prize: string) => {
    setPrizes(prizes.filter((p) => p !== prize));
  };

  const addRequirement = () => {
    if (currentRequirement.trim()) {
      setRequirements([...requirements, currentRequirement.trim()]);
      setCurrentRequirement("");
    }
  };

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const candidateIds = selectedApplicants.map((app) => app.userId);

      const response = await fetch("/api/hackathon/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidateIds,
          ...formData,
          prizes,
          requirements,
          jobId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create hackathon");
      }

      toast.success(`Hackathon scheduled with ${selectedApplicants.length} participant(s)!`);
      onClose();
      // Reset form
      setFormData({
        title: "",
        description: "",
        type: "online",
        venue: "",
        date: "",
        startTime: "",
        endTime: "",
        duration: "",
        maxParticipants: selectedApplicants.length,
      });
      setPrizes([]);
      setRequirements([]);
    } catch (error: any) {
      toast.error(error.message || "Failed to create hackathon");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Schedule Hackathon for {selectedApplicants.length} Candidate(s)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Hackathon Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., 24-Hour Coding Challenge"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the hackathon..."
                rows={4}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as "online" | "offline" })
                }
                className="input-modern w-full"
                required
                disabled={loading}
              >
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>

            {formData.type === "offline" && (
              <div className="space-y-2">
                <Label htmlFor="venue">Venue *</Label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="e.g., Tech Hub, Building A"
                  required={formData.type === "offline"}
                  disabled={loading}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                disabled={loading}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration *</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="e.g., 24 hours, 2 days"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Max Participants</Label>
              <Input
                id="maxParticipants"
                type="number"
                value={formData.maxParticipants}
                onChange={(e) =>
                  setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })
                }
                min={selectedApplicants.length}
                disabled={loading}
              />
            </div>
          </div>

          {/* Prizes */}
          <div className="space-y-2">
            <Label>Prizes</Label>
            <div className="flex space-x-2">
              <Input
                value={currentPrize}
                onChange={(e) => setCurrentPrize(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addPrize())}
                placeholder="e.g., 1st Prize: $10,000"
                disabled={loading}
              />
              <Button type="button" onClick={addPrize} variant="secondary" disabled={loading}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {prizes.map((prize) => (
                <Badge key={prize} variant="secondary" className="pl-3 pr-1 py-1">
                  {prize}
                  <button
                    type="button"
                    onClick={() => removePrize(prize)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-2">
            <Label>Requirements</Label>
            <div className="flex space-x-2">
              <Input
                value={currentRequirement}
                onChange={(e) => setCurrentRequirement(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addRequirement())}
                placeholder="e.g., Laptop required"
                disabled={loading}
              />
              <Button
                type="button"
                onClick={addRequirement}
                variant="secondary"
                disabled={loading}
              >
                Add
              </Button>
            </div>
            <ul className="space-y-1 mt-2">
              {requirements.map((req, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm">
                  <span className="text-primary">•</span>
                  <span className="flex-1">{req}</span>
                  <button
                    type="button"
                    onClick={() => removeRequirement(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Scheduling..." : "Schedule Hackathon"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


