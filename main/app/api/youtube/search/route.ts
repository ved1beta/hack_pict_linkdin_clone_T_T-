import { NextResponse } from "next/server";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "programming tutorial";

  try {
    // If no key, or you're in hackathon mode, just return a demo video
    if (!YOUTUBE_API_KEY) {
      return NextResponse.json({
        ok: true,
        videos: [
          {
            id: "ZxKM3DCV2kE", // Fireship - Web Dev in 100s (safe demo)
            title: `${query} - Demo Tutorial`,
            thumbnail: "https://img.youtube.com/vi/ZxKM3DCV2kE/hqdefault.jpg",
            channelTitle: "Demo Channel",
          },
        ],
      });
    }

    const url =
      "https://www.googleapis.com/youtube/v3/search?" +
      new URLSearchParams({
        part: "snippet",
        q: `${query} tutorial`,
        type: "video",
        maxResults: "1",
        order: "relevance",
        videoDuration: "medium",
        key: YOUTUBE_API_KEY,
      });

    const response = await fetch(url);

    if (!response.ok) {
      console.error("YouTube API error status:", response.status);
      // Still return demo video instead of throwing
      return NextResponse.json({
        ok: false,
        error: "YouTube API error",
        videos: [
          {
            id: "ZxKM3DCV2kE",
            title: `${query} - Demo Tutorial`,
            thumbnail: "https://img.youtube.com/vi/ZxKM3DCV2kE/hqdefault.jpg",
            channelTitle: "Demo Channel",
          },
        ],
      });
    }

    const data = await response.json();

    const videos =
      data.items?.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
      })) ?? [];

    if (!videos.length) {
      // Again, fallback demo video
      return NextResponse.json({
        ok: false,
        error: "No videos found",
        videos: [
          {
            id: "ZxKM3DCV2kE",
            title: `${query} - Demo Tutorial`,
            thumbnail: "https://img.youtube.com/vi/ZxKM3DCV2kE/hqdefault.jpg",
            channelTitle: "Demo Channel",
          },
        ],
      });
    }

    return NextResponse.json({ ok: true, videos });
  } catch (err) {
    console.error("YouTube search exception:", err);
    // Never crash: always return at least one video
    return NextResponse.json({
      ok: false,
      error: "Exception while fetching videos",
      videos: [
        {
          id: "ZxKM3DCV2kE",
          title: `${query} - Demo Tutorial`,
          thumbnail: "https://img.youtube.com/vi/ZxKM3DCV2kE/hqdefault.jpg",
          channelTitle: "Demo Channel",
        },
      ],
    });
  }
}
