"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { X, Pencil } from "lucide-react";
import { IUserDocument } from "@/mongodb/models/user";
import { toast } from "sonner";

interface EditProfileDialogProps {
  user: IUserDocument;
}

function EditProfileDialog({ user }: EditProfileDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    bio: user.bio || "",
    location: user.location || "",
    experience: user.experience || "",
    education: user.education || "",
    skills: user.skills?.join(", ") || "",
    companyName: user.companyName || "",
    companyWebsite: user.companyWebsite || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const skillsArray = formData.skills.split(",").map(s => s.trim()).filter(s => s.length > 0);

      const response = await fetch("/api/users/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.userId,
          ...formData,
          skills: skillsArray,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      toast.success("Profile updated successfully!");
      setIsOpen(false);
      window.location.reload();
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} className="w-full mt-4">
        <Pencil className="h-4 w-4 mr-2" />
        Edit Profile
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Edit Profile</h2>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="w-full p-2 border rounded-md bg-background min-h-[80px]"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full p-2 border rounded-md bg-background"
                placeholder="City, Country"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Experience</label>
              <textarea
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                className="w-full p-2 border rounded-md bg-background min-h-[100px]"
                placeholder="Add your work experience..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Education</label>
              <textarea
                name="education"
                value={formData.education}
                onChange={handleChange}
                className="w-full p-2 border rounded-md bg-background min-h-[100px]"
                placeholder="Add your education details..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Skills (comma separated)</label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                className="w-full p-2 border rounded-md bg-background"
                placeholder="React, Node.js, TypeScript..."
              />
            </div>

            {user.userType === "recruiter" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Website</label>
                  <input
                    type="text"
                    name="companyWebsite"
                    value={formData.companyWebsite}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md bg-background"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditProfileDialog;
