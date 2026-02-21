"use client";

import { useState, useMemo } from "react";
import ApplicantCard from "./ApplicantCard";
import ApplicantsFilter, { FilterState } from "./ApplicantsFilter";
import BulkActionsBar from "./BulkActionsBar";
import { Users } from "lucide-react";
import { Checkbox } from "./ui/checkbox";

interface ApplicantsListProps {
  applicants: any[];
  jobId: string;
  companyName: string;
}

export default function ApplicantsList({ applicants, jobId, companyName }: ApplicantsListProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    collegeVerified: null,
    minCGPA: null,
    specificCollege: "",
    specificBranch: "",
    status: "all",
  });
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);

  const filteredApplicants = useMemo(() => {
    return applicants.filter((applicant) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = applicant.userName.toLowerCase().includes(searchLower);
        const matchesEmail = applicant.userEmail.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesEmail) return false;
      }

      // College verification filter
      if (filters.collegeVerified !== null) {
        if (filters.collegeVerified && !applicant.collegeVerified) return false;
        if (!filters.collegeVerified && applicant.collegeVerified) return false;
      }

      // Minimum CGPA filter
      if (filters.minCGPA !== null) {
        if (!applicant.cgpa || applicant.cgpa < filters.minCGPA) return false;
      }

      // Specific college filter
      if (filters.specificCollege) {
        const collegeLower = filters.specificCollege.toLowerCase();
        if (!applicant.collegeName || !applicant.collegeName.toLowerCase().includes(collegeLower)) {
          return false;
        }
      }

      // Specific branch filter
      if (filters.specificBranch) {
        if (!applicant.branch || applicant.branch !== filters.specificBranch) {
          return false;
        }
      }

      // Status filter
      if (filters.status !== "all") {
        if (applicant.status !== filters.status) return false;
      }

      return true;
    });
  }, [applicants, filters]);

  const toggleCandidate = (userId: string) => {
    setSelectedCandidates((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleAll = () => {
    if (selectedCandidates.length === filteredApplicants.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(filteredApplicants.map((app) => app.userId));
    }
  };

  const clearSelection = () => {
    setSelectedCandidates([]);
  };

  return (
    <div className="space-y-6">
      {/* Filter Component */}
      <ApplicantsFilter onFilterChange={setFilters} />

      {/* Results Count and Bulk Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={
                filteredApplicants.length > 0 &&
                selectedCandidates.length === filteredApplicants.length
              }
              onCheckedChange={toggleAll}
            />
            <span className="text-sm text-muted-foreground">Select All</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Showing {filteredApplicants.length} of {applicants.length} applicants
          </p>
        </div>
      </div>

      {/* Applicants List */}
      {filteredApplicants.length > 0 ? (
        <div className="space-y-4">
          {filteredApplicants.map((applicant: any) => (
            <div key={applicant._id?.toString() || applicant.userId} className="flex items-start gap-3">
              <div className="pt-6">
                <Checkbox
                  checked={selectedCandidates.includes(applicant.userId)}
                  onCheckedChange={() => toggleCandidate(applicant.userId)}
                />
              </div>
              <div className="flex-1">
                <ApplicantCard
                  applicant={{
                    ...applicant,
                    _id: applicant._id?.toString() || applicant.userId,
                  }}
                  jobId={jobId}
                  companyName={companyName}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-modern p-12 text-center">
          <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No applicants match your filters</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters to see more results
          </p>
        </div>
      )}

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCandidates={selectedCandidates}
        allApplicants={applicants}
        onClearSelection={clearSelection}
        jobId={jobId}
      />
    </div>
  );
}

