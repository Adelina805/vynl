import type { ArtStyle, SpotifyTrack } from "@/types";

// Full visual grammar for the art-direction LLM; compact fingerprints go to Flux (see fluxFingerprint).
const STYLE_GRAMMAR: Record<
  ArtStyle,
  { grammar: string; medium: string; t2iAnchors: string; fluxFingerprint: string }
> = {
  "grunge-y2k": {
    fluxFingerprint:
      "Y2K glitch screen-print, fractured shards duplicated offset, crude black dividing lines, asymmetric flat collage, sparse digital grit not photo",
    t2iAnchors: `acid yellow electric magenta cyber cyan void black, fractured hexagonal shards diamond fragments sharp angles, duplicate shapes offset chromatic aberration, thick crude black outlines between flat color zones, scattered pixel corruption blocks high-frequency noise, aggressive diagonal dense composition asymmetric not centered`,
    grammar: `PALETTE: acid yellow (#d4ff00), electric magenta (#ff00dd), cyber cyan (#00ffcc), void black.
FORMS: Hard fractured geometry — hexagonal shards, broken grid planes, diamond fragments at aggressive angles. Shapes duplicated and offset 3–5px in a second color creating chromatic aberration. Thick crude black outlines separating flat color zones.
TEXTURE: Pixel-corruption blocks scattered at edges. High-frequency noise over background zones.
COMPOSITION: Confrontational, dense, canvas-filling. Nothing centered. Diagonal aggression.
FEEL: Digital rot. The screen breaking. Chaos with a grid underneath it.`,
    medium: `flat 2D digital glitch art, Y2K graphic design, screen print aesthetic, no depth, no photography, no 3D`,
  },
  "chrome-melancholy": {
    fluxFingerprint:
      "minimal hard-edge pearl-slate flat, faint horizon stripe, ellipse and rule geometry, deliberate void weight, asymmetric cold abstraction not photo",
    t2iAnchors: `pearl gray ice steel dark slate near-black, elongated rectangles precise ellipses hairline parallel rules, dominant horizontal band below centerline faint mirrored echo reduced opacity, vast negative void minimal cold geometry, hard-edge constructivist technical illustration asymmetric not centered`,
    grammar: `PALETTE: pearl (#dde4ea), ice steel (#6a8fa8), dark slate (#1c2535), near-black (#06080e).
FORMS: Elongated rectangles and precise ellipses with hard edges. A single dominant horizontal band dividing the canvas. Thin parallel hairline rules receding into negative space. Shapes mirrored below a horizon at reduced opacity.
TEXTURE: Large zones of flat near-black. Small clusters of precision geometry against emptiness.
COMPOSITION: Minimal. More void than form. Everything deliberate.
FEEL: The airport at 4am. Still surfaces. Cold holding something.`,
    medium: `flat 2D hard-edge painting, constructivist graphic design, technical illustration, no depth, no photography, no 3D`,
  },
  "distressed-editorial": {
    fluxFingerprint:
      "risograph zine flat, torn paper polygon blocks, halftone misregister offset, translucent overlap flat ink, asymmetric editorial cut not photo",
    t2iAnchors: `signal red risograph teal raw cream newsprint black, flat rectangles diagonal cuts torn polygon edges, misregistered offset second color halftone dot grids overprint collisions, paper grain implied translucent overlaps, zine page cut off-balance collage flat risograph screen print`,
    grammar: `PALETTE: signal red (#e63946), risograph teal (#0ea59e), raw cream (#f5f0e2), newsprint black (#1a1510).
FORMS: Flat color rectangles and diagonal cuts with crude bold outlines. Shapes offset 4–6px in a second color for misregistration. Halftone dot grids at varying densities floating over flat zones. Hard torn-edge polygons.
TEXTURE: Paper grain implied through overlapping translucent shapes. Overprint zones where two flat colors collide at 80% opacity.
COMPOSITION: Off-balance. Cut like a zine page. Deliberate wrongness.
FEEL: The copy machine ran out of registration. Analog failure as aesthetic choice.`,
    medium: `flat 2D risograph print, zine graphic design, screen print, no depth, no photography, no 3D`,
  },
  "cerebral-experimental": {
    fluxFingerprint:
      "strict duotone diagram flat Bauhaus-Stijl, grid lines breaking one edge, quadrant unequal masses, asymmetric constructivist poster not photo",
    t2iAnchors: `strict duotone midnight navy aged cream single rust accent, isometric grid Fibonacci arc fragments lines failing to connect, geometric precision dissolving at one edge, dense diagram cluster one quadrant empty duotone field opposite, Bauhaus De Stijl constructivist poster flat diagram asymmetric`,
    grammar: `PALETTE: midnight navy (#060e1e) and aged cream (#f0e6cc) ONLY — strict duotone. Occasional rust accent (#8b3a2a) for a single corrupted element.
FORMS: A geometric system drawn with mathematical precision — isometric grid, Fibonacci spiral, or radial structure — that begins to fail. Lines that should connect don't. Grids that dissolve at one edge into loose marks. The system visible and breaking simultaneously.
TEXTURE: Dense geometric cluster in one quadrant. Vast empty duotone field in another.
COMPOSITION: Asymmetric tension. The organized and the entropic.
FEEL: A diagram of something that stopped working. Rigor and collapse in the same frame.`,
    medium: `flat 2D Bauhaus poster, De Stijl, constructivist graphic design, duotone print, no depth, no photography, no 3D`,
  },
  "dream-wreckage": {
    fluxFingerprint:
      "neo-expressionist cut-paper blobs, thick wobbly outline flat opaque stacks, translucent layer clash, shard scale jumps, asymmetric organic rupture not photo",
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

const PITCH_CLASSES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

function describeArtistGenresLine(track: SpotifyTrack): string | null {
  const genres = track.artistGenres ?? [];
  if (genres.length === 0) return null;
  return `Artist genres (Spotify): ${genres.slice(0, 5).join(", ")}.`;
}

function describeExtendedFeatures(track: SpotifyTrack): string | null {
  const af = track.audioFeatures;
  if (!af) return null;
  const parts: string[] = [];

  if (typeof af.loudness === "number") {
    parts.push(`loudness ${af.loudness.toFixed(1)} dB`);
  }
  if (typeof af.speechiness === "number") {
    const s = af.speechiness;
    const tag =
      s > 0.66 ? "speech-forward" : s > 0.33 ? "mixed speech/instrumental" : "non-speech leaning";
    parts.push(`${tag} (${(s * 100).toFixed(0)}% speechiness)`);
  }
  if (typeof af.liveness === "number") {
    const l = af.liveness;
    const tag = l > 0.65 ? "room-live feel" : l > 0.35 ? "hybrid intimacy" : "studio-dry envelope";
    parts.push(`${tag} (${(l * 100).toFixed(0)}% liveness)`);
  }
  if (typeof af.key === "number" && af.key >= 0 && af.key <= 11) {
    const mode =
      typeof af.mode === "number"
        ? af.mode === 1
          ? "major"
          : "minor"
        : "unknown-mode";
    parts.push(`${PITCH_CLASSES[af.key]} ${mode}`);
  }
  if (typeof af.timeSignature === "number") {
    parts.push(`${af.timeSignature}/4 feel (meter cue)`);
  }

  return parts.length > 0 ? `Signal extensions: ${parts.join("; ")}.` : null;
}

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

/** Max prose length from <image_prompt> passed through to Flux (after dense keyword line). */
export const MAX_FLUX_PROSE_CHARS = 720;

function normalizePromptMultilinePreserveBreaks(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trimEnd())
    .join("\n")
    .trim();
}

function commaTokenCountDense(line: string): number {
  return line.split(",").filter((t) => t.trim().length > 0).length;
}

/**
 * Splits diffusion brief into a comma-heavy opener vs prose tail.
 * Prefers newline; if missing, splits after the first sentence boundary that follows a comma-dense opener.
 */
export function splitImagePromptDenseAndProse(imagePrompt: string): {
  denseLine: string;
  proseAfter: string;
  usedNewlineBetween: boolean;
} {
  const t = normalizePromptMultilinePreserveBreaks(imagePrompt);
  const nl = t.indexOf("\n");

  if (nl !== -1) {
    return {
      denseLine: t.slice(0, nl).trim(),
      proseAfter: t
        .slice(nl + 1)
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, MAX_FLUX_PROSE_CHARS),
      usedNewlineBetween: true,
    };
  }

  for (let i = 48; i < t.length - 40; i++) {
    const ch = t[i];
    if (!(ch === "." || ch === "!" || ch === "?")) continue;
    const prev = i > 0 ? t[i - 1] : "";
    if (!prev || /\d/.test(prev)) continue;

    const next = t[i + 1];
    if (!(next === " " || next === undefined || next === "\n")) continue;

    const jump = next === "\n" ? 2 : next === undefined ? 1 : 2;
    const prefix = t.slice(0, i).trim();
    const rest = t
      .slice(i + jump)
      .trim()
      .replace(/\s+/g, " ");

    if (commaTokenCountDense(prefix) >= 10 && prefix.length >= 48 && rest.length >= 56) {
      return {
        denseLine: prefix,
        proseAfter: rest.slice(0, MAX_FLUX_PROSE_CHARS),
        usedNewlineBetween: false,
      };
    }
  }

  return {
    denseLine: t.trim(),
    proseAfter: "",
    usedNewlineBetween: false,
  };
}

