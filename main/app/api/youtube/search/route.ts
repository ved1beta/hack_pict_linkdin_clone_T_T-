import { NextResponse } from "next/server";
import { searchYouTube } from "@/lib/youtube";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "programming tutorial";

  const videos = await searchYouTube(query, 1);

  return NextResponse.json({ ok: true, videos });
}
