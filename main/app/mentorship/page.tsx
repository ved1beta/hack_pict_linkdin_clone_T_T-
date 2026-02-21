"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Sparkles, 
  MessageCircle, 
  Play,
  X,
  Loader2,
  AlertCircle,
  Map,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

// Expanded categories
const INTERESTS = [
  "Web Development",
  "Mobile Development",
  "Data Science",
  "Machine Learning",
  "AI/ML",
  "Cloud Computing",
  "DevOps",
  "Cybersecurity",
  "Blockchain",
  "Game Development",
  "UI/UX Design",
  "Digital Marketing",
];

const JOB_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Mobile App Developer",
  "Data Scientist",
  "ML Engineer",
  "DevOps Engineer",
  "Cloud Architect",
  "Security Engineer",
  "Blockchain Developer",
  "Game Developer",
  "UI/UX Designer",
  "Product Manager",
  "Data Analyst",
];

// Complete skills database
const SKILLS_DATABASE: { [key: string]: { [key: string]: string[] } } = {
  "Web Development": {
    "Frontend Developer": ["HTML", "CSS", "JavaScript", "React", "Vue.js", "TypeScript", "Tailwind CSS", "Webpack"],
    "Backend Developer": ["Node.js", "Express.js", "Python", "Django", "PostgreSQL", "MongoDB", "REST API", "GraphQL"],
    "Full Stack Developer": ["React", "Node.js", "Next.js", "TypeScript", "MongoDB", "PostgreSQL", "Docker", "AWS"],
    "Product Manager": ["Agile", "Scrum", "Product Strategy", "User Stories", "Analytics", "A/B Testing"],
  },
  "Mobile Development": {
    "Mobile App Developer": ["React Native", "Flutter", "Swift", "Kotlin", "Android Studio", "iOS Development", "Firebase", "Redux"],
    "Full Stack Developer": ["React Native", "Node.js", "Firebase", "MongoDB", "REST API", "JWT Authentication"],
    "Frontend Developer": ["React Native", "Flutter", "Mobile UI Design", "Redux", "State Management"],
  },
  "Data Science": {
    "Data Scientist": ["Python", "Pandas", "NumPy", "Scikit-learn", "Matplotlib", "Jupyter", "Statistics", "SQL"],
    "Data Analyst": ["Python", "SQL", "Excel", "Tableau", "Power BI", "Statistics", "Data Visualization", "R"],
    "ML Engineer": ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "Deep Learning", "NLP", "Computer Vision", "MLOps"],
  },
  "Machine Learning": {
    "ML Engineer": ["TensorFlow", "PyTorch", "Keras", "Deep Learning", "NLP", "Computer Vision", "MLOps", "Feature Engineering"],
    "Data Scientist": ["Python", "Machine Learning", "Statistical Analysis", "Feature Engineering", "Model Deployment", "A/B Testing"],
    "Data Analyst": ["Python", "Machine Learning Basics", "Statistical Analysis", "Predictive Modeling", "Data Preprocessing"],
  },
  "AI/ML": {
    "ML Engineer": ["TensorFlow", "PyTorch", "Neural Networks", "Deep Learning", "NLP", "Transformers", "LLMs", "GPT"],
    "Data Scientist": ["Python", "Machine Learning", "Deep Learning", "Neural Networks", "AI Ethics", "Model Evaluation"],
    "Backend Developer": ["Python", "TensorFlow", "FastAPI", "Model Deployment", "ML APIs", "Docker"],
  },
  "Cloud Computing": {
    "Cloud Architect": ["AWS", "Azure", "Google Cloud", "Kubernetes", "Docker", "Terraform", "Cloud Security", "Microservices"],
    "DevOps Engineer": ["AWS", "Docker", "Kubernetes", "CI/CD", "Jenkins", "Terraform", "Linux", "Monitoring"],
    "Backend Developer": ["AWS", "Docker", "Microservices", "API Gateway", "Lambda Functions", "S3", "EC2"],
    "Full Stack Developer": ["AWS", "Docker", "Kubernetes", "CI/CD", "Cloud Deployment", "Serverless"],
  },
  "DevOps": {
    "DevOps Engineer": ["Docker", "Kubernetes", "Jenkins", "GitLab CI", "Terraform", "Ansible", "Linux", "AWS"],
    "Cloud Architect": ["Docker", "Kubernetes", "Infrastructure as Code", "CI/CD", "Cloud Platforms", "Monitoring"],
    "Backend Developer": ["Docker", "Git", "CI/CD", "Linux", "Bash Scripting", "Monitoring Tools"],
  },
  "Cybersecurity": {
    "Security Engineer": ["Network Security", "Penetration Testing", "Cryptography", "SIEM", "Ethical Hacking", "Linux", "Firewall", "Compliance"],
    "Cloud Architect": ["Cloud Security", "IAM", "Encryption", "Security Best Practices", "Compliance", "Threat Modeling"],
    "Backend Developer": ["Web Security", "OWASP", "Authentication", "Encryption", "JWT", "SQL Injection Prevention"],
  },
  "Blockchain": {
    "Blockchain Developer": ["Solidity", "Ethereum", "Web3.js", "Smart Contracts", "Hardhat", "Truffle", "DeFi", "NFT"],
    "Full Stack Developer": ["Solidity", "React", "Web3.js", "MetaMask", "Smart Contracts", "Ethers.js"],
  },
  "Game Development": {
    "Game Developer": ["Unity", "Unreal Engine", "C#", "C++", "3D Modeling", "Game Physics", "Blender", "Animation"],
    "Frontend Developer": ["JavaScript", "Canvas API", "WebGL", "Three.js", "Game Logic", "Animation"],
  },
  "UI/UX Design": {
    "UI/UX Designer": ["Figma", "Adobe XD", "Sketch", "Prototyping", "User Research", "Wireframing", "Design Systems", "Usability Testing"],
    "Frontend Developer": ["Figma", "CSS", "Responsive Design", "Animation", "UI Libraries", "Design Principles"],
    "Product Manager": ["User Research", "Wireframing", "Prototyping", "User Testing", "Design Thinking", "User Stories"],
  },
  "Digital Marketing": {
    "Product Manager": ["SEO", "Google Analytics", "Marketing Strategy", "Content Marketing", "Social Media", "Growth Hacking"],
    "Frontend Developer": ["SEO", "Google Analytics", "Performance Optimization", "Web Vitals", "Conversion Optimization"],
  },
};

