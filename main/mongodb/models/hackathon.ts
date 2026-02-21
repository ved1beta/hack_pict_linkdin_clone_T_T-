import mongoose, { Schema, Document, models, Model } from "mongoose";

export interface IHackathonParticipant {
  userId: string;
  userName: string;
  userEmail: string;
  collegeName?: string;
  branch?: string;
  cgpa?: number;
  registeredAt: Date;
}

export interface IHackathon {
  recruiterId: string;
  recruiterName: string;
  companyName: string;
  jobId?: string; // Optional link to job posting
  title: string;
  description: string;
  type: "online" | "offline";
  venue?: string; // For offline hackathons
  date: Date;
  startTime: string;
  endTime: string;
  duration: string; // e.g., "24 hours", "2 days"
  maxParticipants?: number;
  participants: IHackathonParticipant[];
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  prizes?: string[];
  requirements?: string[];
  createdAt: Date;
}

export interface IHackathonDocument extends IHackathon, Document {
  createdAt: Date;
  updatedAt: Date;
}

const HackathonParticipantSchema = new Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  collegeName: String,
  branch: String,
  cgpa: Number,
  registeredAt: { type: Date, default: Date.now },
});

const HackathonSchema = new Schema<IHackathonDocument>(
  {
    recruiterId: { type: String, required: true, index: true },
    recruiterName: { type: String, required: true },
    companyName: { type: String, required: true },
    jobId: String,
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: ["online", "offline"],
      required: true,
    },
    venue: String,
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    duration: { type: String, required: true },
    maxParticipants: Number,
    participants: [HackathonParticipantSchema],
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming",
    },
    prizes: [String],
    requirements: [String],
  },
  {
    timestamps: true,
  }
);

// Static methods
HackathonSchema.statics.getByRecruiter = async function (recruiterId: string) {
  return await this.find({ recruiterId }).sort({ date: -1 }).lean();
};

HackathonSchema.statics.getUpcoming = async function () {
  return await this.find({
    status: "upcoming",
    date: { $gte: new Date() },
  })
    .sort({ date: 1 })
    .lean();
};

export interface IHackathonModel extends Model<IHackathonDocument> {
  getByRecruiter(recruiterId: string): Promise<IHackathonDocument[]>;
  getUpcoming(): Promise<IHackathonDocument[]>;
}

export const Hackathon: IHackathonModel =
  (models.Hackathon as IHackathonModel) ||
  (mongoose.model<IHackathonDocument>("Hackathon", HackathonSchema) as IHackathonModel);


