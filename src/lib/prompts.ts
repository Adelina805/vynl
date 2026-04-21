import type { ArtStyle, SpotifyTrack } from "@/types";

// Visual grammar for each style — specific enough that FLUX produces distinct results
const STYLE_GRAMMAR: Record<
  ArtStyle,
  { grammar: string; medium: string; t2iAnchors: string }
> = {
  "grunge-y2k": {
    t2iAnchors: `acid yellow electric magenta cyber cyan void black, fractured hexagonal shards diamond fragments sharp angles, duplicate shapes offset chromatic aberration, thick crude black outlines between flat color zones, scattered pixel corruption blocks high-frequency noise, aggressive diagonal dense composition asymmetric not centered`,
    grammar: `PALETTE: acid yellow (#d4ff00), electric magenta (#ff00dd), cyber cyan (#00ffcc), void black.
FORMS: Hard fractured geometry — hexagonal shards, broken grid planes, diamond fragments at aggressive angles. Shapes duplicated and offset 3–5px in a second color creating chromatic aberration. Thick crude black outlines separating flat color zones.
TEXTURE: Pixel-corruption blocks scattered at edges. High-frequency noise over background zones.
COMPOSITION: Confrontational, dense, canvas-filling. Nothing centered. Diagonal aggression.
FEEL: Digital rot. The screen breaking. Chaos with a grid underneath it.`,
    medium: `flat 2D digital glitch art, Y2K graphic design, screen print aesthetic, no depth, no photography, no 3D`,
  },
  "chrome-melancholy": {
    t2iAnchors: `pearl gray ice steel dark slate near-black, elongated rectangles precise ellipses hairline parallel rules, dominant horizontal band below centerline faint mirrored echo reduced opacity, vast negative void minimal cold geometry, hard-edge constructivist technical illustration asymmetric not centered`,
    grammar: `PALETTE: pearl (#dde4ea), ice steel (#6a8fa8), dark slate (#1c2535), near-black (#06080e).
FORMS: Elongated rectangles and precise ellipses with hard edges. A single dominant horizontal band dividing the canvas. Thin parallel hairline rules receding into negative space. Shapes mirrored below a horizon at reduced opacity.
TEXTURE: Large zones of flat near-black. Small clusters of precision geometry against emptiness.
COMPOSITION: Minimal. More void than form. Everything deliberate.
FEEL: The airport at 4am. Still surfaces. Cold holding something.`,
    medium: `flat 2D hard-edge painting, constructivist graphic design, technical illustration, no depth, no photography, no 3D`,
  },
  "distressed-editorial": {
    t2iAnchors: `signal red risograph teal raw cream newsprint black, flat rectangles diagonal cuts torn polygon edges, misregistered offset second color halftone dot grids overprint collisions, paper grain implied translucent overlaps, zine page cut off-balance collage flat risograph screen print`,
    grammar: `PALETTE: signal red (#e63946), risograph teal (#0ea59e), raw cream (#f5f0e2), newsprint black (#1a1510).
FORMS: Flat color rectangles and diagonal cuts with crude bold outlines. Shapes offset 4–6px in a second color for misregistration. Halftone dot grids at varying densities floating over flat zones. Hard torn-edge polygons.
TEXTURE: Paper grain implied through overlapping translucent shapes. Overprint zones where two flat colors collide at 80% opacity.
COMPOSITION: Off-balance. Cut like a zine page. Deliberate wrongness.
FEEL: The copy machine ran out of registration. Analog failure as aesthetic choice.`,
    medium: `flat 2D risograph print, zine graphic design, screen print, no depth, no photography, no 3D`,
  },
  "cerebral-experimental": {
    t2iAnchors: `strict duotone midnight navy aged cream single rust accent, isometric grid Fibonacci arc fragments lines failing to connect, geometric precision dissolving at one edge, dense diagram cluster one quadrant empty duotone field opposite, Bauhaus De Stijl constructivist poster flat diagram asymmetric`,
    grammar: `PALETTE: midnight navy (#060e1e) and aged cream (#f0e6cc) ONLY — strict duotone. Occasional rust accent (#8b3a2a) for a single corrupted element.
FORMS: A geometric system drawn with mathematical precision — isometric grid, Fibonacci spiral, or radial structure — that begins to fail. Lines that should connect don't. Grids that dissolve at one edge into loose marks. The system visible and breaking simultaneously.
TEXTURE: Dense geometric cluster in one quadrant. Vast empty duotone field in another.
COMPOSITION: Asymmetric tension. The organized and the entropic.
FEEL: A diagram of something that stopped working. Rigor and collapse in the same frame.`,
    medium: `flat 2D Bauhaus poster, De Stijl, constructivist graphic design, duotone print, no depth, no photography, no 3D`,
  },
  "dream-wreckage": {
    t2iAnchors: `burnt amber bruised violet raw flesh deep ink rust red, large organic blobs thick wobbly black outlines flat opaque fills, cut-paper stack overlaps flat translucency collisions, jagged sawtooth bottom drips broken floating arc shards, huge soft form beside tiny sharp fragment off-center neo-expressionist collage`,
    grammar: `PALETTE: burnt amber (#ff8c42), bruised violet (#6b2468), raw flesh (#f0b896), deep ink (#0e0818), dried rust (#992222).
FORMS: Large irregular organic blobs with thick wobbly crude outlines — flat filled shapes, not rendered. Forms bleeding off canvas edges. Shapes stacked like cut paper, no blending, just overlap. Dripping bottom edges as jagged saw-tooth paths. Broken arc fragments floating loose.
TEXTURE: Layers of flat translucent shapes where colors collide unexpectedly.
COMPOSITION: Scale contradictions — enormous soft form next to tiny sharp fragment. Off-center, unsettled.
FEEL: The morning after a surrealist dream. Beautiful debris.`,
    medium: `flat 2D neo-expressionist painting, cut paper collage, crude outline illustration, no depth, no photography, no 3D`,
  },
};

