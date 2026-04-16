import type { ArtStyle, SpotifyTrack } from "@/types";

// Per-style direction: visual language, palette, and medium keywords for FLUX
const STYLE_DIRECTIONS: Record<ArtStyle, { direction: string; medium: string }> = {
  "grunge-y2k": {
    direction: `Fragmented geometry exploding across the canvas. Hard acid yellow (#d4ff00), electric magenta (#ff00dd), void black, poison green. Overlapping hexagons, diamond grids, polygon shards at aggressive angles. Chromatic aberration splitting shapes into offset RGB ghosts. Pixel-corruption noise. Multiple copies of key shapes displaced slightly — distressed, glitching, duplicated. Everything loud and fractured. Pure graphic chaos.`,
    medium: `digital glitch art, Y2K graphic design, screen print, flat graphic, vector shapes, no gradients except deliberate chromatic splits`,
  },
  "chrome-melancholy": {
    direction: `Elongated rectangles, hairline rules, and perfect ellipses in silver, steel blue (#8a9bb5), and near-black. A hard horizon line with mirrored geometry below it at reduced opacity. Large empty voids of pure near-black punctuated by precise cold shapes. Thin parallel lines receding into distance. No organic forms whatsoever. Industrial silence made visible.`,
    medium: `Swiss graphic design, constructivist poster, architectural drawing, technical illustration, flat graphic, minimal vector art`,
  },
  "distressed-editorial": {
    direction: `Flat Risograph ink colors only: warm red (#e63946), process cyan (#4ecdc4), cream (#faf3dd), black. Shapes duplicated and offset 4–6px for misregistration effect. Halftone dot grids at varying densities. Hard-edge rectangles and diagonal cuts. Paper grain texture overlaid everywhere. Overprinted shapes at 80% opacity creating unexpected third colors. Pure editorial graphic collision.`,
    medium: `risograph print, photocopied zine, editorial graphic design, flat color, halftone, screen print, no photography`,
  },
  "cerebral-experimental": {
    direction: `Deep navy (#0a1628) and warm cream (#f5e6c8) only — strict duotone, zero other colors. Isometric grids or Fibonacci spirals drawn with mathematical rigor, then corrupted: lines snap, grids dissolve into noise at one edge. Optical interference from precisely spaced thin parallel lines creating moiré. Dense geometric clusters floating in pure negative space. System logic at the moment it fails.`,
    medium: `Bauhaus poster, De Stijl, constructivist graphic design, geometric abstraction, flat two-color print, technical diagram`,
  },
  "dream-wreckage": {
    direction: `Enormous amoeba blobs with exaggerated bezier curves bleeding off the canvas edges. Amber (#ffb347), bruised purple (#7b2d8b), flesh (#f5b8a0), deep ink (#1a0a2e), rust (#c44b2b). Shapes layered at 50–70% opacity creating unexpected color collisions. Dripping bottom edges on geometric forms. Broken arcs and orbital fragments. Scale contradiction: massive soft forms next to tiny sharp slivers. Pure surrealist graphic melt.`,
    medium: `surrealist graphic design, abstract expressionism, mixed media collage, flat overlapping shapes, no photography, no realism`,
  },
};

export const PROMPT_SYSTEM = `You are VYNL — an AI art director translating songs into abstract graphic design concepts.

CRITICAL RULE: The final image must be 100% abstract graphic design. No photographs. No realistic imagery. No people, faces, bodies, or figures. No landscapes, skies, or nature. No objects or recognizable things. Pure shape, color, line, and texture only.

Given a track and style, output exactly two tagged sections — nothing else:

<interpretation>
2-3 sentences on the song's emotional/sonic character. Prose, evocative, specific to this track.
</interpretation>
<image_prompt>
3-5 sentences describing the abstract graphic composition: dominant shapes, specific colors (use hex codes), spatial arrangement, texture, and mood. Reference the style's specific visual language. Then close with the medium tags. Be specific and compositional, not metaphorical.
</image_prompt>`;

export function buildUserPrompt(track: SpotifyTrack, style: ArtStyle): string {
  const styleNames: Record<ArtStyle, string> = {
    "grunge-y2k": "GRUNGE Y2K",
    "chrome-melancholy": "CHROME MELANCHOLY",
    "distressed-editorial": "DISTRESSED EDITORIAL",
    "cerebral-experimental": "CEREBRAL / EXPERIMENTAL",
    "dream-wreckage": "DREAM WRECKAGE",
  };

  const { direction, medium } = STYLE_DIRECTIONS[style];

  let prompt = `Generate a VYNL abstract graphic artwork concept for this song.

STYLE: ${styleNames[style]}
VISUAL LANGUAGE: ${direction}
MEDIUM TAGS TO END WITH: ${medium}

TRACK: "${track.title}"
ARTIST: ${track.artist}
ALBUM: ${track.album}${track.releaseYear ? ` (${track.releaseYear})` : ""}
POPULARITY: ${track.popularity}/100
EXPLICIT: ${track.explicit ? "Yes" : "No"}`;

  if (track.audioFeatures) {
    const af = track.audioFeatures;
    prompt += `

AUDIO CHARACTER (let this drive compositional energy and color weight):
- Energy: ${(af.energy * 100).toFixed(0)}% (${af.energy > 0.7 ? "intense — dense forms, aggressive angles" : af.energy > 0.4 ? "moderate — balanced tension" : "subdued — sparse, open negative space"})
- Mood/Valence: ${(af.valence * 100).toFixed(0)}% (${af.valence > 0.6 ? "bright — lighter colors dominant" : af.valence > 0.35 ? "ambiguous — color tension" : "dark — heavy forms, shadow tones dominant"})
- Tempo: ${af.tempo.toFixed(0)} BPM (${af.tempo > 140 ? "fast — fragmented, staccato shapes" : af.tempo > 100 ? "mid — flowing interrupted geometry" : "slow — monolithic, deliberate forms"})
- Danceability: ${(af.danceability * 100).toFixed(0)}%
- Acousticness: ${(af.acousticness * 100).toFixed(0)}%
- Instrumentalness: ${(af.instrumentalness * 100).toFixed(0)}%`;
  }

  prompt += `

The image prompt must describe ONLY abstract shapes, colors, and graphic elements. No objects. No figures. No realism.`;

  return prompt;
}
