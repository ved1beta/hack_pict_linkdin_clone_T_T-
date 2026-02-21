import mongoose, { Schema, Document, models, Model } from "mongoose";

export type PipelineStageType =
  | "reviewed"
  | "shortlisted"
  | "interview_scheduled"
  | "rejected";

export interface IStageHistory {
  from: PipelineStageType;
  to: PipelineStageType;
  movedBy: string;           // Recruiter userId
  movedAt: Date;
  reason?: string;           // Why they moved (e.g., "Strong technical fit")
}

export interface IRecruiterNote {
  text: string;
  addedBy: string;           // Recruiter userId
  addedAt: Date;
  type: "general" | "rejection_reason" | "suggestion";
}

export interface ICandidateNote {
  text: string;
  addedAt: Date;
}

export interface IPipelineStage {
  jobId: string;             // Job posting ID (MongoDB ObjectId as string)
  candidateId: string;       // Candidate userId (Clerk ID)
  currentStage: PipelineStageType;
  recruiterNotes: IRecruiterNote[];  // Internal notes (why rejected, suggestions, general notes)
  candidateNotes: ICandidateNote[];  // Candidate's own notes (visible to recruiters)
  stageHistory: IStageHistory[];     // Audit trail of stage changes
  createdAt: Date;
  updatedAt: Date;
}

export interface IPipelineStageDoccument extends IPipelineStage, Document {}

const StageHistorySchema = new Schema<IStageHistory>(
  {
    from: { type: String, enum: ["reviewed", "shortlisted", "interview_scheduled", "rejected"] },
    to: { type: String, enum: ["reviewed", "shortlisted", "interview_scheduled", "rejected"] },
    movedBy: { type: String, required: true },
    movedAt: { type: Date, default: Date.now },
    reason: { type: String },
  },
  { _id: false }
);

const RecruiterNoteSchema = new Schema<IRecruiterNote>(
  {
    text: { type: String, required: true },
    addedBy: { type: String, required: true },
    addedAt: { type: Date, default: Date.now },
    type: {
      type: String,
      enum: ["general", "rejection_reason", "suggestion"],
      default: "general",
    },
  },
  { _id: false }
);

const CandidateNoteSchema = new Schema<ICandidateNote>(
  {
    text: { type: String, required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PipelineStageSchema = new Schema<IPipelineStageDoccument>(
  {
    jobId: { type: String, required: true, index: true },
    candidateId: { type: String, required: true, index: true },
    currentStage: {
      type: String,
      enum: ["reviewed", "shortlisted", "interview_scheduled", "rejected"],
      default: "reviewed",
    },
    recruiterNotes: { type: [RecruiterNoteSchema], default: [] },
    candidateNotes: { type: [CandidateNoteSchema], default: [] },
    stageHistory: { type: [StageHistorySchema], default: [] },
  },
  { timestamps: true }
);

// One entry per candidate per job
PipelineStageSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });
// Fast lookup by job to get all candidates in that pipeline
PipelineStageSchema.index({ jobId: 1, currentStage: 1 });

export interface IPipelineStageModel extends Model<IPipelineStageDoccument> {}

export const PipelineStage: IPipelineStageModel =
  (models.PipelineStage as IPipelineStageModel) ||
  (mongoose.model<IPipelineStageDoccument>(
    "PipelineStage",
    PipelineStageSchema
  ) as IPipelineStageModel);
