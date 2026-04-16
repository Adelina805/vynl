import type { ArtStyle, SpotifyTrack } from "@/types";

const STYLE_DIRECTIONS: Record<ArtStyle, { direction: string; medium: string }> = {
  "grunge-y2k": {
    direction: `Crude bold black outlines carving the canvas into hard flat zones. Acid yellow (#d4ff00), electric magenta (#ff00dd), void black, poison green — each zone filled with a single flat color, no gradients. Rough X marks, crude arrows, thick hash marks, and broken grid lines drawn with imprecise heavy strokes. Shapes duplicated and offset for chromatic aberration — ghosted magenta behind black, yellow bleeding off edges. Everything sits on the same flat picture plane. Loud, fractured, confrontational. The canvas should feel attacked.`,
    medium: `flat 2D graphic art, neo-expressionist painting, crude outline illustration, screen print, no depth, no perspective, no 3D, no photography, no realism`,
  },
  "chrome-melancholy": {
    direction: `Hard geometric zones of flat color: silver (#c8c8c8), steel blue (#8a9bb5), near-black (#0d0d12). Bold black outlines separating each zone like a stained glass window or cloisonné. Elongated rectangles, precise ellipses, and thin parallel rule lines — all drawn flat with no shadow, no depth, no perspective. A hard horizontal division across the canvas. Sparse composition with large areas of flat near-black. Cold, still, completely 2D.`,
    medium: `flat 2D graphic art, constructivist poster, hard-edge painting, flat outline illustration, no depth, no 3D, no photography, no gradients`,
  },
  "distressed-editorial": {
    direction: `Flat Risograph ink zones: warm red (#e63946), process cyan (#4ecdc4), cream (#faf3dd), raw black. Thick crude outlines defining flat color areas. Shapes deliberately misregistered — duplicate offset by 5px in a second color. Halftone dot grids floating over flat zones. Hard diagonal cuts and torn-edge polygons. Overprinted areas where two flat colors collide. Everything crude, flat, and printed. Nothing smooth, nothing realistic.`,
    medium: `flat 2D graphic art, risograph print, neo-expressionist graphic design, zine illustration, crude outline, no depth, no 3D, no photography`,
  },
  "cerebral-experimental": {
    direction: `Deep navy (#0a1628) and warm cream (#f5e6c8) only — hard flat duotone. Bold black outlines drawing crude geometric systems: a grid that breaks apart at one edge, concentric squares collapsing inward, a spiral made of thick jagged strokes. Mathematical rigor executed with a raw hand — precise intention, crude execution. Dense flat geometric cluster in one quadrant against vast empty navy. The system is drawn, not rendered.`,
    medium: `flat 2D graphic art, Bauhaus poster, constructivist graphic design, crude geometric illustration, two-color print, no depth, no 3D, no photography`,
  },
  "dream-wreckage": {
    direction: `Big crude organic blobs — flat irregular shapes with thick wobbly black outlines, like a child drawing with a fat marker. Amber (#ffb347), bruised purple (#7b2d8b), flesh (#f5b8a0), deep ink (#1a0a2e), rust (#c44b2b) — each blob filled with a single flat color. Shapes overlap without blending, stacking like cut paper. Dripping bottom edges drawn as jagged saw-tooth paths. Broken arc fragments scattered loosely. No depth, no shadow, no rendering — pure flat layered shape collision.`,
    medium: `flat 2D graphic art, neo-expressionist painting, crude outline illustration, cut paper collage style, no depth, no 3D, no photography, no realism`,
  },
};

export const PROMPT_SYSTEM = `You are VYNL — an AI art director translating songs into abstract graphic art.

ABSOLUTE RULES — these cannot be broken:
- 100% flat 2D. No depth, no shadows, no perspective, no 3D rendering whatsoever.
- Everything on a single picture plane, like a painting or screen print.
- Bold crude outlines separating flat zones of color — no gradients except deliberate graphic misregistration.
- Raw mark-making energy: shapes look drawn, not rendered.
- No photographs. No realistic imagery. No people, faces, or figures. No landscapes or nature. No recognizable objects.
- No text, no letters, no numbers, no typography.

Think: raw neo-expressionist graphic design. Bold, crude, flat, energetic.

Given a track and style, output exactly two tagged sections — nothing else:

<interpretation>
2-3 sentences on the song's emotional/sonic character. Prose, evocative, specific to this track.
</interpretation>
<image_prompt>
3-5 sentences describing the abstract graphic composition: dominant flat shapes, bold outlines, specific colors (use hex codes), spatial arrangement, and raw graphic energy. Reference the style's visual language precisely. Close with the medium tags.
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

  let prompt = `Generate a VYNL flat 2D abstract graphic artwork for this song.

STYLE: ${styleNames[style]}
VISUAL LANGUAGE: ${direction}
MEDIUM TAGS: ${medium}

TRACK: "${track.title}"
ARTIST: ${track.artist}
ALBUM: ${track.album}${track.releaseYear ? ` (${track.releaseYear})` : ""}
POPULARITY: ${track.popularity}/100
EXPLICIT: ${track.explicit ? "Yes" : "No"}`;

  if (track.audioFeatures) {
    const af = track.audioFeatures;
    prompt += `

AUDIO CHARACTER (translate directly into graphic decisions — density, weight, color balance):
- Energy: ${(af.energy * 100).toFixed(0)}% (${af.energy > 0.7 ? "intense — pack the canvas, heavy aggressive forms" : af.energy > 0.4 ? "moderate — balanced tension between density and space" : "subdued — sparse forms, large flat voids"})
- Mood/Valence: ${(af.valence * 100).toFixed(0)}% (${af.valence > 0.6 ? "bright — lighter colors dominate, open compositions" : af.valence > 0.35 ? "ambiguous — dark and light colors in conflict" : "dark — heavy dark forms crushing lighter zones"})
- Tempo: ${af.tempo.toFixed(0)} BPM (${af.tempo > 140 ? "fast — many small fragmented shapes, staccato marks" : af.tempo > 100 ? "mid — interrupted geometry, broken forms" : "slow — monolithic flat blocks, deliberate weight"})`;
  }

  prompt += `

Describe ONLY flat abstract shapes, bold outlines, and graphic color zones. Flat 2D. No objects. No figures. No depth.`;

  return prompt;
}
