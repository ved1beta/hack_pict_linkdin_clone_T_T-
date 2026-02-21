import mongoose, { Schema, Document, models, Model } from "mongoose";

export interface IStrongestRepo {
  name: string;
  stars: number;
  commits: number;
  hasReadme: boolean;
  hasLiveDemo: boolean;
  description: string;
}

export interface ISkillEvidence {
  repoCount: number;
  totalCommits: number;
  starsOnSkillRepos: number;
  hasProductionProject: boolean;
  languagesPercentage: number;
  lastUsed: string; // "2024-11"
  strongestRepo: IStrongestRepo | null;
  readmeSha?: string;          // GitHub blob SHA for cache invalidation
  groqDescription?: string;    // Cached Groq-generated description
}

export interface IVerifiedSkill {
  userId: string;
  skillName: string;
  verified: boolean;
  evidence: ISkillEvidence;
  confidenceScore: number; // 0–100
  displayLabel: string;
  source: "github" | "linkedin" | "both";
  verifiedAt?: Date;
  lastUpdated: Date;
}

export interface IVerifiedSkillDocument extends IVerifiedSkill, Document {}

const StrongestRepoSchema = new Schema<IStrongestRepo>(
  {
    name: String,
    stars: { type: Number, default: 0 },
    commits: { type: Number, default: 0 },
    hasReadme: { type: Boolean, default: false },
    hasLiveDemo: { type: Boolean, default: false },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const SkillEvidenceSchema = new Schema<ISkillEvidence>(
  {
    repoCount: { type: Number, default: 0 },
    totalCommits: { type: Number, default: 0 },
    starsOnSkillRepos: { type: Number, default: 0 },
    hasProductionProject: { type: Boolean, default: false },
    languagesPercentage: { type: Number, default: 0 },
    lastUsed: { type: String, default: "" },
    strongestRepo: { type: StrongestRepoSchema, default: null },
    readmeSha: { type: String },
    groqDescription: { type: String },
  },
  { _id: false }
);

const VerifiedSkillSchema = new Schema<IVerifiedSkillDocument>(
  {
    userId: { type: String, required: true, index: true },
    skillName: { type: String, required: true },
    verified: { type: Boolean, default: false },
    evidence: { type: SkillEvidenceSchema, required: true },
    confidenceScore: { type: Number, default: 0, min: 0, max: 100 },
    displayLabel: { type: String, default: "" },
    source: {
      type: String,
      enum: ["github", "linkedin", "both"],
      default: "github",
    },
    verifiedAt: { type: Date },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound index: one entry per user+skill, upsertable
VerifiedSkillSchema.index({ userId: 1, skillName: 1 }, { unique: true });

export interface IVerifiedSkillModel extends Model<IVerifiedSkillDocument> {}

export const VerifiedSkill: IVerifiedSkillModel =
  (models.VerifiedSkill as IVerifiedSkillModel) ||
  (mongoose.model<IVerifiedSkillDocument>(
    "VerifiedSkill",
    VerifiedSkillSchema
  ) as IVerifiedSkillModel);
