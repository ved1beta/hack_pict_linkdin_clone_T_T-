/**
 * Verified Skills Pipeline
 *
 * Detects skills from GitHub repos using ONLY static file analysis
 * (no LLM). Groq is called sparingly: only for README context extraction
 * when the README SHA has changed since the last run.
 *
 * Core public API:
 *   buildVerifiedSkillsForUser(userId, githubUsername, repos) -> VerifiedSkillData[]
 */

import Groq from "groq-sdk";
import { ISkillEvidence, IStrongestRepo } from "@/mongodb/models/verifiedSkill";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RepoBrief {
  owner: string;
  repoName: string;
}

/** Raw data collected about a single repository from the GitHub API */
export interface RepoAnalysis {
  owner: string;
  repoName: string;
  stars: number;
  description: string;
  lastCommitAt: string;
  commitCount: number;         // total commits (all authors)
  userCommitCount: number;     // commits by this user
  hasReadme: boolean;
  readmeSha: string;
  readmeText: string;
  hasTests: boolean;
  hasDeployment: boolean;
  liveUrl: string | null;
  languages: Record<string, number>; // { TypeScript: 42300, CSS: 5100 }
  frameworks: string[];              // detected from manifest files
  totalBytes: number;
}

/** Per-skill aggregated evidence ready to be stored */
export interface VerifiedSkillData {
  skillName: string;
  verified: boolean;
  evidence: ISkillEvidence;
  confidenceScore: number;
  displayLabel: string;
  source: "github";
}

// ---------------------------------------------------------------------------
// GitHub API helpers
// ---------------------------------------------------------------------------

const GITHUB_API = "https://api.github.com";

function githubHeaders(): HeadersInit {
  return {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "HEXjuy-Career-Platform",
    ...(process.env.GITHUB_TOKEN
      ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
      : {}),
  };
}

/**
 * Fetch a single file's content from a GitHub repo (base64 decoded).
 * Returns empty string if the file doesn't exist.
 */
async function fetchFileContent(
  owner: string,
  repo: string,
  path: string
): Promise<string> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`,
    { headers: githubHeaders() }
  );
  if (!res.ok) return "";
  const data = await res.json();
  if (data.encoding !== "base64" || !data.content) return "";
  return Buffer.from(data.content, "base64").toString("utf-8");
}

/**
 * Fetch all file paths in a repo tree (recursive).
 * Returns an array of relative paths, e.g. ["src/index.ts", "package.json"].
 */
async function fetchRepoTree(
  owner: string,
  repo: string
): Promise<string[]> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
    { headers: githubHeaders() }
  );
  if (!res.ok) return [];
  const data = await res.json();
  if (data.truncated) {
    // Tree is very large; use the partial list we have
    console.warn(`[skillVerification] Tree truncated for ${owner}/${repo}`);
  }
  return (data.tree || [])
    .filter((item: any) => item.type === "blob")
    .map((item: any) => item.path as string);
}

/**
 * Get the total commit count for a repo, optionally filtered by author.
 * Uses the Link header trick: fetch 1 commit and read the last page number.
 */
async function getTotalCommitCount(
  owner: string,
  repo: string,
  username?: string
): Promise<number> {
  const authorParam = username
    ? `&author=${encodeURIComponent(username)}`
    : "";
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/commits?per_page=1${authorParam}`,
    { headers: githubHeaders() }
  );
  if (!res.ok) return 0;
  const link = res.headers.get("Link") || "";
  const match = link.match(/page=(\d+)>; rel="last"/);
  if (match) return parseInt(match[1], 10);
  // No Link header means the result fits in one page
  const data = await res.json();
  return Array.isArray(data) ? data.length : 0;
}

// ---------------------------------------------------------------------------
// Framework / deployment / test detection
// ---------------------------------------------------------------------------

