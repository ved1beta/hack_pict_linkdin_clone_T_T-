import mongoose, { Schema, Document, models, Model } from "mongoose";

export interface ICollegeVerificationRequest {
  userId: string;
  userName: string;
  userEmail: string;
  collegeName: string;
  collegeEmail: string;
  studentId: string;
  department?: string;
  branch?: string;
  graduationYear?: number;
  cgpa?: number;
  status: "pending" | "approved" | "rejected";
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string; // College admin user ID
  rejectionReason?: string;
}

export interface ICollegeVerificationRequestDocument extends ICollegeVerificationRequest, Document {
  createdAt: Date;
  updatedAt: Date;
}

const CollegeVerificationRequestSchema = new Schema<ICollegeVerificationRequestDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    collegeName: {
      type: String,
      required: true,
      index: true,
    },
    collegeEmail: {
      type: String,
      required: true,
    },
    studentId: {
      type: String,
      required: true,
    },
    department: {
      type: String,
    },
    branch: {
      type: String,
    },
    graduationYear: {
      type: Number,
    },
    cgpa: {
      type: Number,
      min: 0,
      max: 10,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: String,
    },
    rejectionReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Static methods
CollegeVerificationRequestSchema.statics.getPendingRequests = async function (collegeName?: string) {
  const query: any = { status: "pending" };
  if (collegeName) {
    query.collegeName = collegeName;
  }
  return await this.find(query).sort({ submittedAt: -1 }).lean();
};

CollegeVerificationRequestSchema.statics.getRequestByUserId = async function (userId: string) {
  return await this.findOne({ userId }).sort({ submittedAt: -1 }).lean();
};

export interface ICollegeVerificationRequestModel extends Model<ICollegeVerificationRequestDocument> {
  getPendingRequests(collegeName?: string): Promise<ICollegeVerificationRequestDocument[]>;
  getRequestByUserId(userId: string): Promise<ICollegeVerificationRequestDocument | null>;
}

export const CollegeVerificationRequest: ICollegeVerificationRequestModel =
  (models.CollegeVerificationRequest as ICollegeVerificationRequestModel) ||
  (mongoose.model<ICollegeVerificationRequestDocument>(
    "CollegeVerificationRequest",
    CollegeVerificationRequestSchema
  ) as ICollegeVerificationRequestModel);

