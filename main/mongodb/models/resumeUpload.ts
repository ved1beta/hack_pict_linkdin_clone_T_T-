import mongoose, { Schema, Document, models, Model } from "mongoose";

export interface IResumeUpload {
  userId: string;
  fileName: string;
  hashedName: string;
  fileUrl: string;
  mimeType: string;
  fileSize?: number;
  extractedText?: string;
  source?: "file" | "github";
  createdAt: Date;
}

export interface IResumeUploadDocument extends IResumeUpload, Document {}

const ResumeUploadSchema = new Schema<IResumeUploadDocument>(
  {
    userId: { type: String, required: true },
    fileName: { type: String, required: true },
    hashedName: { type: String, required: true, unique: true },
    fileUrl: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: Number,
    extractedText: String,
    source: { type: String, enum: ["file", "github"], default: "file" },
  },
  { timestamps: true }
);

ResumeUploadSchema.index({ userId: 1, createdAt: -1 });

export const ResumeUpload: Model<IResumeUploadDocument> =
  models.ResumeUpload ||
  mongoose.model<IResumeUploadDocument>("ResumeUpload", ResumeUploadSchema);