/** JS/TS frameworks we detect from package.json dependencies */
const JS_FRAMEWORK_MAP: Record<string, string> = {
  react: "React",
  "react-dom": "React",
  next: "Next.js",
  "next-auth": "Next.js",
  vue: "Vue.js",
  "@vue/core": "Vue.js",
  nuxt: "Nuxt.js",
  angular: "Angular",
  "@angular/core": "Angular",
  svelte: "Svelte",
  express: "Express.js",
  fastify: "Fastify",
  koa: "Koa",
  "socket.io": "Socket.io",
  redux: "Redux",
  "@reduxjs/toolkit": "Redux",
  "react-query": "React Query",
  "framer-motion": "Framer Motion",
  tailwindcss: "Tailwind CSS",
  prisma: "Prisma",
  "@prisma/client": "Prisma",
  graphql: "GraphQL",
  "apollo-server": "GraphQL",
  "@apollo/client": "GraphQL",
  mongoose: "MongoDB",
  mongodb: "MongoDB",
  typeorm: "TypeORM",
  sequelize: "Sequelize",
  "pg": "PostgreSQL",
  "mysql2": "MySQL",
  jest: "Jest",
  vitest: "Vitest",
  "@testing-library/react": "Testing Library",
  cypress: "Cypress",
  playwright: "Playwright",
  webpack: "Webpack",
  vite: "Vite",
  "electron": "Electron",
  "react-native": "React Native",
};

/** Python libraries we detect from requirements.txt */
const PY_LIB_MAP: Record<string, string> = {
  django: "Django",
  flask: "Flask",
  fastapi: "FastAPI",
  "uvicorn": "FastAPI",
  sqlalchemy: "SQLAlchemy",
  pandas: "Pandas",
  numpy: "NumPy",
  scikit_learn: "Scikit-learn",
  "scikit-learn": "Scikit-learn",
  tensorflow: "TensorFlow",
  torch: "PyTorch",
  keras: "Keras",
  celery: "Celery",
  redis: "Redis",
  pytest: "pytest",
  pydantic: "Pydantic",
  "httpx": "HTTPX",
  requests: "Requests",
  aiohttp: "aiohttp",
  streamlit: "Streamlit",
  "langchain": "LangChain",
  openai: "OpenAI",
  anthropic: "Anthropic",
  groq: "Groq",
};

/** Deployment config file patterns */
const DEPLOYMENT_FILES = [
  "Dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  "vercel.json",
  ".vercel",
  "netlify.toml",
  "netlify.yml",
  ".netlify",
  "Procfile",
  "render.yaml",
  "render.yml",
  "railway.json",
  "railway.toml",
  "fly.toml",
  "heroku.yml",
  ".github/workflows/deploy.yml",
  ".github/workflows/ci-cd.yml",
  ".github/workflows/deploy.yaml",
  "kubernetes",
  "k8s",
  "helm",
  "serverless.yml",
  "serverless.yaml",
  "amplify.yml",
];

/** Test-related file/directory patterns */
const TEST_PATTERNS = [
  /^tests?\//i,
  /^__tests__\//i,
  /\.test\.[jt]sx?$/,
  /\.spec\.[jt]sx?$/,
  /^jest\.config\./,
  /^vitest\.config\./,
  /^pytest\.ini$/,
  /^setup\.cfg$/,
  /^pyproject\.toml$/,
  /^conftest\.py$/,
  /^cypress\//i,
  /^playwright\.config\./,
];

/**
 * Parse package.json and return detected framework names.
 */
function detectFrameworksFromPackageJson(content: string): string[] {
  const skills = new Set<string>();
  try {
    const pkg = JSON.parse(content);
    const allDeps = {
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {}),
    };
    for (const [dep, label] of Object.entries(JS_FRAMEWORK_MAP)) {
      if (dep in allDeps) skills.add(label);
    }
  } catch {
    // Malformed package.json — skip
  }
  return Array.from(skills);
}

/**
 * Parse requirements.txt and return detected Python library names.
 */
