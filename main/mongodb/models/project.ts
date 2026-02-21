import mongoose, { Schema, Document, models, Model } from "mongoose";

export interface ITeamMember {
  userId: string;
  userName: string;
  userImage?: string;
  role?: string;
  taggedAt: Date;
}

export interface IProject {
  title: string;
  synopsis: string;
  gitRepo?: string;
  weblinks: string[];
  createdBy: string;
  teamMembers: ITeamMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IProjectDocument extends IProject, Document {}

const TeamMemberSchema = new Schema<ITeamMember>(
  {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userImage: String,
    role: String,
    taggedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ProjectSchema = new Schema<IProjectDocument>(
  {
    title: { type: String, required: true },
    synopsis: { type: String, required: true },
    gitRepo: String,
    weblinks: { type: [String], default: [] },
    createdBy: { type: String, required: true },
    teamMembers: { type: [TeamMemberSchema], default: [] },
  },
  { timestamps: true }
);

ProjectSchema.index({ createdBy: 1 });
ProjectSchema.index({ "teamMembers.userId": 1 });

export const Project: Model<IProjectDocument> =
  models.Project || mongoose.model<IProjectDocument>("Project", ProjectSchema);
