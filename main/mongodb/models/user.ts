import mongoose, { Schema, Document, models, Model } from "mongoose";

export type UserType = "student" | "recruiter";

// Recommendation interface
export interface IRecommendation {
  companyName: string;
  jobId?: string;
  recommendedAt: Date;
}

// Interview interface
export interface IInterview {
  companyName: string;
  jobId?: string;
  scheduledAt: Date;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  notes?: string;
  createdAt: Date;
}

// College Verification interface
export interface ICollegeVerification {
  collegeName: string;
  collegeEmail: string;
  studentId: string;
  department?: string;
  branch?: string; // Engineering branch (CS, IT, Mechanical, etc.)
  graduationYear?: number;
  cgpa?: number; // CGPA/GPA
  status: "pending" | "approved" | "rejected";
  submittedAt: Date;
  reviewedAt?: Date;
  rejectionReason?: string;
}

export interface IUser {
  userId: string; // Clerk user ID
  userType?: UserType;
  email: string;
  firstName: string;
  lastName: string;
  userImage?: string;
  resumeUrl?: string; // For students
  companyName?: string; // For recruiters
  companyWebsite?: string; // For recruiters
  location?: string;
  bio?: string;
  skills?: string[];
  experience?: string;
  education?: string;
  connections?: string[]; // Array of connected user IDs
  
  // Recommendations and Interviews
  recommendations?: IRecommendation[];
  interviews?: IInterview[];
  
  // College Verification (for students)
  collegeVerification?: ICollegeVerification;

  // GitHub & LinkedIn for resume generation
  githubUsername?: string;
  linkedInUrl?: string;
  linkedInText?: string;
  
  codingProfiles?: {
    leetcode?: {
      username: string;
      rating: number;
      solved: number;
      ranking: number;
      lastUpdated?: Date;
    };
    codechef?: {
      username: string;
      rating: number;
      stars: string;
      ranking: number;
      lastUpdated?: Date;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    userType: {
      type: String,
      enum: ["student", "recruiter"],
      default: "student",
    },
    email: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    userImage: String,
    
    // Student-specific fields
    resumeUrl: String,
    skills: [String],
    education: String,
    
    // Recruiter-specific fields
    companyName: String,
    companyWebsite: String,
    
    // Common fields
    location: String,
    bio: String,
    experience: String,
    
    // Connections
    connections: {
      type: [String],
      default: [],
    },
    
    // Recommendations - Companies that recommended this candidate
    recommendations: [
      {
        companyName: {
          type: String,
          required: true,
        },
        jobId: {
          type: String,
        },
        recommendedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    
    // Scheduled Interviews
    interviews: [
      {
        companyName: {
          type: String,
          required: true,
        },
        jobId: {
          type: String,
        },
        scheduledAt: {
          type: Date,
          required: true,
        },
        status: {
          type: String,
          enum: ["SCHEDULED", "COMPLETED", "CANCELLED"],
          default: "SCHEDULED",
        },
        notes: {
          type: String,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    
    // GitHub & LinkedIn
    githubUsername: String,
    linkedInUrl: String,
    linkedInText: String,

    // College Verification
    collegeVerification: {
      collegeName: {
        type: String,
      },
      collegeEmail: {
        type: String,
      },
      studentId: {
        type: String,
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
      },
      submittedAt: {
        type: Date,
      },
      reviewedAt: {
        type: Date,
      },
      rejectionReason: {
        type: String,
      },
    },
    
    // Coding Profiles
    codingProfiles: {
      leetcode: {
        username: { type: String, default: "" },
        rating: { type: Number, default: 0 },
        solved: { type: Number, default: 0 },
        ranking: { type: Number, default: 0 },
        lastUpdated: { type: Date },
      },
      codechef: {
        username: { type: String, default: "" },
        rating: { type: Number, default: 0 },
        stars: { type: String, default: "" },
        ranking: { type: Number, default: 0 },
        lastUpdated: { type: Date },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Static methods
UserSchema.statics.findByUserId = async function (userId: string) {
  return await this.findOne({ userId });
};

UserSchema.statics.createOrUpdateUser = async function (userData: Partial<IUser>) {
  const user = await this.findOneAndUpdate(
    { userId: userData.userId },
    { $set: userData },
    { upsert: true, new: true }
  );
  return user;
};

UserSchema.statics.getAllUsers = async function () {
  return await this.find().sort({ createdAt: -1 }).lean();
};

// Add recommendation to user
UserSchema.statics.addRecommendation = async function (
  userId: string,
  companyName: string,
  jobId?: string
) {
  return await this.findOneAndUpdate(
    { userId },
    {
      $push: {
        recommendations: {
          companyName,
          jobId,
          recommendedAt: new Date(),
        },
      },
    },
    { new: true }
  );
};

// Schedule interview for user
UserSchema.statics.scheduleInterview = async function (
  userId: string,
  companyName: string,
  scheduledAt: Date,
  jobId?: string,
  notes?: string
) {
  return await this.findOneAndUpdate(
    { userId },
    {
      $push: {
        interviews: {
          companyName,
          jobId,
          scheduledAt,
          status: "SCHEDULED",
          notes,
          createdAt: new Date(),
        },
      },
    },
    { new: true }
  );
};

// Update interview status
UserSchema.statics.updateInterviewStatus = async function (
  userId: string,
  interviewId: string,
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED"
) {
  return await this.findOneAndUpdate(
    { userId, "interviews._id": interviewId },
    {
      $set: {
        "interviews.$.status": status,
      },
    },
    { new: true }
  );
};

export interface IUserModel extends Model<IUserDocument> {
  findByUserId(userId: string): Promise<IUserDocument | null>;
  createOrUpdateUser(userData: Partial<IUser>): Promise<IUserDocument>;
  getAllUsers(): Promise<IUserDocument[]>;
  addRecommendation(userId: string, companyName: string, jobId?: string): Promise<IUserDocument | null>;
  scheduleInterview(userId: string, companyName: string, scheduledAt: Date, jobId?: string, notes?: string): Promise<IUserDocument | null>;
  updateInterviewStatus(userId: string, interviewId: string, status: "SCHEDULED" | "COMPLETED" | "CANCELLED"): Promise<IUserDocument | null>;
}

export const User: IUserModel =
  (models.User as IUserModel) || (mongoose.model<IUserDocument>("User", UserSchema) as IUserModel);
