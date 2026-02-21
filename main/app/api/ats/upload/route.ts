/**
 * Resume Upload API
 * Accepts PDF, DOC, DOCX. Stores in Cloudinary, extracts text, parses with AI, saves to MongoDB.
 */

import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { ResumeUpload } from "@/mongodb/models/resumeUpload";
import { ParsedResume } from "@/mongodb/models/parsedResume";
import {
  extractResumeText,
  isAllowedMimeType,
} from "@/lib/ats/resume-extractor";
import { structureResumeWithAI } from "@/lib/ats/resume-structurer";
import {
  generateHashedFilename,
  uploadResumeToCloudinary,
} from "@/lib/ats/upload-resume";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  try {
    console.log("📄 [ResumeUpload] Starting upload process...");
    const user = await currentUser();
    if (!user) {
      console.log("📄 [ResumeUpload] Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("resume") as File | null;

    if (!file) {
      console.log("📄 [ResumeUpload] No file provided");
      return NextResponse.json(
        { error: "No resume file provided" },
        { status: 400 }
      );
    }
    console.log(`📄 [ResumeUpload] File received: ${file.name}, Size: ${file.size}`);

    const mimeType = file.type;
    if (!isAllowedMimeType(mimeType)) {
      console.log(`📄 [ResumeUpload] Invalid MIME: ${mimeType}`);
      return NextResponse.json(
        { error: "Invalid file type. Only PDF and DOCX are allowed." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Max 5MB." },
        { status: 400 }
      );
    }

    console.log("📄 [ResumeUpload] Uploading to Cloudinary...");
    const hashedName = generateHashedFilename(file.name, user.id);
    const fileUrl = await uploadResumeToCloudinary(
      buffer,
      hashedName,
      mimeType
    );
    console.log("📄 [ResumeUpload] Cloudinary upload successful:", fileUrl);

    console.log("📄 [ResumeUpload] Extracting text...");
    const extractedText = await extractResumeText(buffer, mimeType);
    console.log(`📄 [ResumeUpload] Text extracted (${extractedText.length} chars)`);

    console.log("📄 [ResumeUpload] Parsing with AI...");
    const structured = await structureResumeWithAI(extractedText);
    console.log("📄 [ResumeUpload] AI parsing successful");

    await connectDB();
    console.log("📄 [ResumeUpload] Saving to DB...");
    
    const resumeUpload = await ResumeUpload.create({
      userId: user.id,
      fileName: file.name,
      hashedName,
      fileUrl,
      mimeType,
      fileSize: buffer.length,
      extractedText,
    });

    await ParsedResume.create({
      resumeUploadId: resumeUpload._id,
      name: structured.name,
      email: structured.email,
      phone: structured.phone,
      skills: structured.skills,
      workExperience: structured.work_experience,
      education: structured.education,
      totalYearsExperience: structured.total_years_experience,
      rawStructured: structured,
    });
    console.log("📄 [ResumeUpload] Saved to DB. Done.");

    return NextResponse.json({
      success: true,
      resumeId: resumeUpload._id.toString(),
      fileUrl,
      extracted: true,
      structured: {
        name: structured.name,
        email: structured.email,
        skills: structured.skills,
        totalYearsExperience: structured.total_years_experience,
      },
    });
  } catch (err) {
    console.error("Resume upload error:", err);
    const msg = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
