import { NextRequest, NextResponse } from "next/server";
import { fetchTrack } from "@/lib/spotify";
import { extractSpotifyTrackId } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body as { url: string };

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'url' field." },
        { status: 400 }
      );
    }

    const trackId = extractSpotifyTrackId(url);
    if (!trackId) {
      return NextResponse.json(
        {
          error:
            "Could not parse a Spotify track ID. Paste a full track URL like https://open.spotify.com/track/...",
        },
        { status: 400 }
      );
    }

    const track = await fetchTrack(trackId);
    return NextResponse.json({ track });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
