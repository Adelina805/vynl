import type { ArtStyle, SpotifyTrack } from "@/types";

// Visual grammar for each style — specific enough that FLUX produces distinct results
const STYLE_GRAMMAR: Record<ArtStyle, { grammar: string; medium: string }> = {
  "grunge-y2k": {
    grammar: `PALETTE: acid yellow (#d4ff00), electric magenta (#ff00dd), cyber cyan (#00ffcc), void black.
FORMS: Hard fractured geometry — hexagonal shards, broken grid planes, diamond fragments at aggressive angles. Shapes duplicated and offset 3–5px in a second color creating chromatic aberration. Thick crude black outlines separating flat color zones.
TEXTURE: Pixel-corruption blocks scattered at edges. High-frequency noise over background zones.
COMPOSITION: Confrontational, dense, canvas-filling. Nothing centered. Diagonal aggression.
FEEL: Digital rot. The screen breaking. Chaos with a grid underneath it.`,
    medium: `flat 2D digital glitch art, Y2K graphic design, screen print aesthetic, no depth, no photography, no 3D`,
  },
  "chrome-melancholy": {
    grammar: `PALETTE: pearl (#dde4ea), ice steel (#6a8fa8), dark slate (#1c2535), near-black (#06080e).
FORMS: Elongated rectangles and precise ellipses with hard edges. A single dominant horizontal band dividing the canvas. Thin parallel hairline rules receding into negative space. Shapes mirrored below a horizon at reduced opacity.
TEXTURE: Large zones of flat near-black. Small clusters of precision geometry against emptiness.
COMPOSITION: Minimal. More void than form. Everything deliberate.
FEEL: The airport at 4am. Still surfaces. Cold holding something.`,
    medium: `flat 2D hard-edge painting, constructivist graphic design, technical illustration, no depth, no photography, no 3D`,
  },
  "distressed-editorial": {
    grammar: `PALETTE: signal red (#e63946), risograph teal (#0ea59e), raw cream (#f5f0e2), newsprint black (#1a1510).
FORMS: Flat color rectangles and diagonal cuts with crude bold outlines. Shapes offset 4–6px in a second color for misregistration. Halftone dot grids at varying densities floating over flat zones. Hard torn-edge polygons.
TEXTURE: Paper grain implied through overlapping translucent shapes. Overprint zones where two flat colors collide at 80% opacity.
COMPOSITION: Off-balance. Cut like a zine page. Deliberate wrongness.
FEEL: The copy machine ran out of registration. Analog failure as aesthetic choice.`,
    medium: `flat 2D risograph print, zine graphic design, screen print, no depth, no photography, no 3D`,
  },
  "cerebral-experimental": {
    grammar: `PALETTE: midnight navy (#060e1e) and aged cream (#f0e6cc) ONLY — strict duotone. Occasional rust accent (#8b3a2a) for a single corrupted element.
FORMS: A geometric system drawn with mathematical precision — isometric grid, Fibonacci spiral, or radial structure — that begins to fail. Lines that should connect don't. Grids that dissolve at one edge into loose marks. The system visible and breaking simultaneously.
TEXTURE: Dense geometric cluster in one quadrant. Vast empty duotone field in another.
COMPOSITION: Asymmetric tension. The organized and the entropic.
FEEL: A diagram of something that stopped working. Rigor and collapse in the same frame.`,
    medium: `flat 2D Bauhaus poster, De Stijl, constructivist graphic design, duotone print, no depth, no photography, no 3D`,
  },
  "dream-wreckage": {
    grammar: `PALETTE: burnt amber (#ff8c42), bruised violet (#6b2468), raw flesh (#f0b896), deep ink (#0e0818), dried rust (#992222).
FORMS: Large irregular organic blobs with thick wobbly crude outlines — flat filled shapes, not rendered. Forms bleeding off canvas edges. Shapes stacked like cut paper, no blending, just overlap. Dripping bottom edges as jagged saw-tooth paths. Broken arc fragments floating loose.
TEXTURE: Layers of flat translucent shapes where colors collide unexpectedly.
COMPOSITION: Scale contradictions — enormous soft form next to tiny sharp fragment. Off-center, unsettled.
FEEL: The morning after a surrealist dream. Beautiful debris.`,
    medium: `flat 2D neo-expressionist painting, cut paper collage, crude outline illustration, no depth, no photography, no 3D`,
  },
};

