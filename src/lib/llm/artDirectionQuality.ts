/**
 * Guardrails so art-direction output stays concrete and song-specific,
 * not generic "abstract poster" filler.
 */

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

export interface ImagePromptQualityResult {
  ok: boolean;
  reasons: string[];
}

function firstLine(text: string): string {
  const nl = text.indexOf("\n");
  return (nl === -1 ? text : text.slice(0, nl)).trim();
}

function commaTokenCount(line: string): number {
  return line.split(",").filter((t) => t.trim().length > 0).length;
}

function hasHexColor(text: string): boolean {
  return /#[0-9a-fA-F]{3,8}\b/.test(text);
}

/**
 * Returns false if the prompt looks generic, vague, or structurally wrong.
 * Used to trigger a single repair pass from the LLM.
 */
export function assessImagePromptQuality(imagePrompt: string): ImagePromptQualityResult {
  const trimmed = imagePrompt.replace(/\s+/g, " ").trim();
  const reasons: string[] = [];

  if (trimmed.length < 120) {
    reasons.push(
      "image_prompt is too short — add more concrete visual tokens (shapes, edges, palette dominance, one song-only rupture)."
    );
  }

  const line1 = firstLine(trimmed);
  if (!line1.includes(",")) {
    reasons.push(
      "first line must be one dense comma-separated phrase of visual nouns (no prose-only opening)."
    );
  } else if (commaTokenCount(line1) < 12) {
    reasons.push(
      `first comma-phrase should carry at least ~12 distinct tokens (got ${commaTokenCount(line1)}).`
    );
  }

  if (!hasHexColor(trimmed)) {
    reasons.push(
      "must name at least one hex from the style palette and state dominant vs accent coverage."
    );
  }

  const lower = trimmed.toLowerCase();
  for (const phrase of BANNED_SUBSTRINGS) {
    if (lower.includes(phrase)) {
      reasons.push(`remove vague filler / banned phrase: "${phrase}"`);
    }
  }
  for (const phrase of BANNED_LAYOUT_CLICHES) {
    if (lower.includes(phrase)) {
      reasons.push(`avoid stock layout clichés — replace "${phrase}" with song-specific spatial bias.`);
    }
  }

  const mustMention = ["emotional arc", "rhythm", "geometry"] as const;
  const missingConcepts = mustMention.filter((t) => !lower.includes(t));
  if (missingConcepts.length > 0) {
    reasons.push(
      `after the keyword line, reference this song's emotional arc, how rhythm becomes geometry, and spatial structure (missing: ${missingConcepts.join(", ")}).`
    );
  }

  return { ok: reasons.length === 0, reasons };
}

export function formatQualityRepairHint(reasons: string[]): string {
  return `The image_prompt failed quality checks. Fix and resend ONLY the two XML blocks.\nIssues:\n${reasons.map((r) => `- ${r}`).join("\n")}`;
}
