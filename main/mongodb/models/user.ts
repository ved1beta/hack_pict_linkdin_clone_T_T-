import mongoose, { Schema, Document, models, Model } from "mongoose";

export type UserType = "student" | "recruiter";

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

export const User: Model<IUserDocument> =
  models.User || mongoose.model<IUserDocument>("User", UserSchema);