/** @deprecated use splitImagePromptDenseAndProse — kept for backward-compatible tests/name. */
export function splitFluxImagePromptLines(imagePrompt: string): {
  denseLine: string;
  proseAfter: string;
} {
  const { denseLine, proseAfter } = splitImagePromptDenseAndProse(imagePrompt);
  return { denseLine, proseAfter };
}

export function getStyleGuidance(style: ArtStyle): {
  grammar: string;
  medium: string;
  t2iAnchors: string;
  fluxFingerprint: string;
} {
  return STYLE_GRAMMAR[style];
}

/** Dense style + constraint prefix so Flux/Schnell gets strong tokens, not only LLM prose. */
const FLUX_FLAT_ART_LOCK =
  "orthographic flat illustration opaque color fills thick drawn outlines matte screen-print ink single picture plane, not photograph not photorealistic not 3d cgi not glossy render not human faces not text not letters";

/** Finer sonic tokens for Flux: numeric fingerprints + qualitative tags + optional genre stubs. */
export function sonicFluxKeywords(track: SpotifyTrack): string | null {
  const af = track.audioFeatures;
  if (!af) return null;

  const numeric = `sonic_e${af.energy.toFixed(2)}_v${af.valence.toFixed(2)}_d${af.danceability.toFixed(2)}_bps${Math.round(af.tempo)}`;
  let extraNum = "";
  if (typeof af.speechiness === "number") {
    extraNum += `_sp${af.speechiness.toFixed(2)}`;
  }
  if (typeof af.liveness === "number") {
    extraNum += `_lv${af.liveness.toFixed(2)}`;
  }
  if (typeof af.loudness === "number") {
    extraNum += `_db${af.loudness.toFixed(0)}`;
  }

  const energyQual =
    af.energy > 0.82
      ? "feral_energy"
      : af.energy > 0.62
        ? "high_energy"
        : af.energy > 0.42
          ? "mid_energy"
          : "low_energy";

  const valQual =
    af.valence > 0.68
      ? "bright_valence"
      : af.valence > 0.38
        ? "mixed_valence"
        : "heavy_valence";

  const tempoQual =
    af.tempo > 145
      ? "rapid_tempo_band"
      : af.tempo > 118
        ? "driving_tempo_band"
        : af.tempo > 88
          ? "mid_tempo_band"
          : "slow_tempo_band";

  const danceQual =
    af.danceability > 0.72
      ? "body_groove_dense"
      : af.danceability > 0.48
        ? "swing_groove_mid"
        : "stiff_pocket_sparse";

  const acousticQual =
    af.acousticness > 0.58
      ? "room_acoustic_bias"
      : af.acousticness > 0.22
        ? "hybrid_texture"
        : "synthetic_sheen_hard";

  const instrQual =
    af.instrumentalness > 0.48
      ? "instrumental_space_wide"
      : "vocal_forward_pressure_mix";

  const genres = track.artistGenres ?? [];
  const genreStub =
    genres.length > 0
      ? `spotifygenre_${genres
          .slice(0, 2)
          .map((g) => g.replace(/[^a-z0-9]+/gi, "_").toLowerCase())
          .filter(Boolean)
          .join("_")}`
      : "";

  const parts = [
    numeric + extraNum,
    energyQual,
    valQual,
    tempoQual,
    danceQual,
    acousticQual,
    instrQual,
    "abstract_nonobjective_graphic",
  ];
  if (genreStub) parts.push(genreStub);

  return parts.join(", ");
}

