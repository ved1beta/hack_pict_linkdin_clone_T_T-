import mongoose, { Schema, Document, models, Model } from "mongoose";

export type JobType = "github" | "linkedin" | "full";
export type JobStatus = "pending" | "running" | "completed" | "failed";

export interface IScrapeJob {
  userId: string;
  jobType: JobType;
  status: JobStatus;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  changesFound?: boolean;
  triggeredBy: "webhook" | "schedule" | "user" | "admin";
  agendaJobId?: string; // Agenda.js internal job ID for cancellation
}

export interface IScrapeJobDocument extends IScrapeJob, Document {}

const ScrapeJobSchema = new Schema<IScrapeJobDocument>(
  {
    userId: { type: String, required: true, index: true },
    jobType: {
      type: String,
      enum: ["github", "linkedin", "full"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed"],
      default: "pending",
    },
    scheduledAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    errorMessage: { type: String },
    changesFound: { type: Boolean },
    triggeredBy: {
      type: String,
      enum: ["webhook", "schedule", "user", "admin"],
      required: true,
    },
    agendaJobId: { type: String },
  },
  { timestamps: true }
);

// Auto-expire completed/failed jobs after 30 days to keep the collection lean
ScrapeJobSchema.index(
  { completedAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30, partialFilterExpression: { status: { $in: ["completed", "failed"] } } }
);

export interface IScrapeJobModel extends Model<IScrapeJobDocument> {}

export const ScrapeJob: IScrapeJobModel =
  (models.ScrapeJob as IScrapeJobModel) ||
  (mongoose.model<IScrapeJobDocument>(
    "ScrapeJob",
    ScrapeJobSchema
  ) as IScrapeJobModel);
