/**
 * Maps resume skills/interests to roadmap.sh slugs.
 * roadmap.sh roadmaps: https://roadmap.sh/roadmaps
 */

const SKILL_TO_ROADMAP: Record<string, string> = {
  // Role-based
  "frontend": "frontend",
  "backend": "backend",
  "full stack": "full-stack",
  "fullstack": "full-stack",
  "devops": "devops",
  "data scientist": "ai-data-scientist",
  "data analyst": "data-analyst",
  "ml engineer": "ai-engineer",
  "machine learning": "machine-learning",
  "ai engineer": "ai-engineer",
  "android": "android",
  "ios": "ios",
  "blockchain": "blockchain",
  "cybersecurity": "cyber-security",
  "ux design": "ux-design",
  "game developer": "game-developer",
  "product manager": "product-manager",
  "software architect": "software-architect",
  "data engineer": "data-engineer",
  "mlops": "mlops",
  // Skills
  "react": "react",
  "vue": "vue",
  "angular": "angular",
  "javascript": "javascript",
  "typescript": "typescript",
  "node.js": "nodejs",
  "nodejs": "nodejs",
  "python": "python",
  "java": "java",
  "c++": "cpp",
  "cpp": "cpp",
  "rust": "rust",
  "go": "golang",
  "golang": "golang",
  "sql": "sql",
  "mongodb": "mongodb",
  "postgresql": "postgresql-dba",
  "docker": "docker",
  "kubernetes": "kubernetes",
  "aws": "aws",
  "terraform": "terraform",
  "linux": "linux",
  "git": "git-github",
  "next.js": "nextjs",
  "nextjs": "nextjs",
  "flutter": "flutter",
  "react native": "react-native",
  "django": "django",
  "system design": "system-design",
  "computer science": "computer-science",
  "data structures": "datastructures-and-algorithms",
  "algorithms": "datastructures-and-algorithms",
  "html": "html",
  "css": "css",
  "php": "php",
  "kotlin": "kotlin",
  "swift": "swift-ui",
  "solidity": "blockchain",
  "tensorflow": "machine-learning",
  "pytorch": "machine-learning",
  "scikit-learn": "machine-learning",
  "nlp": "ai-engineer",
  "deep learning": "machine-learning",
  "neural networks": "machine-learning",
};

export function getRoadmapSlugFromSkills(skills: string[]): string {
  const normalized = skills.map((s) => s.toLowerCase().trim());
  for (const skill of normalized) {
    const slug = SKILL_TO_ROADMAP[skill];
    if (slug) return slug;
    // Partial match
    for (const [key, val] of Object.entries(SKILL_TO_ROADMAP)) {
      if (skill.includes(key) || key.includes(skill)) return val;
    }
  }
  return "full-stack"; // default
}

export function getRoadmapUrl(slug: string): string {
  return `https://roadmap.sh/${slug}`;
}