export function buildFluxImagePrompt(
  style: ArtStyle,
  track: SpotifyTrack,
  imagePrompt: string
): string {
  const { medium, fluxFingerprint } = getStyleGuidance(style);
  const { denseLine, proseAfter } = splitImagePromptDenseAndProse(imagePrompt);
  const sonic = sonicFluxKeywords(track);

  const chunks: string[] = [denseLine];
  if (proseAfter.length > 0) {
    chunks.push(proseAfter.replace(/\s+/g, " ").trim());
  }
  if (sonic) {
    chunks.push(sonic);
  }
  chunks.push(fluxFingerprint, medium, FLUX_FLAT_ART_LOCK);

  /** Trailing repeat: some T2I stacks weight late tokens heavily. */
  const sandwich = [...chunks, denseLine];
  return sandwich.join(". ").replace(/\s+/g, " ").trim();
}

export const PROMPT_SYSTEM = `You are VYNL — an art director who translates the emotional and sonic identity of a specific song into a flat 2D abstract graphic artwork.

YOU KNOW MUSIC. Draw on your actual knowledge of this song and artist — their sonic signature, emotional register, cultural moment, production style, lyrical themes. The artwork must feel like THIS song, not a generic version of the style.

INTERPRETATION BLOCK (critical):
- In <interpretation>, write exactly 3 sentences total.
- At least ONE sentence MUST state a falsifiable sonic/detail claim (mention a section like verse/intro/bridge, an instrument layer, BPM/tempo wording, riff/melodic motion, groove/pocket/shuffle/syncop cues, breakdown/drop language, stacking/layering, or specific production FX) — never vibe-adjectives alone.
- Name the artist and/or song title plainly at least once so the grounding is unmistakable.

SONG-FIRST (critical — before style):
- You MUST encode three bindings in <image_prompt> prose (after the comma-heavy opener): name the "**emotional arc**", "**rhythm**", and either the word "**geometry**" once or "**geometric**/**geometries**" about how shapes stagger.
  1) **Emotional arc** — how intro / tension / release (or absence of release) of THIS track maps to where visual mass sits, void vs clutter, and edge aggression.
  2) **Rhythm → geometry** — how groove, BPM feel, syncopation, or stillness becomes repetition, spacing, interruption, or stagger in shapes (not literal musical notation).
  3) **Song-only constraint** — ONE compositional rule that would look wrong if you applied it to a random other song (e.g. "rupture confined to lower fifth only", "one shard devouring upper-left quadrant", "halftone cluster pinned to a single off-axis strip").

CONTRASTIVE BINDING (critical, inside <image_prompt> prose after keyword line):
- Include ONE short sentence contrasting this track with hypothetical others — e.g. what would noticeably change visually if we swapped this for another well-known track in this genre/scene ("If this were … we would …" or "versus another hit … we'd …"). Goal: beat template drift.

ANTI-TEMPLATE MOTIF (critical):
- Do NOT default to the cliché motifs named in your head for this STYLE's marketing copy (shard-mandala, generic halftone sun, symmetrical blob stack, centered logo-like icon) unless the song convincingly earns that exact cliché.

PALETTE FLEX:
- Prefer style-palette hexes for dominant & accent masses. You MAY optionally add ONE extra outsider accent hex ONLY if lyrics/emotion/production clearly punch outside the palette AND you explicitly say it is outsider (max one).

UNIQUENESS (critical):
- Do not reuse a default "abstract poster" layout you would give any track. Each song should imply a different primary motif, different spatial bias, and different color emphasis within the style grammar.
- Avoid symmetrical centered compositions unless the song truly calls for that rare stillness. Never name golden ratio, radial mandala, or mirror symmetry unless the song is genuinely about that kind of stillness.
- If the creative lean or layout hint conflicts with the song, follow the song — those hints are spurs, not laws.

TEXT-TO-IMAGE WORDING (critical — models need concrete tokens, not mood essays):
- STRUCTURE PASS (pick one — both work with our tooling): **(A)** Line 1 = ONLY a dense comma-heavy token run; press Enter; Line 2+ = prose paragraph. **(B)** One paragraph: comma-heavy opener (no verbs), end with "." + space + prose continuation.
- The comma-heavy opener MUST pack 18–35 short fragments separated by commas, including hex-coded colors (#rrggbb) and dominance vs accent.
- State which ONE hex from the style palette commands roughly half the canvas area for this song, and which hex is only an accent — that choice must change track-to-track.
- Do not waste tokens on filler: no "ethereal", "captivating", "stunning", "dynamic composition", "vibrant energy", "mesmerizing", "powerful", "unique vision", "beautiful abstract", "striking visual", "bold aesthetic", "evocative atmosphere", or similar vague praise.
- Prose MUST include these exact substring tokens (verbatim, lowercase okay): "**emotional arc**", "**rhythm**". It MUST ALSO include either the word "**geometry**" once or "**geometric** / **geometries**" describing shape logic.
- Prose MUST end with ONE contrast sentence imagining a swap with "**another plausible hit/genre-peer**" and spelling out ONE visual outcome that would CHANGE (density, quadrant bias, rupture boundary, stripe width…).
- End with medium tags echoed from the brief (flat 2D, no photo, etc.). Describe outline weight along rupture fronts.

ABSOLUTE VISUAL RULES:
- Completely flat 2D. One picture plane. No depth, shadow, or perspective whatsoever.
- Bold crude outlines separating flat zones of color. Drawn, not rendered.
- No photographs, people, faces, figures, landscapes, objects, or recognizable things.
- No text, typography, letters, or numbers.

Output format (strict):
- Your entire reply is only two blocks in this order. No preamble, no postscript, no markdown code fences.
- Tag names are lowercase: interpretation, then image_prompt (underscore between image and prompt).

Block 1: open with <interpretation>, put 3 sentences per rules above, close with </interpretation>.

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
  const genreLine = describeArtistGenresLine(track);
  const extendedLine = describeExtendedFeatures(track);

  let prompt = `Create a VYNL artwork for this specific song.

