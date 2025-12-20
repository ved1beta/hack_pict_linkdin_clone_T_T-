import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const candidate = await User.findByUserId(params.id);

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ candidate });
  } catch (error) {
    console.error("Get candidate error:", error);
    return NextResponse.json(
      { error: "Failed to fetch candidate" },
      { status: 500 }
    );
  }
}
