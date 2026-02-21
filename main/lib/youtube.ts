const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

export async function searchYouTube(query: string, maxResults: number = 1): Promise<YouTubeVideo[]> {
  try {
    // If no key, return fallback immediately
    if (!YOUTUBE_API_KEY) {
      return getFallbackVideos(query, maxResults);
    }

    const url =
      "https://www.googleapis.com/youtube/v3/search?" +
      new URLSearchParams({
        part: "snippet",
        q: `${query} tutorial`,
        type: "video",
        maxResults: maxResults.toString(),
        order: "relevance",
        videoDuration: "medium", // filter for medium length tutorials
        key: YOUTUBE_API_KEY,
      });

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`YouTube API error: ${response.status}`);
      return getFallbackVideos(query, maxResults);
    }

    const data = await response.json();

    const videos = data.items?.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
    })) ?? [];

    if (videos.length === 0) {
      return getFallbackVideos(query, maxResults);
    }

    return videos;
  } catch (error) {
    console.error("YouTube search exception:", error);
    return getFallbackVideos(query, maxResults);
  }
}

function getFallbackVideos(query: string, count: number): YouTubeVideo[] {
  // Return different demo videos based on query roughly, or just varied placeholders
  const demos = [
    {
      id: "ZxKM3DCV2kE",
      title: `${query} - Crash Course (Demo)`,
      thumbnail: "https://img.youtube.com/vi/ZxKM3DCV2kE/hqdefault.jpg",
      channelTitle: "Fireship",
    },
    {
      id: "pQN-pnXPaVg",
      title: `Learn ${query} - Full Course (Demo)`,
      thumbnail: "https://img.youtube.com/vi/pQN-pnXPaVg/hqdefault.jpg",
      channelTitle: "FreeCodeCamp",
    },
    {
      id: "pkdgVb3HbPs",
      title: `${query} in 100 Seconds (Demo)`,
      thumbnail: "https://img.youtube.com/vi/pkdgVb3HbPs/hqdefault.jpg",
      channelTitle: "Fireship",
    }
  ];
  
  return demos.slice(0, count);
}

