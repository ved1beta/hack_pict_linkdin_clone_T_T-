"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PostJobFormProps {
  recruiterId: string;
  recruiterName: string;
  recruiterImage?: string;
  companyName: string;
}

function PostJobForm({ 
  recruiterId, 
  recruiterName, 
  recruiterImage,
  companyName 
}: PostJobFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState("");
  const [currentRequirement, setCurrentRequirement] = useState("");
  const [specificColleges, setSpecificColleges] = useState<string[]>([]);
  const [currentCollege, setCurrentCollege] = useState("");
  const [specificBranches, setSpecificBranches] = useState<string[]>([]);
  const [currentBranch, setCurrentBranch] = useState("");

  const addSkill = () => {
    if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
      setSkills([...skills, currentSkill.trim()]);
      setCurrentSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
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

  const addCollege = () => {
    if (currentCollege.trim() && !specificColleges.includes(currentCollege.trim())) {
      setSpecificColleges([...specificColleges, currentCollege.trim()]);
      setCurrentCollege("");
    }
  };

  const removeCollege = (college: string) => {
    setSpecificColleges(specificColleges.filter((c) => c !== college));
  };

  const addBranch = () => {
    if (currentBranch && !specificBranches.includes(currentBranch)) {
      setSpecificBranches([...specificBranches, currentBranch]);
      setCurrentBranch("");
    }
  };

  const removeBranch = (branch: string) => {
    setSpecificBranches(specificBranches.filter((b) => b !== branch));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    const jobData = {
      recruiterId,
      recruiterName,
      recruiterImage,
      companyName: formData.get("companyName") as string,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      location: formData.get("location") as string,
      jobType: formData.get("jobType") as string,
      experienceLevel: formData.get("experienceLevel") as string,
      salary: formData.get("salary") as string,
      skills,
      requirements,
      filters: {
        requireCollegeVerification: formData.get("requireCollegeVerification") === "on",
        minCGPA: formData.get("minCGPA") ? parseFloat(formData.get("minCGPA") as string) : undefined,
        specificColleges: specificColleges.length > 0 ? specificColleges : undefined,
        specificBranches: specificBranches.length > 0 ? specificBranches : undefined,
      },
    };

    try {
      const response = await fetch("/api/jobs/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        throw new Error("Failed to create job");
      }

      toast.success("Job posted successfully! 🎉");
      router.push("/recruiter");
    } catch (error) {
      toast.error("Failed to post job. Please try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card-modern p-8 space-y-6">
      {/* Company Name */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Company Name *
        </label>
        <input
          type="text"
          name="companyName"
          defaultValue={companyName}
          required
          className="input-modern w-full"
          placeholder="Enter company name"
        />
      </div>

      {/* Job Title */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Job Title *
        </label>
        <input
          type="text"
          name="title"
          required
          className="input-modern w-full"
          placeholder="e.g., Senior Frontend Developer"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Job Description *
        </label>
        <textarea
          name="description"
          required
          rows={6}
          className="input-modern w-full resize-none"
          placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
        />
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Location *
        </label>
        <input
          type="text"
          name="location"
          required
          className="input-modern w-full"
          placeholder="e.g., Remote, New York, Hybrid"
        />
      </div>

      {/* Job Type and Experience Level */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Job Type *
          </label>
          <select name="jobType" required className="input-modern w-full">
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="internship">Internship</option>
            <option value="contract">Contract</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Experience Level *
          </label>
          <select name="experienceLevel" required className="input-modern w-full">
            <option value="entry">Entry Level</option>
            <option value="mid">Mid Level</option>
            <option value="senior">Senior Level</option>
          </select>
        </div>
      </div>

      {/* Salary */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Salary Range (Optional)
        </label>
        <input
          type="text"
          name="salary"
          className="input-modern w-full"
          placeholder="e.g., $80k - $120k"
        />
      </div>

      {/* Required Skills */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Required Skills
        </label>
        <div className="flex space-x-2 mb-3">
          <input
            type="text"
            value={currentSkill}
            onChange={(e) => setCurrentSkill(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
            className="input-modern flex-1"
            placeholder="Add a skill (e.g., React, Python)"
          />
          <Button type="button" onClick={addSkill} variant="secondary">
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <Badge key={skill} variant="secondary" className="pl-3 pr-1 py-1">
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="ml-2 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Requirements */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Requirements
        </label>
        <div className="flex space-x-2 mb-3">
          <input
            type="text"
            value={currentRequirement}
            onChange={(e) => setCurrentRequirement(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addRequirement())}
            className="input-modern flex-1"
            placeholder="Add a requirement"
          />
          <Button type="button" onClick={addRequirement} variant="secondary">
            Add
          </Button>
        </div>
        <ul className="space-y-2">
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

      {/* Candidate Filters Section */}
      <div className="border-t border-border pt-6 space-y-4">
        <h3 className="text-lg font-semibold">Candidate Filters</h3>
        <p className="text-sm text-muted-foreground">
          Set requirements to filter candidates automatically
        </p>

        {/* College Verification Required */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="requireCollegeVerification"
            name="requireCollegeVerification"
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="requireCollegeVerification" className="text-sm font-medium cursor-pointer">
            Require College Verification
          </label>
        </div>

        {/* Minimum CGPA */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Minimum CGPA (Optional)
          </label>
          <input
            type="number"
            name="minCGPA"
            step="0.1"
            min="0"
            max="10"
            className="input-modern w-full max-w-xs"
            placeholder="e.g., 7.0"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Only students with this CGPA or higher can apply
          </p>
        </div>

        {/* Specific Colleges */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Specific Colleges (Optional)
          </label>
          <div className="flex space-x-2 mb-3">
            <input
              type="text"
              value={currentCollege}
              onChange={(e) => setCurrentCollege(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCollege())}
              className="input-modern flex-1"
              placeholder="e.g., MIT, Stanford"
            />
            <Button type="button" onClick={addCollege} variant="secondary">
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Leave empty to allow all colleges
          </p>
          <div className="flex flex-wrap gap-2">
            {specificColleges.map((college) => (
              <Badge key={college} variant="secondary" className="pl-3 pr-1 py-1">
                {college}
                <button
                  type="button"
                  onClick={() => removeCollege(college)}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Specific Branches */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Specific Engineering Branches (Optional)
          </label>
          <div className="flex space-x-2 mb-3">
            <select
              value={currentBranch}
              onChange={(e) => setCurrentBranch(e.target.value)}
              className="input-modern flex-1"
            >
              <option value="">Select Branch</option>
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
            <Button type="button" onClick={addBranch} variant="secondary">
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Leave empty to allow all branches
          </p>
          <div className="flex flex-wrap gap-2">
            {specificBranches.map((branch) => (
              <Badge key={branch} variant="secondary" className="pl-3 pr-1 py-1">
                {branch}
                <button
                  type="button"
                  onClick={() => removeBranch(branch)}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4 border-t border-border">
        <Button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-6 text-lg"
        >
          {loading ? "Posting..." : "Post Job"}
        </Button>
      </div>
    </form>
  );
}

export default PostJobForm;