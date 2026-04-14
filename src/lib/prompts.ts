import type { ArtStyle, SpotifyTrack } from "@/types";

const STYLE_DIRECTIONS: Record<ArtStyle, string> = {
  "grunge-y2k": `Y2K millennium anxiety meets grunge physicality. Digital glitch art. Fractured reality. Acid yellow (#d4ff00), electric magenta (#ff00dd), void black, poison green. Digital artifacts, pixel corruption, hexagonal shards, aggressive geometry, chromatic aberration, noise and distortion. Hard, loud, fractured. Medium: digital glitch art, screen print.`,
  "chrome-melancholy": `Post-industrial desolation. Cold metallic minimalism. Reflective surfaces. Silver, steel blue (#8a9bb5), near-black. Elongated geometric forms, perspective-receding grids, atmospheric haze, large negative space. Cold, silent, sterile beauty. Medium: industrial photography, architectural rendering.`,
  "distressed-editorial": `Risograph printing gone wrong. Flat ink colors: warm red (#e63946), process cyan (#4ecdc4), cream (#faf3dd), black. Deliberate misregistration, paper grain texture, halftone dot patterns, hard-edge geometric forms. Analog failure as beauty. Medium: risograph print, photocopied collage.`,
  "cerebral-experimental": `Bauhaus geometric systems breaking down. Deep navy (#0a1628) and warm cream (#f5e6c8) duotone only — no other colors. Strict geometric forms dissolving into noise, optical interference patterns, mathematical precision collapsing into entropy. Dense clusters against pure negative space. Medium: technical illustration, Bauhaus design.`,
  "dream-wreckage": `Surrealist aftermath. Melting organic forms. Amber (#ffb347), bruised purple (#7b2d8b), flesh tones, deep ink, rust. Dripping and melting shapes, translucent layered blobs, fragmented circles. Beautiful wreckage and dreaming. Medium: surrealist painting, mixed media.`,
};

export const PROMPT_SYSTEM = `You are VYNL — an AI art director that translates songs into visual art concepts.

Given a track and style, output exactly two tagged sections — nothing else, no other text:

<interpretation>
2-3 sentences describing the song's sonic/emotional character, as if writing liner notes for the artwork. Prose, evocative, specific to this song.
</interpretation>
<image_prompt>
A detailed image generation prompt, 3-5 sentences. Describe the composition, dominant colors, textures, shapes, and mood. Make it specific to this song's emotional character AND the style's aesthetic DNA. End with: "abstract art, no text, no typography, no letters, no words, [style-appropriate medium]."
</image_prompt>`;

export function buildUserPrompt(track: SpotifyTrack, style: ArtStyle): string {
  const styleNames: Record<ArtStyle, string> = {
    "grunge-y2k": "GRUNGE Y2K",
    "chrome-melancholy": "CHROME MELANCHOLY",
    "distressed-editorial": "DISTRESSED EDITORIAL",
    "cerebral-experimental": "CEREBRAL / EXPERIMENTAL",
    "dream-wreckage": "DREAM WRECKAGE",
  };

  let prompt = `Generate a VYNL artwork concept for this song in the ${styleNames[style]} style.

STYLE DIRECTION: ${STYLE_DIRECTIONS[style]}

TRACK: "${track.title}"
ARTIST: ${track.artist}
ALBUM: ${track.album}${track.releaseYear ? ` (${track.releaseYear})` : ""}
POPULARITY: ${track.popularity}/100
EXPLICIT: ${track.explicit ? "Yes" : "No"}`;

  if (track.audioFeatures) {
    const af = track.audioFeatures;
    prompt += `

AUDIO CHARACTER:
- Energy: ${(af.energy * 100).toFixed(0)}% (${af.energy > 0.7 ? "intense" : af.energy > 0.4 ? "moderate" : "subdued"})
- Mood/Valence: ${(af.valence * 100).toFixed(0)}% (${af.valence > 0.6 ? "positive/bright" : af.valence > 0.35 ? "ambiguous/mixed" : "dark/melancholic"})
- Tempo: ${af.tempo.toFixed(0)} BPM (${af.tempo > 140 ? "fast" : af.tempo > 100 ? "mid-tempo" : "slow"})
- Danceability: ${(af.danceability * 100).toFixed(0)}%
- Acousticness: ${(af.acousticness * 100).toFixed(0)}%
- Instrumentalness: ${(af.instrumentalness * 100).toFixed(0)}%`;
  }

  prompt += `

Let the song's specific character — its sonic texture, emotional gravity, the feeling it leaves — drive every visual decision.`;

  return prompt;
}