const MENTOR_PROFILES = [
  {
    name: "Sarah Chen",
    title: "Senior Software Engineer",
    experience: "10+ Years",
    specialty: "Full Stack Development",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
  },
  {
    name: "Dr. James Wilson",
    title: "AI Research Scientist",
    experience: "5-10 Years",
    specialty: "Machine Learning",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
  },
  {
    name: "Emily Rodriguez",
    title: "Product Manager",
    experience: "2-5 Years",
    specialty: "Career Guidance",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
  },
];

export default function MentorshipPage() {
  const [interest, setInterest] = useState("Web Development");
  const [jobRole, setJobRole] = useState("Frontend Developer");
  const [skills, setSkills] = useState<string[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [roadmap, setRoadmap] = useState<{ url: string; displayName: string; basedOnSkills: string[]; resources?: any[] } | null>(null);
  const [roadmapLoading, setRoadmapLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mentorship/roadmap")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setRoadmap({ 
            url: data.url, 
            displayName: data.displayName, 
            basedOnSkills: data.basedOnSkills || [],
            resources: data.resources || []
          });
        }
      })
      .finally(() => setRoadmapLoading(false));
  }, []);

  const openResourceVideo = (videoId: string, skill: string) => {
    setVideoId(videoId);
    setSelectedSkill(skill);
  };

  const getSkills = () => {
    const skillSet = SKILLS_DATABASE[interest]?.[jobRole];
    return skillSet || [];
  };

  const handleGetSkills = () => {
    const recommendedSkills = getSkills();
    
    if (recommendedSkills.length === 0) {
      toast.error("Invalid Combination", {
        description: `No skills available for ${jobRole} in ${interest}. Try a different combination!`,
      });
      setSkills([]);
      return;
    }
    
    setSkills(recommendedSkills);
    toast.success("Skills Generated!", {
      description: `Found ${recommendedSkills.length} recommended skills for you.`,
    });
  };

  const handleSkillClick = async (skill: string) => {
    setSelectedSkill(skill);
    setIsLoadingVideo(true);

    try {
      console.log("Fetching video for:", skill);
      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(skill)}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch video");
      }

      const data = await response.json();
      console.log("YouTube API response:", data);
      
      if (data.videos && data.videos.length > 0) {
        setVideoId(data.videos[0].id);
        toast.success("Video loaded!");
      } else {
        throw new Error("No videos found");
      }
    } catch (error) {
      console.error("Failed to load video:", error);
      toast.error("Failed to load video", {
        description: "Please try again or check your internet connection.",
      });
      setSelectedSkill(null);
    } finally {
      setIsLoadingVideo(false);
    }
  };

  const closeVideo = () => {
    setVideoId(null);
    setSelectedSkill(null);
  };

  return (
    <div className="bg-background min-h-screen py-6">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-2">
            <GraduationCap className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold gradient-text">AI-Powered Mentorship</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get personalized skill recommendations and learn with curated video tutorials
          </p>
        </div>

        {/* Roadmap.sh - Based on Resume */}
        <div className="card-modern p-8 space-y-4">
          <div className="flex items-center gap-2">
            <Map className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Your Career Roadmap</h2>
          </div>
          <p className="text-muted-foreground">
            Personalized roadmap from roadmap.sh based on your resume skills. Upload a resume in Settings for better recommendations.
          </p>
          {roadmapLoading ? (
            <div className="flex items-center gap-2 py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Loading your roadmap...</span>
            </div>
          ) : roadmap ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      <Map className="h-6 w-6 text-primary" />
                      {roadmap.displayName}
                    </h3>
                    {roadmap.basedOnSkills.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Recommended based on: {roadmap.basedOnSkills.slice(0, 3).join(", ")}
                        {roadmap.basedOnSkills.length > 3 ? "..." : ""}
                      </p>
                    )}
                  </div>
                  <a
                    href={roadmap.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                  >
                    View Interactive Roadmap <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </div>

                {/* Decorative Roadmap Card */}
                <a
                  href={roadmap.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block w-full aspect-[3/1] rounded-xl overflow-hidden border border-border bg-gradient-to-br from-slate-900 to-slate-800"
                >
                  {/* Abstract Map Lines Background */}
                  <svg className="absolute inset-0 w-full h-full opacity-20 group-hover:opacity-30 transition-opacity" xmlns="http://www.w3.org/2000/svg">
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary"/>
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    <path d="M0 100 Q 250 50 500 100 T 1000 100" stroke="currentColor" strokeWidth="2" fill="none" className="text-primary/50" />
                  </svg>
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-2 p-4 bg-background/10 backdrop-blur-sm rounded-xl border border-white/10 group-hover:scale-105 transition-transform">
                      <Map className="h-12 w-12 mx-auto text-primary mb-2" />
                      <h4 className="text-xl font-bold text-white">Open {roadmap.displayName} Roadmap</h4>
                      <span className="inline-block text-xs text-white/70 bg-black/50 px-3 py-1 rounded-full">
                        Interactive Step-by-Step Guide
                      </span>
                    </div>
                  </div>
                </a>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground py-4">
              Add skills or upload a resume to get a personalized roadmap.
            </p>
          )}
        </div>

        {/* AI Curated Tutorials Section */}
        {roadmap?.resources && roadmap.resources.length > 0 && (
          <div className="card-modern p-8 space-y-6">
            <div className="flex items-center gap-2">
              <Play className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Curated Learning Path</h2>
            </div>
            <p className="text-muted-foreground">
              Hand-picked tutorials for your top skills to bridge knowledge gaps.
            </p>
            
            <div className="grid gap-6">
              {roadmap.resources.map((res: any, idx: number) => (
                <div key={idx} className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Badge variant="outline" className="text-base py-1 px-3 border-primary/30 bg-primary/5 text-primary">
                      {res.skill}
                    </Badge>
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {res.videos.map((video: any) => (
                      <div 
                        key={video.id}
                        className="group relative rounded-xl overflow-hidden border border-border bg-secondary/20 hover:border-primary/50 transition-all cursor-pointer"
                        onClick={() => openResourceVideo(video.id, res.skill)}
                      >
                        <div className="aspect-video relative">
                          <img 
                            src={video.thumbnail} 
                            alt={video.title}
                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                            <div className="bg-white/90 rounded-full p-3 shadow-lg transform group-hover:scale-110 transition-transform">
                              <Play className="h-6 w-6 text-primary fill-current" />
                            </div>
                          </div>
                        </div>
                        <div className="p-3">
                          <h4 className="font-medium line-clamp-2 text-sm group-hover:text-primary transition-colors">
                            {video.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {video.channelTitle}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skill Recommendation Engine */}
        <div className="card-modern p-8 space-y-6">
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Skill Recommendation Engine</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Select Your Interest</label>
              <select
                value={interest}
                onChange={(e) => {
                  setInterest(e.target.value);
                  setSkills([]);
                  setVideoId(null);
                }}
                className="w-full p-3 bg-secondary border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
              >
                {INTERESTS.map((int) => (
                  <option key={int} value={int}>
                    {int}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Select Job Role</label>
              <select
                value={jobRole}
                onChange={(e) => {
                  setJobRole(e.target.value);
                  setSkills([]);
                  setVideoId(null);
                }}
                className="w-full p-3 bg-secondary border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
              >
                {JOB_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={handleGetSkills}
              className="w-full btn-primary text-lg py-6"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Get Recommended Skills
            </Button>
          </div>

          {skills.length > 0 && (
            <div className="pt-6 border-t border-border">
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-bold">Recommended Skills:</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {skills.map((skill, index) => (
                  <button
                    key={index}
                    onClick={() => handleSkillClick(skill)}
                    className="group relative"
                  >
                    <Badge 
                      variant="secondary" 
                      className="text-sm px-4 py-2 cursor-pointer hover:bg-primary hover:text-white transition-all"
                    >
                      <Play className="h-3 w-3 mr-1 inline" />
                      {skill}
                    </Badge>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Click on any skill to watch a tutorial video
              </p>
            </div>
          )}
        </div>

        {/* Video Player Modal */}
        {videoId && !isLoadingVideo && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-background rounded-xl max-w-5xl w-full overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-border bg-secondary">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Play className="h-5 w-5 text-primary" />
                  {selectedSkill} Tutorial
                </h3>
                <button
                  onClick={closeVideo}
                  className="p-2 hover:bg-background rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="aspect-video bg-black">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Loading Modal */}
        {isLoadingVideo && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
            <div className="text-center space-y-4 bg-background p-8 rounded-xl">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-foreground text-lg font-semibold">Loading video...</p>
              <p className="text-sm text-muted-foreground">Finding the best tutorial for {selectedSkill}</p>
            </div>
          </div>
        )}

        {/* Available Mentors */}
        <div className="card-modern p-8">
          <div className="flex items-center space-x-2 mb-6">
            <MessageCircle className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Connect with Mentors</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {MENTOR_PROFILES.map((mentor, index) => (
              <div key={index} className="card-modern p-6 text-center space-y-4 hover:ring-2 hover:ring-primary transition-all">
                <img
                  src={mentor.avatar}
                  alt={mentor.name}
                  className="w-24 h-24 rounded-full mx-auto ring-4 ring-primary/20"
                />
                <div>
                  <h3 className="font-bold text-lg">{mentor.name}</h3>
                  <p className="text-sm text-muted-foreground">{mentor.title}</p>
                </div>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-semibold">Experience:</span> {mentor.experience}
                  </p>
                  <Badge variant="secondary">{mentor.specialty}</Badge>
                </div>
                <Button className="w-full btn-primary">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Connect
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