function detectFrameworksFromRequirements(content: string): string[] {
  const skills = new Set<string>();
  const lines = content.split("\n");
  for (const line of lines) {
    const pkg = line.split(/[>=<!;#\s]/)[0].trim().toLowerCase();
    const normalized = pkg.replace(/-/g, "_");
    for (const [key, label] of Object.entries(PY_LIB_MAP)) {
      if (key === pkg || key === normalized) {
        skills.add(label);
      }
    }
  }
  return Array.from(skills);
}

/**
 * Check a file tree for deployment and test files.
 */
function analyzeFileTree(paths: string[]): {
  hasTests: boolean;
  hasDeployment: boolean;
  liveUrlFiles: string[];
} {
  const hasTests = paths.some((p) => TEST_PATTERNS.some((re) => re.test(p)));
  const hasDeployment = paths.some((p) =>
    DEPLOYMENT_FILES.some((df) => p === df || p.startsWith(df + "/"))
  );
  // Files that suggest a live deployment URL is in the repo (README or config)
  const liveUrlFiles = paths.filter(
    (p) => p.toLowerCase() === "readme.md" || p.toLowerCase() === "readme.txt"
  );
  return { hasTests, hasDeployment, liveUrlFiles };
}

/**
 * Detect if a README mentions a live demo URL.
 * Looks for common deployment domain patterns or explicit "demo" links.
 */
function detectLiveUrl(readmeText: string): string | null {
  const patterns = [
    /https?:\/\/[^\s)]+\.vercel\.app[^\s)]*/i,
    /https?:\/\/[^\s)]+\.netlify\.app[^\s)]*/i,
    /https?:\/\/[^\s)]+\.railway\.app[^\s)]*/i,
    /https?:\/\/[^\s)]+\.render\.com[^\s)]*/i,
    /https?:\/\/[^\s)]+\.fly\.dev[^\s)]*/i,
    /https?:\/\/[^\s)]+\.herokuapp\.com[^\s)]*/i,
    /\[(?:live demo|demo|app|try it|production)\]\((https?:\/\/[^)]+)\)/i,
  ];
  for (const pat of patterns) {
    const match = readmeText.match(pat);
    if (match) return match[1] || match[0];
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main repo analysis
// ---------------------------------------------------------------------------

/**
 * Fetch and analyze a single GitHub repository.
 * Makes ~5 GitHub API calls per repo.
 *
 * @param owner - GitHub username of the repo owner
 * @param repoName - Repository name
 * @param githubUsername - The platform user's GitHub username (for commit filtering)
 * @returns RepoAnalysis with all detected attributes
 */
export async function analyzeRepo(
  owner: string,
  repoName: string,
  githubUsername?: string
): Promise<RepoAnalysis | null> {
  try {
    // 1. Repo metadata + languages (parallel)
    const [repoRes, langRes] = await Promise.all([
      fetch(`${GITHUB_API}/repos/${owner}/${repoName}`, {
        headers: githubHeaders(),
      }),
      fetch(`${GITHUB_API}/repos/${owner}/${repoName}/languages`, {
        headers: githubHeaders(),
      }),
    ]);

    if (!repoRes.ok) return null;

    const repoData = await repoRes.json();
    const languages: Record<string, number> = langRes.ok
      ? await langRes.json()
      : {};
    const totalBytes = Object.values(languages).reduce((a, b) => a + b, 0);

    // 2. File tree (to detect manifests, tests, deployment)
    const tree = await fetchRepoTree(owner, repoName);
    const { hasTests, hasDeployment } = analyzeFileTree(tree);

    // 3. Fetch manifest files that exist in the tree (parallel, max 3 files)
    const manifestsToFetch: Array<[string, "js" | "py"]> = [];
    if (tree.includes("package.json")) manifestsToFetch.push(["package.json", "js"]);
    if (tree.includes("requirements.txt")) manifestsToFetch.push(["requirements.txt", "py"]);

    const manifestResults = await Promise.all(
      manifestsToFetch.map(([path]) => fetchFileContent(owner, repoName, path))
    );

    const frameworks: string[] = [];
    for (let i = 0; i < manifestsToFetch.length; i++) {
      const [, type] = manifestsToFetch[i];
      if (type === "js") {
        frameworks.push(...detectFrameworksFromPackageJson(manifestResults[i]));
      } else if (type === "py") {
        frameworks.push(...detectFrameworksFromRequirements(manifestResults[i]));
      }
    }

    // 4. README
    let readmeText = "";
    let readmeSha = "";
    const readmePath = tree.find((p) =>
      /^readme\.(md|txt|rst)$/i.test(p)
    );
    if (readmePath) {
      const readmeRes = await fetch(
        `${GITHUB_API}/repos/${owner}/${repoName}/contents/${readmePath}`,
        { headers: githubHeaders() }
      );
      if (readmeRes.ok) {
        const readmeData = await readmeRes.json();
        readmeSha = readmeData.sha || "";
        readmeText = readmeData.content
          ? Buffer.from(readmeData.content, "base64").toString("utf-8")
          : "";
      }
    }

    // 5. Commit counts (parallel: total + user-filtered)
    const [totalCommits, userCommitCount] = await Promise.all([
      getTotalCommitCount(owner, repoName),
      githubUsername
        ? getTotalCommitCount(owner, repoName, githubUsername)
        : Promise.resolve(0),
    ]);

    // 6. Live URL detection from README
    const liveUrl = detectLiveUrl(readmeText);

    return {
      owner,
      repoName,
      stars: repoData.stargazers_count || 0,
      description: repoData.description || "",
      lastCommitAt: repoData.pushed_at || "",
      commitCount: totalCommits,
      userCommitCount,
      hasReadme: readmePath !== undefined,
      readmeSha,
      readmeText,
      hasTests,
      hasDeployment: hasDeployment || liveUrl !== null,
      liveUrl,
      languages,
      frameworks: [...new Set(frameworks)],
      totalBytes,
    };
  } catch (err) {
    console.error(`[skillVerification] analyzeRepo error for ${owner}/${repoName}:`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Confidence score calculator
// ---------------------------------------------------------------------------

/**
 * Calculate a 0–100 confidence score for a skill based on its evidence.
 * Pure function — no I/O, no LLM.
 *
 * Scoring rubric:
 *   10  — skill language/framework appears in at least one repo
 *    8  — each additional repo (max 40)
 *    5  — every 50 user commits (max 25)
 *    5  — stars 10–50
 *   10  — stars 50–200
 *   15  — stars 200+
 *   10  — has live deployment URL
 *    3  — README mentions the skill
 *    5  — has test files/config
 *    5  — last commit within 3 months
 *    2  — last commit 3–12 months ago
 */
export function calculateConfidenceScore(
  evidence: Pick<
    ISkillEvidence,
    | "repoCount"
    | "totalCommits"
    | "starsOnSkillRepos"
    | "hasProductionProject"
    | "lastUsed"
  > & {
    hasReadmeMention?: boolean;
    hasTests?: boolean;
  }
): number {
  let score = 0;

  // Base: skill detected in at least one repo
  if (evidence.repoCount >= 1) score += 10;

  // Additional repos (8 pts each, cap at 40 total for this bucket)
  const additionalRepos = Math.max(0, evidence.repoCount - 1);
  score += Math.min(additionalRepos * 8, 40);

  // Commits (5 pts per 50, cap 25)
  score += Math.min(Math.floor(evidence.totalCommits / 50) * 5, 25);

  // Stars
  if (evidence.starsOnSkillRepos >= 200) score += 15;
  else if (evidence.starsOnSkillRepos >= 50) score += 10;
  else if (evidence.starsOnSkillRepos >= 10) score += 5;

  // Production deployment
  if (evidence.hasProductionProject) score += 10;

  // README mentions skill
  if (evidence.hasReadmeMention) score += 3;

  // Has tests
  if (evidence.hasTests) score += 5;

  // Recency
  if (evidence.lastUsed) {
    const [year, month] = evidence.lastUsed.split("-").map(Number);
    if (year && month) {
      const monthsAgo =
        (new Date().getFullYear() - year) * 12 +
        (new Date().getMonth() + 1 - month);
      if (monthsAgo <= 3) score += 5;
      else if (monthsAgo <= 12) score += 2;
    }
  }

  return Math.min(score, 100);
}

// ---------------------------------------------------------------------------
// Display label generator
// ---------------------------------------------------------------------------

/**
 * Generate a recruiter-readable label for a skill.
 *
 * Example: "React — verified via 4 repos, 200+ commits, production project with 80 stars"
 */
export function generateDisplayLabel(
  skillName: string,
  evidence: ISkillEvidence,
  confidenceScore: number
): string {
  const parts: string[] = [];

  if (evidence.repoCount > 0) {
    parts.push(`${evidence.repoCount} repo${evidence.repoCount !== 1 ? "s" : ""}`);
  }
  if (evidence.totalCommits > 0) {
    const roundedCommits =
      evidence.totalCommits >= 1000
        ? `${Math.floor(evidence.totalCommits / 100) * 100}+`
        : evidence.totalCommits >= 100
        ? `${Math.floor(evidence.totalCommits / 10) * 10}+`
        : `${evidence.totalCommits}`;
    parts.push(`${roundedCommits} commits`);
  }
  if (evidence.hasProductionProject) {
    const starText =
      evidence.starsOnSkillRepos > 0
        ? ` with ${evidence.starsOnSkillRepos} stars`
        : "";
    parts.push(`production project${starText}`);
  }
  if (evidence.lastUsed) {
    parts.push(`last used ${evidence.lastUsed}`);
  }

  const detail = parts.length > 0 ? ` — verified via ${parts.join(", ")}` : "";
  return `${skillName}${detail} (${confidenceScore}/100)`;
}

// ---------------------------------------------------------------------------
// Improvement tips (for candidates viewing their own profile)
// ---------------------------------------------------------------------------

/**
 * Generate actionable improvement tips for a candidate's skill.
 *
 * @returns Array of tip strings
 */
export function generateImprovementTips(
  skillName: string,
  evidence: ISkillEvidence,
  confidenceScore: number
): string[] {
  const tips: string[] = [];

  if (confidenceScore < 80) {
    if (!evidence.hasProductionProject) {
      tips.push(
        `Add a live demo URL to your strongest ${skillName} repo to gain +10 points`
      );
    }
    if (evidence.totalCommits < 50) {
      tips.push(
        `Increase your commit count in ${skillName} projects — more commits show sustained usage`
      );
    }
    if (evidence.starsOnSkillRepos < 10 && evidence.repoCount < 3) {
      tips.push(`Add more projects that use ${skillName} to strengthen evidence`);
    }
    if (!evidence.strongestRepo?.hasReadme) {
      tips.push(
        `Add a detailed README to your ${skillName} projects to demonstrate project quality`
      );
    }
  }

  return tips;
}

// ---------------------------------------------------------------------------
// Groq-powered README analysis (sparingly used, with SHA caching)
// ---------------------------------------------------------------------------

let groq: Groq | null = null;

function getGroqClient(): Groq {
  if (!groq) {
    groq = new Groq({
      apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY,
    });
  }
  return groq;
}

/**
 * Extract skill context from a README using Groq.
 * Only called when the README SHA has changed since the last analysis.
 *
 * @param readmeText - Full README text (will be truncated to ~600 words)
 * @param repoName - For context
 * @returns Structured description or null on failure
 */
export async function extractReadmeContext(
  readmeText: string,
  repoName: string
): Promise<{ summary: string; techStack: string[] } | null> {
  // Truncate to keep prompt under 800 tokens
  const truncated = readmeText.slice(0, 2400);

  try {
    const completion = await getGroqClient().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `Analyze this README for the GitHub project "${repoName}".
Extract: 1) A one-sentence project summary, 2) Tech stack used.

README:
${truncated}

Respond with ONLY valid JSON:
{"summary":"string","techStack":["string"]}`,
        },
      ],
      max_tokens: 200,
    });

    const raw = completion.choices[0]?.message?.content || "";
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Full user skill pipeline
// ---------------------------------------------------------------------------

/**
 * Build verified skill data for all of a user's repos.
 *
 * Fetches repo analysis from GitHub, aggregates skill evidence across repos,
 * calculates confidence scores, and optionally calls Groq for README context
 * (only when the README SHA has changed).
 *
 * @param githubUsername - The user's GitHub username
 * @param repos - List of repos to analyze (owner + repoName)
 * @param existingSkills - Previously stored skills (for SHA-based caching)
 * @returns Array of VerifiedSkillData, one per detected skill
 */
export async function buildVerifiedSkillsForUser(
  githubUsername: string,
  repos: RepoBrief[],
  existingSkills: Array<{
    skillName: string;
    evidence: { readmeSha?: string; groqDescription?: string };
  }> = []
): Promise<VerifiedSkillData[]> {
  // Analyze each repo (with rate-limit-friendly delay for large portfolios)
  const repoAnalyses: RepoAnalysis[] = [];
  for (let i = 0; i < repos.length; i++) {
    if (i > 0 && i % 20 === 0) {
      // Pause briefly after every 20 repos to respect rate limits
      await new Promise((r) => setTimeout(r, 2000));
    }
    const result = await analyzeRepo(
      repos[i].owner,
      repos[i].repoName,
      githubUsername
    );
    if (result) repoAnalyses.push(result);
  }

  if (repoAnalyses.length === 0) return [];

  // Build a map: skillName -> list of repos that use it
  const skillRepoMap = new Map<string, RepoAnalysis[]>();

  for (const repo of repoAnalyses) {
    // Add languages as skills
    for (const lang of Object.keys(repo.languages)) {
      const list = skillRepoMap.get(lang) || [];
      list.push(repo);
      skillRepoMap.set(lang, list);
    }
    // Add detected frameworks as skills
    for (const framework of repo.frameworks) {
      const list = skillRepoMap.get(framework) || [];
      list.push(repo);
      skillRepoMap.set(framework, list);
    }
  }

  // Build a cache of existing SHA → description for Groq caching
  const shaDescriptionCache = new Map<string, string>();
  for (const skill of existingSkills) {
    if (skill.evidence.readmeSha && skill.evidence.groqDescription) {
      shaDescriptionCache.set(skill.evidence.readmeSha, skill.evidence.groqDescription);
    }
  }

  const totalBytes = repoAnalyses.reduce((sum, r) => sum + r.totalBytes, 0);

  const results: VerifiedSkillData[] = [];

  for (const [skillName, skillRepos] of skillRepoMap.entries()) {
    // Find the "strongest" repo for this skill
    const strongest = skillRepos.reduce((best, r) =>
      r.stars + r.userCommitCount > best.stars + best.userCommitCount ? r : best
    );

    const totalCommits = skillRepos.reduce((s, r) => s + r.userCommitCount, 0);
    const totalStars = skillRepos.reduce((s, r) => s + r.stars, 0);
    const hasProductionProject = skillRepos.some(
      (r) => r.hasDeployment || r.liveUrl !== null
    );

    // Most recent commit across skill repos
    const lastUsed = skillRepos
      .map((r) => r.lastCommitAt)
      .filter(Boolean)
      .sort()
      .reverse()[0]
      ?.slice(0, 7) // "2024-11"
      ?? "";

    // README mentions this skill?
    const hasReadmeMention = skillRepos.some((r) =>
      r.readmeText.toLowerCase().includes(skillName.toLowerCase())
    );

    // Language % of total bytes in portfolio
    const skillBytes = skillRepos.reduce(
      (s, r) => s + (r.languages[skillName] || 0),
      0
    );
    const languagesPercentage =
      totalBytes > 0 ? Math.round((skillBytes / totalBytes) * 100) : 0;

    // Groq README context (cached by SHA)
    let groqDescription: string | undefined;
    const readmeSha = strongest.readmeSha;
    if (readmeSha && strongest.readmeText) {
      if (shaDescriptionCache.has(readmeSha)) {
        groqDescription = shaDescriptionCache.get(readmeSha);
      } else {
        // Call Groq only if README changed
        const context = await extractReadmeContext(
          strongest.readmeText,
          strongest.repoName
        );
        if (context) {
          groqDescription = context.summary;
          shaDescriptionCache.set(readmeSha, context.summary);
        }
      }
    }

    const strongestRepo: IStrongestRepo = {
      name: strongest.repoName,
      stars: strongest.stars,
      commits: strongest.userCommitCount,
      hasReadme: strongest.hasReadme,
      hasLiveDemo: strongest.liveUrl !== null,
      description: groqDescription || strongest.description,
    };

    const evidence: ISkillEvidence = {
      repoCount: skillRepos.length,
      totalCommits,
      starsOnSkillRepos: totalStars,
      hasProductionProject,
      languagesPercentage,
      lastUsed,
      strongestRepo,
      readmeSha,
      groqDescription,
    };

    const confidenceScore = calculateConfidenceScore({
      repoCount: skillRepos.length,
      totalCommits,
      starsOnSkillRepos: totalStars,
      hasProductionProject,
      lastUsed,
      hasReadmeMention,
      hasTests: skillRepos.some((r) => r.hasTests),
    });

    const displayLabel = generateDisplayLabel(skillName, evidence, confidenceScore);

    results.push({
      skillName,
      verified: confidenceScore >= 30, // threshold: must have meaningful evidence
      evidence,
      confidenceScore,
      displayLabel,
      source: "github",
    });
  }

  // Sort by confidence score descending
  return results.sort((a, b) => b.confidenceScore - a.confidenceScore);
}
