"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { toast } from "sonner";
import { 
  GraduationCap, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  Shield
} from "lucide-react";

interface CollegeVerificationData {
  collegeName: string;
  collegeEmail: string;
  studentId: string;
  department?: string;
  graduationYear?: number;
  status: "pending" | "approved" | "rejected";
  submittedAt?: string;
  rejectionReason?: string;
}

export default function CollegeVerificationForm() {
  const [loading, setLoading] = useState(false);
  const [fetchingStatus, setFetchingStatus] = useState(true);
  const [verificationData, setVerificationData] = useState<CollegeVerificationData | null>(null);
  const [formData, setFormData] = useState({
    collegeName: "",
    collegeEmail: "",
    studentId: "",
    department: "",
    graduationYear: new Date().getFullYear(),
  });

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const response = await fetch("/api/college-verification/submit");
      if (response.ok) {
        const data = await response.json();
        if (data.collegeVerification) {
          setVerificationData(data.collegeVerification);
          setFormData({
            collegeName: data.collegeVerification.collegeName || "",
            collegeEmail: data.collegeVerification.collegeEmail || "",
            studentId: data.collegeVerification.studentId || "",
            department: data.collegeVerification.department || "",
            graduationYear: data.collegeVerification.graduationYear || new Date().getFullYear(),
          });
        }
      }
    } catch (error) {
      console.error("Error fetching verification status:", error);
    } finally {
      setFetchingStatus(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "graduationYear" ? parseInt(value) || new Date().getFullYear() : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.collegeName || !formData.collegeEmail || !formData.studentId) {
        toast.error("Please fill in all required fields");
        return;
      }

      const response = await fetch("/api/college-verification/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit verification");
      }

      toast.success("Verification request submitted successfully!");
      await fetchVerificationStatus();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit verification request");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!verificationData) return null;

    const statusConfig = {
      pending: {
        icon: <Clock className="h-4 w-4" />,
        text: "Pending Approval",
        className: "bg-yellow-100 text-yellow-800 border-yellow-300",
      },
      approved: {
        icon: <CheckCircle className="h-4 w-4" />,
        text: "Verified",
        className: "bg-green-100 text-green-800 border-green-300",
      },
      rejected: {
        icon: <XCircle className="h-4 w-4" />,
        text: "Rejected",
        className: "bg-red-100 text-red-800 border-red-300",
      },
    };

    const config = statusConfig[verificationData.status];

    return (
      <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${config.className}`}>
        {config.icon}
        <span className="font-medium text-sm">{config.text}</span>
      </div>
    );
  };

  if (fetchingStatus) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 p-3 rounded-xl">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">College Verification</h2>
              <p className="text-sm text-muted-foreground">
                Verify your college to unlock exclusive features
              </p>
            </div>
          </div>
          {verificationData && getStatusBadge()}
        </div>

        {/* Status Messages */}
        {verificationData?.status === "approved" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
            <Shield className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900">Verified Student</h3>
              <p className="text-sm text-green-700">
                Your college has verified your student status. You now have access to all student features.
              </p>
            </div>
          </div>
        )}

        {verificationData?.status === "pending" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900">Awaiting Approval</h3>
              <p className="text-sm text-yellow-700">
                Your verification request has been sent to your college. This usually takes 1-3 business days.
              </p>
            </div>
          </div>
        )}

        {verificationData?.status === "rejected" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Verification Rejected</h3>
              <p className="text-sm text-red-700">
                {verificationData.rejectionReason || "Your verification request was rejected. Please check your details and try again."}
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        {(!verificationData || verificationData.status === "rejected") && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="collegeName">
                  College Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="collegeName"
                  name="collegeName"
                  value={formData.collegeName}
                  onChange={handleChange}
                  placeholder="e.g., MIT, Stanford University"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="collegeEmail">
                  College Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="collegeEmail"
                  name="collegeEmail"
                  type="email"
                  value={formData.collegeEmail}
                  onChange={handleChange}
                  placeholder="your.name@college.edu"
                  required
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Use your official college email address
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentId">
                  Student ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="studentId"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  placeholder="e.g., 2021CS001"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="e.g., Computer Science"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="graduationYear">Graduation Year</Label>
                <Input
                  id="graduationYear"
                  name="graduationYear"
                  type="number"
                  value={formData.graduationYear}
                  onChange={handleChange}
                  placeholder="2024"
                  min={new Date().getFullYear() - 10}
                  max={new Date().getFullYear() + 10}
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Submit for Verification
                </>
              )}
            </Button>
          </form>
        )}

        {/* Verification Info */}
        {verificationData && verificationData.status !== "rejected" && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-sm">Verification Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">College:</span>{" "}
                <span className="font-medium">{verificationData.collegeName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Student ID:</span>{" "}
                <span className="font-medium">{verificationData.studentId}</span>
              </div>
              {verificationData.department && (
                <div>
                  <span className="text-muted-foreground">Department:</span>{" "}
                  <span className="font-medium">{verificationData.department}</span>
                </div>
              )}
              {verificationData.graduationYear && (
                <div>
                  <span className="text-muted-foreground">Graduation Year:</span>{" "}
                  <span className="font-medium">{verificationData.graduationYear}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

