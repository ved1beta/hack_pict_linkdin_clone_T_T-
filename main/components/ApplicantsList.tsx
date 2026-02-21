"use client";

import { useState, useMemo } from "react";
import ApplicantCard from "./ApplicantCard";
import ApplicantsFilter, { FilterState } from "./ApplicantsFilter";
import { Users } from "lucide-react";

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
    status: "all",
  });

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

      // Status filter
      if (filters.status !== "all") {
        if (applicant.status !== filters.status) return false;
      }

      return true;
    });
  }, [applicants, filters]);

  return (
    <div className="space-y-6">
      {/* Filter Component */}
      <ApplicantsFilter onFilterChange={setFilters} />

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredApplicants.length} of {applicants.length} applicants
        </p>
      </div>

      {/* Applicants List */}
      {filteredApplicants.length > 0 ? (
        <div className="space-y-4">
          {filteredApplicants.map((applicant: any) => (
            <ApplicantCard
              key={applicant._id?.toString() || applicant.userId}
              applicant={{
                ...applicant,
                _id: applicant._id?.toString() || applicant.userId,
              }}
              jobId={jobId}
              companyName={companyName}
            />
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
    </div>
  );
}

