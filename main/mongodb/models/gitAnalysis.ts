import mongoose, { Schema, Document, models, Model } from "mongoose";

export interface IGitAnalysis {
  userId: string;
  score: number;
  strengths: string[];
  improvements: string[];
  recommendation: string;
  repoSummary?: { repoName: string; languages: string[]; description?: string }[];
  analyzedAt: Date;
}

export interface IGitAnalysisDocument extends IGitAnalysis, Document {}

const GitAnalysisSchema = new Schema<IGitAnalysisDocument>(
  {
    userId: { type: String, required: true },
    score: { type: Number, required: true },
    strengths: [String],
    improvements: [String],
    recommendation: { type: String, default: "" },
    repoSummary: [
      {
        repoName: String,
        languages: [String],
        description: String,
      },
    ],
    analyzedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

GitAnalysisSchema.index({ userId: 1, analyzedAt: -1 });

export const GitAnalysis: Model<IGitAnalysisDocument> =
  models.GitAnalysis ||
  mongoose.model<IGitAnalysisDocument>("GitAnalysis", GitAnalysisSchema);
