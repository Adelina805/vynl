import type { SpotifyTrack, AudioFeatures } from "@/types";

interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET environment variables."
    );
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error(`Spotify token error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return tokenCache.token;
}

export async function fetchTrack(trackId: string): Promise<SpotifyTrack> {
  const token = await getAccessToken();

  const [trackRes, featuresRes] = await Promise.allSettled([
    fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  ]);

  if (trackRes.status === "rejected" || !trackRes.value.ok) {
    const status =
      trackRes.status === "fulfilled" ? trackRes.value.status : "network error";
    throw new Error(`Could not fetch track (${status}). Check the Spotify URL.`);
  }

  const track = await trackRes.value.json();

  let audioFeatures: AudioFeatures | null = null;
  if (
    featuresRes.status === "fulfilled" &&
    featuresRes.value.ok
  ) {
    const af = await featuresRes.value.json();
    if (af && typeof af.energy === "number") {
      audioFeatures = {
        energy: af.energy,
        valence: af.valence,
        tempo: af.tempo,
        danceability: af.danceability,
        acousticness: af.acousticness,
        instrumentalness: af.instrumentalness,
      };
    }
  }

  const albumImages: { url: string; width: number; height: number }[] =
    track.album?.images ?? [];
  const albumArt =
    albumImages.find((img) => img.width >= 300)?.url ??
    albumImages[0]?.url ??
    null;

  return {
    id: track.id,
    title: track.name,
    artist: track.artists?.map((a: { name: string }) => a.name).join(", ") ?? "Unknown Artist",
    album: track.album?.name ?? "Unknown Album",
    releaseYear: (track.album?.release_date ?? "").slice(0, 4),
    popularity: track.popularity ?? 0,
    explicit: track.explicit ?? false,
    albumArt,
    spotifyUrl: track.external_urls?.spotify ?? `https://open.spotify.com/track/${trackId}`,
    audioFeatures,
  };
}
