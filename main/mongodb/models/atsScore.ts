import mongoose, { Schema, Document, models, Model } from "mongoose";

export interface IAtsScore {
  resumeUploadId: mongoose.Types.ObjectId;
  parsedResumeId?: mongoose.Types.ObjectId;
  jobId: string;
  userId: string;
  score: number;
  skillMatch: number;
  experienceMatch: number;
  educationMatch: number;
  keywordDensity: number;
  semanticSimilarity: number;
  breakdown?: object;
  createdAt: Date;
}

export interface IAtsScoreDocument extends IAtsScore, Document {}

const AtsScoreSchema = new Schema<IAtsScoreDocument>(
  {
    resumeUploadId: {
      type: Schema.Types.ObjectId,
      ref: "ResumeUpload",
      required: true,
    },
    parsedResumeId: { type: Schema.Types.ObjectId, ref: "ParsedResume" },
    jobId: { type: String, required: true },
    userId: { type: String, required: true },
    score: { type: Number, required: true },
    skillMatch: { type: Number, required: true },
    experienceMatch: { type: Number, required: true },
    educationMatch: { type: Number, required: true },
    keywordDensity: { type: Number, required: true },
    semanticSimilarity: { type: Number, required: true },
    breakdown: Schema.Types.Mixed,
  },
  { timestamps: true }
);

AtsScoreSchema.index({ resumeUploadId: 1, jobId: 1 }, { unique: true });
AtsScoreSchema.index({ userId: 1 });
AtsScoreSchema.index({ jobId: 1 });

export const AtsScore: Model<IAtsScoreDocument> =
  models.AtsScore || mongoose.model<IAtsScoreDocument>("AtsScore", AtsScoreSchema);
