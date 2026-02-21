import mongoose, { Schema, Document, models, Model } from "mongoose";

export interface IWebhookRegistration {
  userId: string;
  repoOwner: string;
  repoName: string;
  webhookId: number;      // GitHub's assigned hook ID
  secret: string;        // HMAC secret for this webhook
  events: string[];      // ["push", "create", "public", "repository"]
  active: boolean;
  createdAt: Date;
  lastTriggeredAt?: Date;
}

export interface IWebhookRegistrationDocument
  extends IWebhookRegistration,
    Document {}

const WebhookRegistrationSchema = new Schema<IWebhookRegistrationDocument>(
  {
    userId: { type: String, required: true, index: true },
    repoOwner: { type: String, required: true },
    repoName: { type: String, required: true },
    webhookId: { type: Number, required: true },
    secret: { type: String, required: true, select: false },
    events: { type: [String], default: ["push", "create", "public", "repository"] },
    active: { type: Boolean, default: true },
    lastTriggeredAt: { type: Date },
  },
  { timestamps: true }
);

// One webhook per repo (unique constraint)
WebhookRegistrationSchema.index(
  { repoOwner: 1, repoName: 1 },
  { unique: true }
);

export interface IWebhookRegistrationModel
  extends Model<IWebhookRegistrationDocument> {}

export const WebhookRegistration: IWebhookRegistrationModel =
  (models.WebhookRegistration as IWebhookRegistrationModel) ||
  (mongoose.model<IWebhookRegistrationDocument>(
    "WebhookRegistration",
    WebhookRegistrationSchema
  ) as IWebhookRegistrationModel);
