/**
 * Extract a Spotify track ID from various input formats:
 * - https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh
 * - https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh?si=xxx
 * - spotify:track:4iV5W9uYEdYUVa79Axb7Rh
 * - 4iV5W9uYEdYUVa79Axb7Rh (bare ID)
 */
export function extractSpotifyTrackId(input: string): string | null {
  const trimmed = input.trim();

  // spotify:track:{id}
  const uriMatch = trimmed.match(/^spotify:track:([A-Za-z0-9]+)/);
  if (uriMatch) return uriMatch[1];

  // https://open.spotify.com/track/{id}
  const urlMatch = trimmed.match(/open\.spotify\.com\/track\/([A-Za-z0-9]+)/);
  if (urlMatch) return urlMatch[1];

  // Bare ID: 22-character alphanumeric
  if (/^[A-Za-z0-9]{22}$/.test(trimmed)) return trimmed;

  return null;
}

/**
 * Parse an SVG string and an interpretation from Claude's tagged output.
 */
export function parseGenerationOutput(raw: string): {
  svg: string | null;
  interpretation: string | null;
} {
  const artworkMatch = raw.match(/<artwork>([\s\S]*?)<\/artwork>/);
  const interpretationMatch = raw.match(
    /<interpretation>([\s\S]*?)<\/interpretation>/
  );

  const svgCandidate = artworkMatch ? artworkMatch[1].trim() : null;
  const svg =
    svgCandidate && svgCandidate.startsWith("<svg") ? svgCandidate : null;

  const interpretation = interpretationMatch
    ? interpretationMatch[1].trim()
    : null;

  return { svg, interpretation };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
