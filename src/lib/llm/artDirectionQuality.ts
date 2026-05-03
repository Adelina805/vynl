/**
 * Guardrails so art-direction output stays concrete and song-specific,
 * not generic "abstract poster" filler.
 */

import { splitImagePromptDenseAndProse } from "../prompts.ts";
import type { SpotifyTrack } from "@/types";

const BANNED_SUBSTRINGS = [
  "ethereal",
  "captivating",
  "stunning",
  "mesmerizing",
  "dynamic composition",
  "vibrant energy",
  "powerful",
  "unique vision",
  "beautiful abstract",
  "striking visual",
  "bold aesthetic",
  "evocative atmosphere",
  "timeless",
  "breathtaking",
] as const;

/** Outputs that read as stock layout clichés rather than song-specific direction. */
const BANNED_LAYOUT_CLICHES = [
  "centered mandala",
  "perfect symmetry",
  "radial symmetry",
  "golden ratio",
  "symmetrical balance",
  "mirror symmetry",
] as const;

/** Provenance for a concrete-but-not-catalog detail (helps avoid pure mood fluff). */
const SONIC_DETAIL_PATTERN =
  /(four-on-the-floor|double-?\s*time|half-?\s*time|build(-|\s)+(and\s+)?drop|tape sat|wet mix|riff contour|kick pattern|vocoder|cymbal swell|muted strum|pre-?\s*chorus|filter sweep|\b(snare|tom)\s+rolls?\b|(call|sing)[\w]*\s*&\s*response|stacked harmonies|tape hiss|vocals?\s+panned|automated filter|walking bass|crescendo swell|minimal kick|ambient bed|spoken word vignette|[2-9]\/\d\b(\s*time)?)/i;

const SONIC_TOKEN_RELAXED =
  /\b(bpm\b|beats?\s+per\b|beats?\s+feel\b|percussion\b|kick\b|808\b|snare\b|crash\b|cymbal|hi-?hat|tom\b|pads?\s|sampler|loop(s|ed)?\b|guitars?\b|bass(line)?\b|keyboard|synth|arpegg|layering\b|layers?\b stacked|stack(ed|s)\b harmonies|backing vocals?\b|riff\b|motif\b|melody\b|harmony\b|syncop|Pocket\b|quantize\b|\bgroove\b|shuffle\b|\bverse\b|\bchorus\b|\bbridge\b|\bintro\b|\boutro\b|\bhook\b|\brefrain\b|\bbreakdown\b|\bcoda\b|tempo\b|mix(es|ed)?\b|brickwall|crescendo\b|tape\s+delay\b|tape\s+echo\b|tape\s+hiss\b|distortion\b|compression\b|filter\b sweep\b|doubled\b vocals\b|autotune\b|sidechain\b|\bdouble\s*time\b|\bhalf\s*time\b)/i;

function hasInterpretationSonicTokens(text: string): boolean {
  if (SONIC_DETAIL_PATTERN.test(text)) return true;
  if (
    /\b\d{2,3}\s*bpm\b/i.test(text) ||
    /\b(?:19|20)\d{2}s?\b/.test(text) ||
    /\b(bar|measure)\b/i.test(text) ||
    /\b(minute\s+mark|second\s+\d+)\b/i.test(text)
  ) {
    return true;
  }
  return SONIC_TOKEN_RELAXED.test(text);
}

function interpretationSonicPassesHeuristic(trimmed: string): boolean {
  /** Name + recognizable structure words still require at least one production/arrangement-ish anchor. */
  const low = trimmed.toLowerCase();
  const citesTrack =
    /\b(this|the)\s+(track|recording|song|single|cut)\s+/.test(low) ||
    /\bopening\b|\bcloses\b|\bcloses out\b|\bintroduces\b|\bsettles\b|\bsettles\s+into\b|\bbuilds\b|\bfades\b|\bresolves\b/.test(trimmed);

  if (trimmed.length < 94) return false;
  return citesTrack && SONIC_TOKEN_RELAXED.test(trimmed);
}

export interface ImagePromptQualityResult {
  ok: boolean;
  reasons: string[];
}

function commaTokenCount(line: string): number {
  return line.split(",").filter((t) => t.trim().length > 0).length;
}

function hasHexColor(text: string): boolean {
  return /#[0-9a-fA-F]{3,8}\b/.test(text);
}

