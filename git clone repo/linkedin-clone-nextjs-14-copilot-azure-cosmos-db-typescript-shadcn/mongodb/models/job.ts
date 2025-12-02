import mongoose, { Schema, Document, models, Model } from "mongoose";

export interface IJobApplication {
  userId: string;
  userName: string;
  userEmail: string;
  userImage?: string;
  resumeUrl?: string;
  appliedAt: Date;
  status: "pending" | "reviewed" | "accepted" | "rejected";
  aiScore?: number; // AI matching score
}

export interface IJob {
  recruiterId: string;
  recruiterName: string;
  recruiterImage?: string;
  companyName: string;
  companyLogo?: string;
  title: string;
  description: string;
  requirements: string[];
  location: string;
  jobType: "full-time" | "part-time" | "internship" | "contract";
  experienceLevel: "entry" | "mid" | "senior";
  salary?: string;
  skills: string[];
  applications: IJobApplication[];
  status: "open" | "closed";
  postedAt: Date;
}

export interface IJobDocument extends IJob, Document {
  createdAt: Date;
  updatedAt: Date;
}

const JobApplicationSchema = new Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  userImage: String,
  resumeUrl: String,
  appliedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["pending", "reviewed", "accepted", "rejected"],
    default: "pending",
  },
  aiScore: Number,
});

const JobSchema = new Schema<IJobDocument>(
  {
    recruiterId: { type: String, required: true },
    recruiterName: { type: String, required: true },
    recruiterImage: String,
    companyName: { type: String, required: true },
    companyLogo: String,
    title: { type: String, required: true },
    description: { type: String, required: true },
    requirements: [String],
    location: { type: String, required: true },
    jobType: {
      type: String,
      enum: ["full-time", "part-time", "internship", "contract"],
      default: "full-time",
    },
    experienceLevel: {
      type: String,
      enum: ["entry", "mid", "senior"],
      default: "entry",
    },
    salary: String,
    skills: [String],
    applications: [JobApplicationSchema],
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
    postedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Static methods
JobSchema.statics.getAllJobs = async function () {
  return await this.find({ status: "open" })
    .sort({ postedAt: -1 })
    .lean();
};

JobSchema.statics.getJobsByRecruiter = async function (recruiterId: string) {
  return await this.find({ recruiterId })
    .sort({ postedAt: -1 })
    .lean();
};

JobSchema.statics.getJobById = async function (jobId: string) {
  return await this.findById(jobId).lean();
};

export const Job: Model<IJobDocument> =
  models.Job || mongoose.model<IJobDocument>("Job", JobSchema);