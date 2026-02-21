import mongoose, { Schema, Document, models, Model } from "mongoose";

export type UpdateType =
  | "github_webhook"
  | "scheduled_rescrape"
  | "manual_refresh"
  | "linkedin_sync";

export type TriggeredBy = "webhook" | "schedule" | "user" | "admin";

export interface ISkillStrengthened {
  skillName: string;
  previousScore: number;
  newScore: number;
}

export interface IProfileUpdateHistory {
  userId: string;
  updateType: UpdateType;
  changesDetected: Record<string, unknown>;
  skillsAdded: string[];
  skillsStrengthened: ISkillStrengthened[];
  triggeredBy: TriggeredBy;
  reposScraped?: number;
  createdAt: Date;
}

export interface IProfileUpdateHistoryDocument
  extends IProfileUpdateHistory,
    Document {}

const ProfileUpdateHistorySchema = new Schema<IProfileUpdateHistoryDocument>(
  {
    userId: { type: String, required: true, index: true },
    updateType: {
      type: String,
      enum: [
        "github_webhook",
        "scheduled_rescrape",
        "manual_refresh",
        "linkedin_sync",
      ],
      required: true,
    },
    changesDetected: { type: Schema.Types.Mixed, default: {} },
    skillsAdded: { type: [String], default: [] },
    skillsStrengthened: [
      {
        skillName: { type: String },
        previousScore: { type: Number },
        newScore: { type: Number },
        _id: false,
      },
    ],
    triggeredBy: {
      type: String,
      enum: ["webhook", "schedule", "user", "admin"],
      required: true,
    },
    reposScraped: { type: Number },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Keep only last 50 history records per user (TTL index removes old ones after 90 days)
ProfileUpdateHistorySchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 }
);

export interface IProfileUpdateHistoryModel
  extends Model<IProfileUpdateHistoryDocument> {}

export const ProfileUpdateHistory: IProfileUpdateHistoryModel =
  (models.ProfileUpdateHistory as IProfileUpdateHistoryModel) ||
  (mongoose.model<IProfileUpdateHistoryDocument>(
    "ProfileUpdateHistory",
    ProfileUpdateHistorySchema
  ) as IProfileUpdateHistoryModel);