/** "geometry" word OR common morphological substitutes. */
function hasGeometryCue(lower: string): boolean {
  return /\bgeometries?\b|\bgeometry\b|\bgeometric\b/.test(lower);
}

/** Contrast sentence that forces differentiation vs template drift. */
function hasContrastiveBinding(candidate: string): boolean {
  const lower = candidate.toLowerCase().replace(/\s+/g, " ");
  const longEnough = candidate.replace(/\s+/g, " ").trim().length >= 44;
  if (!longEnough) return false;

  const patterns = [
    /\bif\b[\s\S]{0,220}\bwere\b[\s\S]{0,220}\b(different|rather)/i.test(candidate),
    /\bversus\b[\s\S]{0,260}\b(another|genre|popular|crowd)/i.test(candidate),
    /\b(swapping|swapped)[\s\S]{0,220}\b(track|song|hit|recording|genre)\b/i.test(
      candidate
    ),
    /\bwould\b[\s\S]{0,180}\bchange\b[\s\S]{0,160}\b(if|versus|than|were)\b/i.test(lower),
    /\bdifferent\b[\s\S]{0,220}\b(hit|genre|peer|recording|buddy|neighbor|chart)\b/i.test(
      lower
    ),
    /\bgeneric\b[\s\S]{0,260}\b(neighbor|peer\s+hit|crowd\s+pleaser|genre\s+twin)\b/i.test(
      lower
    ),
    /\bhypothetical\b[\s\S]{0,260}\b(would|swap|recording|neighbor|hit|track)\b/i.test(
      lower
    ),
    /\bmass\b[\s\S]{0,220}\bwould\b[\s\S]{0,160}\bmigrate\b/.test(lower),
    /\bwould\b[\s\S]{0,120}sit\b[\s\S]{0,180}\belsewhere\b/i.test(lower),
    /\banother\b[\s\S]{0,220}\b(plausible\b)?[\s\S]{0,80}\bwould\b[\s\S]{0,260}\b(change|skew|narrow|invert|migrate|scatter|crowd)\b/i.test(
      candidate
    ),
    /\banother\b[\s\S]{0,160}\bhits?'?\b[\s\S]{0,220}\bwould\b/i.test(lower),
    /\bgenre[-\s]?peer\b[\s\S]{0,200}\bwould\b/i.test(lower),
    /\b(plausible\s+hit|alternative\s+hits)\b[\s\S]{0,260}\bwould\b/i.test(lower),
    /\bcompared\s+to\b[\s\S]{0,180}\banother\b/i.test(lower),
    /\b(unlike\b)[\s\S]{0,200}\b(another\s+recording|neighbor\s+hits)\b/i.test(lower),
    /\b(relief|mass|density|accent)\s+would\b[\s\S]{0,180}\bmigrate\b/i.test(lower),
  ];
  return patterns.some(Boolean);
}

/** Collapse horizontal whitespace but preserve newlines (validators / manual layout). */
function normalizeMultilinePreserveBreaks(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trimEnd())
    .join("\n")
    .trim();
}

/**
 * Returns false if the prompt looks generic, vague, or structurally wrong.
 * Used to trigger repair passes from the LLM.
 */