═══ SONG ═══
"${track.title}" by ${track.artist}
Album: ${track.album}${track.releaseYear ? ` (${track.releaseYear})` : ""}
Popularity: ${track.popularity}/100${track.explicit ? " · Explicit" : ""}`;

  if (genreLine) {
    prompt += `
${genreLine}`;
  }

  if (audioLine) {
    prompt += `
${audioLine}`;
  }

  if (extendedLine) {
    prompt += `
${extendedLine}`;
  }

  prompt += `

═══ STYLE ═══
${styleNames[style]}

${grammar}

MEDIUM: ${medium}

NOTE: Flux will receive mainly YOUR keyword line plus a SHORT style fingerprint; do not lazily outsource the motif to vague style placeholders — burying detail in cliché motifs will flatten every song.

═══ CREATIVE SPUR (per-track) ═══
Creative lean: ${creativeLean}
Layout bias suggestion: ${layoutHint}

═══ TASK ═══
Use what you know about "${track.title}" by ${track.artist} — specific emotional weight, sonic character, and cultural identity — to drive every decision. A different song in the same style must produce a meaningfully different image.

In <interpretation>: 3 sentences, name artist or title, include one falsifiable sonic/detail claim.

In <image_prompt>:
- Prefer option (A): line 1 = comma-heavy token burst only, line 2+ = prose starting with how mass maps to emotion.
- Allowed option (B): one paragraph ending the comma-heavy opener with ". " immediately before prose.
- Prose MUST use literal lowercase substrings emotional arc AND rhythm PLUS geometry OR geometric/geometries describing shape choreography.
- One contrast sentence must imagine swapping versus another plausible hit/genre-peer and state what visibly relocates or skews.
- You may optionally add ONE outsider accent hex (max one), stated clearly — only if justified by the song.
- Invent a motif that will not read as interchangeable with yesterday's diffusion request in this palette.`;

  return prompt;
}