/** FNV-1a-ish 32-bit hash for stable per-track/style variation. */
export function stableUint32(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickVariant<T>(key: string, salt: string, options: readonly T[]): T {
  const idx = stableUint32(`${key}:${salt}`) % options.length;
  return options[idx]!;
}

const CREATIVE_LEANS = [
  "Let **rhythm and phrasing** decide spacing: where shapes cluster vs breathe should echo how the track moves in time.",
  "Let **harmonic / tonal color** steer the palette balance — warm vs cool dominance, not just loud vs soft.",
  "Let **density and production** rule: sparse mixes get more negative space; wall-of-sound tracks get fuller interlocking forms.",
  "Let **emotional arc** pick the compositional bias: opening tension vs release should show up as where visual weight lands.",
  "Let **contrast and surprise** in the song justify one bold, asymmetric choice another track in this style would not make.",
  "Let **cultural / era context** you know about this artist subtly inform motif scale (underground vs mainstream, raw vs polished) without depicting real objects.",
] as const;

const LAYOUT_HINTS = [
  "Favor **tension along one diagonal** — mass vs void cut across the frame, not a centered mandala.",
  "Favor **a strong horizontal or vertical band** that slices the canvas off-ratio (not dead center).",
  "Favor **corner-weighted drama** — the eye enters from one edge and is pushed out another.",
  "Favor **two unequal masses** — one large quiet field, one smaller aggressive cluster.",
  "Favor **edge-bleed** — primary forms clip at boundaries; avoid a tidy contained icon.",
  "Favor **vertical stacking** with deliberate misalignment between layers.",
] as const;

function describeAudioLine(track: SpotifyTrack): string | null {
  const af = track.audioFeatures;
  if (!af) return null;

  const energy =
    af.energy > 0.88
      ? "feral"
      : af.energy > 0.72
        ? "explosive"
        : af.energy > 0.55
          ? "charged"
          : af.energy > 0.38
            ? "steady"
            : af.energy > 0.22
              ? "restrained"
              : "barely lit";

  const valence =
    af.valence > 0.78
      ? "euphoric"
      : af.valence > 0.58
        ? "hope-tinged"
        : af.valence > 0.42
          ? "ambivalent"
          : af.valence > 0.25
            ? "heavy"
            : "bleak";

  const tempo =
    af.tempo > 165
      ? "hyper"
      : af.tempo > 138
        ? "driving"
        : af.tempo > 118
          ? "nimble"
          : af.tempo > 92
            ? "mid-tempo"
            : af.tempo > 72
              ? "loping"
              : "slow";

  const dance =
    af.danceability > 0.72
      ? "body-lock groove"
      : af.danceability > 0.52
        ? "swingy"
        : af.danceability > 0.35
          ? "pocketed"
          : "stiff";

  const acoustic =
    af.acousticness > 0.65
      ? "room-y / acoustic-leaning"
      : af.acousticness > 0.28
        ? "mixed texture"
        : "synthetic / studio sheen";

  const instrumental =
    af.instrumentalness > 0.55
      ? "instrumental-leaning (space for abstraction)"
      : af.instrumentalness > 0.12
        ? "vocals present but not literal in the image"
        : "vocal-forward energy (still no faces or words in the art)";

  return `Sonic read: ${energy} energy (${(af.energy * 100).toFixed(0)}%), ${valence} mood (${(af.valence * 100).toFixed(0)}% valence), ${tempo} at ${af.tempo.toFixed(0)} BPM, ${dance} motion (${(af.danceability * 100).toFixed(0)}% danceability), ${acoustic} (${(af.acousticness * 100).toFixed(0)}% acousticness), ${instrumental} (${(af.instrumentalness * 100).toFixed(0)}% instrumentalness).`;
}

export function getStyleGuidance(style: ArtStyle): {
  grammar: string;
  medium: string;
  t2iAnchors: string;
} {
  return STYLE_GRAMMAR[style];
}

/** Dense style + constraint prefix so Flux/Schnell gets strong tokens, not only LLM prose. */
const FLUX_FLAT_ART_LOCK =
  "orthographic flat illustration opaque color fills thick drawn outlines matte screen-print ink single picture plane, not photograph not photorealistic not 3d cgi not glossy render not human faces not text not letters";

/** Short tokens from Spotify audio features so Flux gets signal even if the LLM is vague. */
export function sonicFluxKeywords(track: SpotifyTrack): string | null {
  const af = track.audioFeatures;
  if (!af) return null;

  const energy =
    af.energy > 0.82
      ? "feral_energy"
      : af.energy > 0.62
        ? "high_energy"
        : af.energy > 0.42
          ? "mid_energy"
          : "low_energy";

  const valence =
    af.valence > 0.68
      ? "bright_valence"
      : af.valence > 0.38
        ? "mixed_valence"
        : "heavy_valence";

  const tempo =
    af.tempo > 145
      ? "rapid_tempo"
      : af.tempo > 118
        ? "driving_tempo"
        : af.tempo > 88
          ? "mid_tempo"
          : "slow_tempo";

  const dance =
    af.danceability > 0.72
      ? "body_groove_dense"
      : af.danceability > 0.48
        ? "swing_groove"
        : "stiff_pocket";

  const acoustic =
    af.acousticness > 0.58
      ? "room_acoustic_bias"
      : af.acousticness > 0.22
        ? "hybrid_texture"
        : "synthetic_sheen";

  const instrumental =
    af.instrumentalness > 0.48
      ? "instrumental_space_wide"
      : "vocal_forward_pressure";

  return `${energy}, ${valence}, ${tempo}, ${dance}, ${acoustic}, ${instrumental}, nonobjective_abstract_graphic`;
}

export function buildFluxImagePrompt(
  style: ArtStyle,
  track: SpotifyTrack,
  imagePrompt: string
): string {
  const { medium, t2iAnchors } = getStyleGuidance(style);
  const core = imagePrompt.replace(/\s+/g, " ").trim();
  const sonic = sonicFluxKeywords(track);
  const parts = [t2iAnchors];
  if (sonic) parts.push(sonic);
  parts.push(core, medium, t2iAnchors, FLUX_FLAT_ART_LOCK);
  return parts.join(". ");
}

export const PROMPT_SYSTEM = `You are VYNL — an art director who translates the emotional and sonic identity of a specific song into a flat 2D abstract graphic artwork.

YOU KNOW MUSIC. Draw on your actual knowledge of this song and artist — their sonic signature, emotional register, cultural moment, production style, lyrical themes. The artwork must feel like THIS song, not a generic version of the style.

UNIQUENESS (critical):
- Do not reuse a default "abstract poster" layout you would give any track. Each song should imply a different primary motif, different spatial bias, and different color emphasis within the style grammar.
- Avoid symmetrical centered compositions unless the song truly calls for that rare stillness.
- In <image_prompt>, include ONE specific, unusual compositional choice that would not make sense for a random other song (name it plainly: e.g. "a jagged rupture only along the lower fifth", "a single oversized shard eating the upper left").
- If the creative lean or layout hint conflicts with the song, follow the song — those hints are spurs, not laws.

TEXT-TO-IMAGE WORDING (critical — models need concrete tokens, not mood essays):
- The FIRST line inside <image_prompt> must be ONE dense comma-separated phrase of concrete visual nouns (shapes, marks, layout, materials, exact colors as words with hex in parentheses where helpful). No full sentences on that line. Aim for 18–35 short tokens.
- State which ONE hex from the style palette commands roughly half the canvas area for this song, and which hex is only an accent — that choice must change track-to-track.
- Do not waste tokens on filler: no "ethereal", "captivating", "stunning", "dynamic composition", "vibrant energy", "mesmerizing", "powerful", "unique vision", "beautiful abstract", "striking visual", "bold aesthetic", "evocative atmosphere", or similar vague praise.
- After that opening keyword line, write 3–5 short sentences: spatial structure, edge behavior, outline weight, one song-specific rupture or bias — then end with the medium tags as instructed.

ABSOLUTE VISUAL RULES:
- Completely flat 2D. One picture plane. No depth, shadow, or perspective whatsoever.
- Bold crude outlines separating flat zones of color. Drawn, not rendered.
- No photographs, people, faces, figures, landscapes, objects, or recognizable things.
- No text, typography, letters, or numbers.

Output format (strict):
- Your entire reply is only two blocks in this order. No preamble, no postscript, no markdown code fences.
- Tag names are lowercase: interpretation, then image_prompt (underscore between image and prompt).

Block 1: open with <interpretation>, put 2–3 liner-note sentences about this song, close with </interpretation>.

Block 2: open with <image_prompt>, put the diffusion brief (follow TEXT-TO-IMAGE WORDING above), close with </image_prompt>.`;

export function buildUserPrompt(track: SpotifyTrack, style: ArtStyle): string {
  const styleNames: Record<ArtStyle, string> = {
    "grunge-y2k": "GRUNGE Y2K",
    "chrome-melancholy": "CHROME MELANCHOLY",
    "distressed-editorial": "DISTRESSED EDITORIAL",
    "cerebral-experimental": "CEREBRAL / EXPERIMENTAL",
    "dream-wreckage": "DREAM WRECKAGE",
  };

  const { grammar, medium } = getStyleGuidance(style);
  const variantKey = `${track.id}:${style}`;
  const creativeLean = pickVariant(variantKey, "lean", CREATIVE_LEANS);
  const layoutHint = pickVariant(variantKey, "layout", LAYOUT_HINTS);
  const audioLine = describeAudioLine(track);

  let prompt = `Create a VYNL artwork for this specific song.

═══ SONG ═══
"${track.title}" by ${track.artist}
Album: ${track.album}${track.releaseYear ? ` (${track.releaseYear})` : ""}
Popularity: ${track.popularity}/100${track.explicit ? " · Explicit" : ""}`;

  if (audioLine) {
    prompt += `
${audioLine}`;
  }

  prompt += `

═══ STYLE ═══
${styleNames[style]}

${grammar}

MEDIUM: ${medium}

═══ CREATIVE SPUR (per-track) ═══
Creative lean: ${creativeLean}
Layout bias suggestion: ${layoutHint}

═══ TASK ═══
Use what you know about "${track.title}" by ${track.artist} — its specific emotional weight, sonic character, and cultural identity — to make compositional decisions that feel like this exact song. A different song in the same style should produce a meaningfully different image.

What shapes feel like this song's energy? What color weight matches its mood? What spatial arrangement captures its emotional structure? Let those specific answers drive the artwork.`;

  return prompt;
}
