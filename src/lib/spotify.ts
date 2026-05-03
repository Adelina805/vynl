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

const MAX_ARTIST_GENRES = 5;

/** Fetch primary artist Spotify genres for liner-note-style context. */
async function fetchPrimaryArtistGenres(
  token: string,
  primaryArtistId: string | undefined
): Promise<string[]> {
  if (!primaryArtistId?.trim()) return [];

  try {
    const res = await fetch(
      `https://api.spotify.com/v1/artists/${encodeURIComponent(primaryArtistId)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return [];
    const artist = await res.json();
    const genres: unknown = artist.genres;
    if (!Array.isArray(genres)) return [];
    return genres
      .filter((g): g is string => typeof g === "string" && g.trim().length > 0)
      .slice(0, MAX_ARTIST_GENRES);
  } catch {
    return [];
  }
}

function normalizeAudioFeatures(af: Record<string, unknown>): AudioFeatures {
  const out: AudioFeatures = {
    energy: Number(af.energy),
    valence: Number(af.valence),
    tempo: Number(af.tempo),
    danceability: Number(af.danceability),
    acousticness: Number(af.acousticness),
    instrumentalness: Number(af.instrumentalness),
  };

  if (typeof af.speechiness === "number") {
    out.speechiness = af.speechiness;
  }
  if (typeof af.liveness === "number") {
    out.liveness = af.liveness;
  }

  const keyRaw = typeof af.key === "number" ? af.key : null;
  if (keyRaw !== null && keyRaw >= 0 && keyRaw <= 11) {
    out.key = keyRaw;
  }

  if (typeof af.mode === "number" && (af.mode === 0 || af.mode === 1)) {
    out.mode = af.mode;
  }

  const ts = typeof af.time_signature === "number" ? af.time_signature : null;
  if (ts !== null && ts >= 3 && ts <= 7) {
    out.timeSignature = ts;
  }

  if (typeof af.loudness === "number") {
    out.loudness = af.loudness;
  }

  return out;
}

export async function fetchTrack(trackId: string): Promise<SpotifyTrack> {
  const token = await getAccessToken();

  const trackRes = await fetch(
    `https://api.spotify.com/v1/tracks/${encodeURIComponent(trackId)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!trackRes.ok) {
    throw new Error(
      `Could not fetch track (${trackRes.status}). Check the Spotify URL.`
    );
  }

  const track = await trackRes.json();

  const primaryArtistId =
    typeof track.artists?.[0]?.id === "string"
      ? (track.artists[0].id as string)
      : undefined;

  const [featuresRes, genres] = await Promise.all([
    fetch(
      `https://api.spotify.com/v1/audio-features/${encodeURIComponent(trackId)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    ),
    fetchPrimaryArtistGenres(token, primaryArtistId),
  ]);

  let audioFeatures: AudioFeatures | null = null;
  if (featuresRes.ok) {
    const af = await featuresRes.json();
    if (
      af &&
      typeof af === "object" &&
      typeof (af as { energy?: unknown }).energy === "number"
    ) {
      audioFeatures = normalizeAudioFeatures(af as Record<string, unknown>);
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
    artist:
      track.artists?.map((a: { name: string }) => a.name).join(", ") ??
      "Unknown Artist",
    album: track.album?.name ?? "Unknown Album",
    releaseYear: (track.album?.release_date ?? "").slice(0, 4),
    popularity: track.popularity ?? 0,
    explicit: track.explicit ?? false,
    albumArt,
    spotifyUrl:
      track.external_urls?.spotify ??
      `https://open.spotify.com/track/${encodeURIComponent(trackId)}`,
    artistGenres: genres,
    audioFeatures,
  };
}
