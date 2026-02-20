import mongoose, { Schema, Document, models, Model } from "mongoose";

export interface IGitRepo {
  userId: string;
  url: string;
  repoName: string;
  owner: string;
}

export interface IGitRepoDocument extends IGitRepo, Document {
  createdAt?: Date;
  updatedAt?: Date;
}

const GitRepoSchema = new Schema<IGitRepoDocument>(
  {
    userId: { type: String, required: true },
    url: { type: String, required: true },
    repoName: { type: String, required: true },
    owner: { type: String, required: true },
  },
  { timestamps: true }
);

GitRepoSchema.index({ userId: 1 });
GitRepoSchema.index({ userId: 1, url: 1 }, { unique: true });

export const GitRepo: Model<IGitRepoDocument> =
  models.GitRepo || mongoose.model<IGitRepoDocument>("GitRepo", GitRepoSchema);
