import mongoose, { Schema, Document, models, Model } from "mongoose";

export type NotificationType =
  | "profile_update"
  | "skill_verified"
  | "job_match"
  | "info"
  | "warning";

export interface INotification {
  userId: string;
  message: string;
  type: NotificationType;
  read: boolean;
  metadata?: Record<string, unknown>; // e.g., { skillsAdded: ["React", "TypeScript"] }
  createdAt: Date;
}

export interface INotificationDocument extends INotification, Document {}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: { type: String, required: true, index: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["profile_update", "skill_verified", "job_match", "info", "warning"],
      default: "info",
    },
    read: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Auto-delete notifications older than 60 days
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 60 }
);

export interface INotificationModel extends Model<INotificationDocument> {}

export const Notification: INotificationModel =
  (models.Notification as INotificationModel) ||
  (mongoose.model<INotificationDocument>(
    "Notification",
    NotificationSchema
  ) as INotificationModel);
