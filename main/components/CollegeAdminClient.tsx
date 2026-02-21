"use client";

import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import {
  User,
  Mail,
  GraduationCap,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  CreditCard,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface VerificationRequest {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  collegeName: string;
  collegeEmail: string;
  studentId: string;
  department?: string;
  graduationYear?: number;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
}

interface CollegeAdminClientProps {
  requests: VerificationRequest[];
}

export default function CollegeAdminClient({ requests: initialRequests }: CollegeAdminClientProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRequests = requests.filter((req) => {
    const search = searchTerm.toLowerCase();
    return (
      req.userName.toLowerCase().includes(search) ||
      req.collegeName.toLowerCase().includes(search) ||
      req.studentId.toLowerCase().includes(search) ||
      req.collegeEmail.toLowerCase().includes(search)
    );
  });

  const handleApprove = async (requestId: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/college-verification/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          action: "approve",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to approve request");
      }

      toast.success("Verification request approved!");
      setRequests(requests.filter((req) => req._id !== requestId));
    } catch (error: any) {
      toast.error(error.message || "Failed to approve request");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/college-verification/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: selectedRequest._id,
          action: "reject",
          rejectionReason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reject request");
      }

      toast.success("Verification request rejected");
      setRequests(requests.filter((req) => req._id !== selectedRequest._id));
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectionReason("");
    } catch (error: any) {
      toast.error(error.message || "Failed to reject request");
    } finally {
      setLoading(false);
    }
  };

  const openRejectDialog = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setShowRejectDialog(true);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="card-modern p-4">
          <Input
            placeholder="Search by name, college, student ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pending</p>
                <p className="text-2xl font-bold">{requests.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Filtered Results</p>
                <p className="text-2xl font-bold">{filteredRequests.length}</p>
              </div>
              <User className="h-8 w-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unique Colleges</p>
                <p className="text-2xl font-bold">
                  {new Set(requests.map((r) => r.collegeName)).size}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-green-500" />
            </div>
          </Card>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No requests match your search</p>
            </Card>
          ) : (
            filteredRequests.map((request) => (
              <Card key={request._id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {request.userName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg">{request.userName}</h3>
                        <div className="flex flex-wrap gap-2 mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {request.userEmail}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{request.collegeName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{request.collegeEmail}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Student ID: {request.studentId}
                          </span>
                        </div>
                        {request.department && (
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{request.department}</span>
                          </div>
                        )}
                        {request.graduationYear && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Class of {request.graduationYear}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {new Date(request.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 md:min-w-[140px]">
                    <Button
                      onClick={() => handleApprove(request._id)}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => openRejectDialog(request)}
                      disabled={loading}
                      variant="destructive"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Verification Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this verification request. This will be shown
              to the student.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason</Label>
              <Input
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Invalid student ID, email doesn't match records..."
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason("");
                setSelectedRequest(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={loading || !rejectionReason.trim()}
            >
              {loading ? "Rejecting..." : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

