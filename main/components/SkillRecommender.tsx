"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Sparkles } from "lucide-react";

function SkillRecommender() {
  const [interest, setInterest] = useState("web");
  const [role, setRole] = useState("frontend");
  const [skills, setSkills] = useState<string[]>([]);

  const getSkills = () => {
    let recommendedSkills: string[] = [];

    if (interest === "web" && role === "frontend") {
      recommendedSkills = ["HTML", "CSS", "JavaScript", "React", "Git", "UI/UX", "Responsive Design"];
    } else if (interest === "web" && role === "backend") {
      recommendedSkills = ["Java", "Node.js", "APIs", "SQL", "Spring Boot", "Git", "Security"];
    } else if (interest === "data") {
      recommendedSkills = ["Python", "Pandas", "SQL", "Statistics", "Power BI", "ML Basics", "Visualization"];
    } else if (interest === "app") {
      recommendedSkills = ["Java/Kotlin", "Flutter", "Firebase", "APIs", "UI Design", "Testing", "Git"];
    }

    setSkills(recommendedSkills);
  };

  return (
    <div className="card-modern p-6 space-y-4">
      {/* Interest Selection */}
      <div>
        <label className="text-sm font-medium mb-2 block">Interest</label>
        <select
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          className="w-full p-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="web">Web Development</option>
          <option value="data">Data Science</option>
          <option value="app">App Development</option>
        </select>
      </div>

      {/* Role Selection */}
      <div>
        <label className="text-sm font-medium mb-2 block">Job Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full p-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="frontend">Frontend Developer</option>
          <option value="backend">Backend Developer</option>
          <option value="analyst">Data Analyst</option>
        </select>
      </div>

      {/* Get Skills Button */}
      <Button onClick={getSkills} className="btn-primary w-full">
        <Sparkles className="h-4 w-4 mr-2" />
        Get Recommended Skills
      </Button>

      {/* Skills Display */}
      {skills.length > 0 && (
        <div className="p-4 bg-primary/5 rounded-lg border-l-4 border-primary">
          <p className="font-semibold mb-3 flex items-center">
            <Sparkles className="h-4 w-4 mr-2 text-primary" />
            Recommended Skills:
          </p>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <Badge key={index} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SkillRecommender;