export function assessImagePromptQuality(imagePrompt: string): ImagePromptQualityResult {
  const box = normalizeMultilinePreserveBreaks(imagePrompt);
  const reasons: string[] = [];

  if (box.length < 120) {
    reasons.push(
      "image_prompt is too short — add more concrete visual tokens (shapes, edges, palette dominance, one song-only rupture)."
    );
  }

  const { denseLine: line1Raw, proseAfter } = splitImagePromptDenseAndProse(box);
  const line1 = line1Raw.trim();

  if (!line1.includes(",")) {
    reasons.push(
      "comma-heavy opener must be one comma-separated burst of nouns/mark tokens (then newline OR period-space before prose)."
    );
  } else if (commaTokenCount(line1) < 12) {
    reasons.push(
      `comma-heavy opener needs ~12+ comma fragments (got ${commaTokenCount(line1)}); pack more concrete tokens + hex cues.`
    );
  }

  const proseCollapsed = proseAfter.replace(/\s+/g, " ").trim();
  if (proseCollapsed.length < 72) {
    reasons.push(
      "after opener add ≥72 chars prose: weave emotional arc, rhythm, geometric/geometry linkage, PLUS one contrast-vs-another-hit/genre-peer sentence naming what visibly changes."
    );
  }

  if (!hasContrastiveBinding(proseCollapsed.length >= 48 ? proseCollapsed : box)) {
    reasons.push(
      "include ONE swap/contrast clause (versus another plausible hit/genre-peer / if this record were…) stating at least ONE layout shift you'd make."
    );
  }

  if (!hasHexColor(box)) {
    reasons.push(
      "must name at least one hex from the style palette and state dominant vs accent coverage."
    );
  }

  const lower = box.toLowerCase();

  const needArcRhythm = (["emotional arc", "rhythm"] as const).filter((t) => !lower.includes(t));
  if (needArcRhythm.length > 0) {
    reasons.push(
      `prose must include verbatim phrases "emotional arc" and "rhythm" after the opener (missing: ${needArcRhythm.join(", ")}).`
    );
  }

  if (!hasGeometryCue(lower)) {
    reasons.push(
      'include "geometry" OR "geometric"/"geometries" when tying rhythm to spatial shape logic.'
    );
  }

  for (const phrase of BANNED_SUBSTRINGS) {
    if (lower.includes(phrase)) {
      reasons.push(`remove vague filler / banned phrase: "${phrase}"`);
    }
  }
  for (const phrase of BANNED_LAYOUT_CLICHES) {
    if (lower.includes(phrase)) {
      reasons.push(
        `avoid stock layout clichés — replace "${phrase}" with song-specific spatial bias.`
      );
    }
  }

  return { ok: reasons.length === 0, reasons };
}

function interpretationNamesTrack(interpretation: string, track: SpotifyTrack): boolean {
  const low = interpretation.toLowerCase();
  const titleCore =
    track.title.split(/\(|feat\.|ft\.|\[/i)[0]!.trim().toLowerCase();

  const primaryArtist = track.artist.split(",")[0]!.trim().toLowerCase();

  const titleHit =
    titleCore.length >= 4 &&
    titleCore.slice(0, 56).length > 0 &&
    low.includes(titleCore.slice(0, Math.min(titleCore.length, 56)));

  const artistHit =
    primaryArtist.length >= 5 &&
    low.includes(primaryArtist.slice(0, Math.min(primaryArtist.length, 64)));

  const wordHit =
    titleCore.split(/\s+/).filter((w) => w.length > 6).some((w) => low.includes(w));

  const albumSlice = track.album.trim().toLowerCase().slice(0, 42);
  const albumHit = albumSlice.length >= 8 && low.includes(albumSlice);

  return titleHit || artistHit || wordHit || albumHit;
}

/**
 * Lightweight checks on liner-note specificity (artist/title grounding + falsifiable sonic read).
 */
export function assessInterpretationQuality(
  interpretation: string,
  track: SpotifyTrack
): ImagePromptQualityResult {
  const trimmed = interpretation.replace(/\s+/g, " ").trim();
  const reasons: string[] = [];

  if (trimmed.length < 92) {
    reasons.push(
      "interpretation: expand to THREE sentences totaling ~92+ chars, naming artist/title and one falsifiable sonic/detail claim."
    );
  }

  if (!interpretationNamesTrack(trimmed, track)) {
    reasons.push(
      'interpretation: state the artist and/or plain song title plainly (not only abstract mood words).'
    );
  }

  const sonicOk =
    hasInterpretationSonicTokens(trimmed) || interpretationSonicPassesHeuristic(trimmed);

  if (!sonicOk) {
    reasons.push(
      'interpretation: cite at least ONE concrete sonic/arrangement fact (sections, BPM/tempo wording, groove/pocket, riff/melodic motion, layering, recognizable instrument role, FX, verse/bridge/drop language — skip vibes-only adjectives).'
    );
  }

  return { ok: reasons.length === 0, reasons };
}

export function mergeQualityResults(
  a: ImagePromptQualityResult,
  b: ImagePromptQualityResult
): ImagePromptQualityResult {
  const reasons = [...a.reasons, ...b.reasons];
  return { ok: reasons.length === 0, reasons };
}

export function formatQualityRepairHint(reasons: string[]): string {
  return `The reply failed quality checks. Fix issues then resend ONLY the two XML blocks.\nIssues:\n${reasons.map((r) => `- ${r}`).join("\n")}`;
}
