/**
 * Secure resume upload - Cloudinary with hashed filename
 */

import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function generateHashedFilename(originalName: string, userId: string): string {
  const ext = originalName.split(".").pop() || "bin";
  const hash = crypto
    .createHash("sha256")
    .update(`${userId}-${originalName}-${Date.now()}`)
    .digest("hex")
    .slice(0, 16);
  return `resume_${hash}.${ext}`;
}

export async function uploadResumeToCloudinary(
  buffer: Buffer,
  hashedName: string,
  mimeType: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "resumes",
        public_id: hashedName.replace(/\.[^.]+$/, ""),
        resource_type: "raw",
      },
      (error, result) => {
        if (error) reject(error);
        else if (result?.secure_url) resolve(result.secure_url);
        else reject(new Error("Upload failed"));
      }
    );
    uploadStream.end(buffer);
  });
}