export function getStyleGuidance(style: ArtStyle): {
  grammar: string;
  medium: string;
} {
  return STYLE_GRAMMAR[style];
}

export const PROMPT_SYSTEM = `You are VYNL — an art director who translates the emotional and sonic identity of a specific song into a flat 2D abstract graphic artwork.

YOU KNOW MUSIC. Draw on your actual knowledge of this song and artist — their sonic signature, emotional register, cultural moment, production style, lyrical themes. The artwork must feel like THIS song, not a generic version of the style.

ABSOLUTE VISUAL RULES:
- Completely flat 2D. One picture plane. No depth, shadow, or perspective whatsoever.
- Bold crude outlines separating flat zones of color. Drawn, not rendered.
- No photographs, people, faces, figures, landscapes, objects, or recognizable things.
- No text, typography, letters, or numbers.

Output exactly two tagged sections — nothing else:

<interpretation>
2-3 sentences capturing what makes this specific song distinctive — its emotional core, sonic texture, cultural weight, the feeling of listening to it. Write as liner notes, not description.
</interpretation>
<image_prompt>
A precise compositional brief: dominant shapes and their arrangement, exact colors (hex codes), the specific quality of the outlines and marks, spatial weight and tension, and what makes this composition specific to THIS song's character. 4-6 sentences. Close with the medium tags.
</image_prompt>`;

export function buildUserPrompt(track: SpotifyTrack, style: ArtStyle): string {
  const styleNames: Record<ArtStyle, string> = {
    "grunge-y2k": "GRUNGE Y2K",
    "chrome-melancholy": "CHROME MELANCHOLY",
    "distressed-editorial": "DISTRESSED EDITORIAL",
    "cerebral-experimental": "CEREBRAL / EXPERIMENTAL",
    "dream-wreckage": "DREAM WRECKAGE",
  };

  const { grammar, medium } = getStyleGuidance(style);

  let prompt = `Create a VYNL artwork for this specific song.

═══ SONG ═══
"${track.title}" by ${track.artist}
Album: ${track.album}${track.releaseYear ? ` (${track.releaseYear})` : ""}
Popularity: ${track.popularity}/100${track.explicit ? " · Explicit" : ""}`;

  if (track.audioFeatures) {
    const af = track.audioFeatures;
    const energyWord = af.energy > 0.75 ? "explosive" : af.energy > 0.5 ? "charged" : af.energy > 0.3 ? "moderate" : "subdued";
    const valenceWord = af.valence > 0.7 ? "euphoric" : af.valence > 0.5 ? "warm" : af.valence > 0.3 ? "ambiguous" : "dark";
    const tempoWord = af.tempo > 150 ? "frantic" : af.tempo > 120 ? "driving" : af.tempo > 90 ? "mid-tempo" : "slow";
    prompt += `
Sonic data: ${energyWord} energy (${(af.energy * 100).toFixed(0)}%), ${valenceWord} mood (${(af.valence * 100).toFixed(0)}% valence), ${tempoWord} at ${af.tempo.toFixed(0)} BPM, ${(af.danceability * 100).toFixed(0)}% danceability, ${(af.acousticness * 100).toFixed(0)}% acoustic`;
  }

  prompt += `

═══ STYLE ═══
${styleNames[style]}

${grammar}

MEDIUM: ${medium}

═══ TASK ═══
Use what you know about "${track.title}" by ${track.artist} — its specific emotional weight, sonic character, and cultural identity — to make compositional decisions that feel like this exact song. A different song in the same style should produce a meaningfully different image.

What shapes feel like this song's energy? What color weight matches its mood? What spatial arrangement captures its emotional structure? Let those specific answers drive the artwork.`;

  return prompt;
}
