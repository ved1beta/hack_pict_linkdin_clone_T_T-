"use client";

import { useState } from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Filter, X } from "lucide-react";

interface ApplicantsFilterProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  search: string;
  collegeVerified: boolean | null;
  minCGPA: number | null;
  specificCollege: string;
  specificBranch: string;
  status: string;
}

export default function ApplicantsFilter({ onFilterChange }: ApplicantsFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    collegeVerified: null,
    minCGPA: null,
    specificCollege: "",
    specificBranch: "",
    status: "all",
  });

  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);

    // Count active filters
    let count = 0;
    if (newFilters.search) count++;
    if (newFilters.collegeVerified !== null) count++;
    if (newFilters.minCGPA !== null) count++;
    if (newFilters.specificCollege) count++;
    if (newFilters.specificBranch) count++;
    if (newFilters.status !== "all") count++;
    setActiveFiltersCount(count);
  };

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      search: "",
      collegeVerified: null,
      minCGPA: null,
      specificCollege: "",
      specificBranch: "",
      status: "all",
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
    setActiveFiltersCount(0);
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Filter Applicants</h3>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {activeFiltersCount} active
            </Badge>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Name or email..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
          />
        </div>

        {/* College Verification */}
        <div className="space-y-2">
          <Label htmlFor="collegeVerified">College Verification</Label>
          <select
            id="collegeVerified"
            className="input-modern w-full"
            value={filters.collegeVerified === null ? "all" : filters.collegeVerified.toString()}
            onChange={(e) =>
              updateFilter(
                "collegeVerified",
                e.target.value === "all" ? null : e.target.value === "true"
              )
            }
          >
            <option value="all">All</option>
            <option value="true">Verified Only</option>
            <option value="false">Not Verified</option>
          </select>
        </div>

        {/* Minimum CGPA */}
        <div className="space-y-2">
          <Label htmlFor="minCGPA">Minimum CGPA</Label>
          <Input
            id="minCGPA"
            type="number"
            step="0.1"
            min="0"
            max="10"
            placeholder="e.g., 7.0"
            value={filters.minCGPA || ""}
            onChange={(e) =>
              updateFilter("minCGPA", e.target.value ? parseFloat(e.target.value) : null)
            }
          />
        </div>

        {/* Specific College */}
        <div className="space-y-2">
          <Label htmlFor="specificCollege">College Name</Label>
          <Input
            id="specificCollege"
            placeholder="e.g., MIT"
            value={filters.specificCollege}
            onChange={(e) => updateFilter("specificCollege", e.target.value)}
          />
        </div>

        {/* Specific Branch */}
        <div className="space-y-2">
          <Label htmlFor="specificBranch">Engineering Branch</Label>
          <select
            id="specificBranch"
            className="input-modern w-full"
            value={filters.specificBranch}
            onChange={(e) => updateFilter("specificBranch", e.target.value)}
          >
            <option value="">All Branches</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Electronics">Electronics & Communication</option>
            <option value="Electrical">Electrical Engineering</option>
            <option value="Mechanical">Mechanical Engineering</option>
            <option value="Civil">Civil Engineering</option>
            <option value="Chemical">Chemical Engineering</option>
            <option value="Biotechnology">Biotechnology</option>
            <option value="Aerospace">Aerospace Engineering</option>
          </select>
        </div>

        {/* Application Status */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            className="input-modern w-full"
            value={filters.status}
            onChange={(e) => updateFilter("status", e.target.value)}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
    </Card>
  );
}

