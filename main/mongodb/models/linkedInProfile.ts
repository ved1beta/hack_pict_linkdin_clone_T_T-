import mongoose, { Schema, Document, models, Model } from "mongoose";

export interface ILinkedInEducation {
  school: string;
  degree?: string;
  field?: string;
  startYear?: number;
  endYear?: number;
}

export interface ILinkedInExperience {
  company: string;
  role: string;
  duration: string;
  tech_used: string[];
  impact_description: string;
}

export interface ILinkedInCertification {
  name: string;
  issuer?: string;
  date?: string;
}

export interface ILinkedInProfile {
  userId: string;
  headline?: string;
  currentCompany?: string;
  currentRole?: string;
  location?: string;
  profilePicture?: string;
  aboutText?: string;
  education: ILinkedInEducation[];
  experience: ILinkedInExperience[];
  certifications: ILinkedInCertification[];
  skillsListed: string[];
  linkedinUrl?: string;
  scrapedAt?: Date;
  source: "oauth" | "url" | "manual";
  // Raw tokens for OAuth approach
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
}

export interface ILinkedInProfileDocument extends ILinkedInProfile, Document {}

const LinkedInProfileSchema = new Schema<ILinkedInProfileDocument>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    headline: { type: String },
    currentCompany: { type: String },
    currentRole: { type: String },
    location: { type: String },
    profilePicture: { type: String },
    aboutText: { type: String },
    education: [
      {
        school: { type: String, required: true },
        degree: { type: String },
        field: { type: String },
        startYear: { type: Number },
        endYear: { type: Number },
        _id: false,
      },
    ],
    experience: [
      {
        company: { type: String, required: true },
        role: { type: String, required: true },
        duration: { type: String },
        tech_used: [{ type: String }],
        impact_description: { type: String },
        _id: false,
      },
    ],
    certifications: [
      {
        name: { type: String, required: true },
        issuer: { type: String },
        date: { type: String },
        _id: false,
      },
    ],
    skillsListed: [{ type: String }],
    linkedinUrl: { type: String },
    scrapedAt: { type: Date },
    source: {
      type: String,
      enum: ["oauth", "url", "manual"],
      default: "url",
    },
    accessToken: { type: String, select: false },
    refreshToken: { type: String, select: false },
    tokenExpiresAt: { type: Date },
  },
  { timestamps: true }
);

export interface ILinkedInProfileModel extends Model<ILinkedInProfileDocument> {}

export const LinkedInProfile: ILinkedInProfileModel =
  (models.LinkedInProfile as ILinkedInProfileModel) ||
  (mongoose.model<ILinkedInProfileDocument>(
    "LinkedInProfile",
    LinkedInProfileSchema
  ) as ILinkedInProfileModel);
