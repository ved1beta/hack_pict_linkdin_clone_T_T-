import mongoose, { Schema, Document, models, Model } from "mongoose";

export interface IResumeAnalysis {
  userId: string;
  jobId?: string;
  jobTitle?: string;
  companyName?: string;
  overallScore: number; // 0-100
  resumeScore: number; // Standalone resume quality 0-100
  jobMatchScore?: number; // Match to specific job 0-100
  strengths: string[];
  improvements: string[];
  matchedSkills: string[];
  missingSkills: string[];
  recommendation: string; // Should apply, improve first, etc.
  analyzedAt: Date;
}

export interface IResumeAnalysisDocument extends IResumeAnalysis, Document {}

const ResumeAnalysisSchema = new Schema<IResumeAnalysisDocument>(
  {
    userId: { type: String, required: true },
    jobId: String,
    jobTitle: String,
    companyName: String,
    overallScore: { type: Number, required: true },
    resumeScore: { type: Number, required: true },
    jobMatchScore: Number,
    strengths: [String],
    improvements: [String],
    matchedSkills: [String],
    missingSkills: [String],
    recommendation: { type: String, required: true },
    analyzedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ResumeAnalysisSchema.index({ userId: 1, analyzedAt: -1 });
ResumeAnalysisSchema.index({ userId: 1, jobId: 1 });

ResumeAnalysisSchema.statics.getByUserId = async function (userId: string) {
  return await this.find({ userId }).sort({ analyzedAt: -1 }).lean();
};

ResumeAnalysisSchema.statics.getByUserAndJob = async function (
  userId: string,
  jobId: string
) {
  return await this.findOne({ userId, jobId }).sort({ analyzedAt: -1 }).lean();
};

export const ResumeAnalysis: Model<IResumeAnalysisDocument> =
  models.ResumeAnalysis ||
  mongoose.model<IResumeAnalysisDocument>("ResumeAnalysis", ResumeAnalysisSchema);
