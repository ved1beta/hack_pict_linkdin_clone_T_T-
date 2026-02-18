import mongoose, { Schema, Document, models, Model } from "mongoose";

export interface IWorkExperience {
  company: string;
  role: string;
  duration: string;
}

export interface IEducation {
  institution: string;
  degree: string;
  year: string;
}

export interface IParsedResume {
  resumeUploadId: mongoose.Types.ObjectId;
  name?: string;
  email?: string;
  phone?: string;
  skills: string[];
  workExperience: IWorkExperience[];
  education: IEducation[];
  totalYearsExperience?: number;
  rawStructured?: object;
  createdAt: Date;
}

export interface IParsedResumeDocument extends IParsedResume, Document {}

const ParsedResumeSchema = new Schema<IParsedResumeDocument>(
  {
    resumeUploadId: {
      type: Schema.Types.ObjectId,
      ref: "ResumeUpload",
      required: true,
      unique: true,
    },
    name: String,
    email: String,
    phone: String,
    skills: [String],
    workExperience: [
      {
        company: String,
        role: String,
        duration: String,
      },
    ],
    education: [
      {
        institution: String,
        degree: String,
        year: String,
      },
    ],
    totalYearsExperience: Number,
    rawStructured: Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const ParsedResume: Model<IParsedResumeDocument> =
  models.ParsedResume ||
  mongoose.model<IParsedResumeDocument>("ParsedResume", ParsedResumeSchema);
