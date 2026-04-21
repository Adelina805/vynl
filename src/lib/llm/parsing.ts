import type { ArtDirection } from "@/lib/llm/types";

/** Strip one outer ``` / ```xml fence if the model wrapped the reply. */
function stripOuterMarkdownFences(s: string): string {
  let t = s.trim();
  if (!t.startsWith("```")) return t;
  const firstNl = t.indexOf("\n");
  const body = firstNl === -1 ? t.slice(3) : t.slice(firstNl + 1);
  const close = body.lastIndexOf("```");
  const inner = close === -1 ? body : body.slice(0, close);
  return inner.trim();
}

function extractTaggedSection(normalized: string, tag: string): string | null {
  const openRe = new RegExp(`<\\s*${tag}\\s*>`, "i");
  const closeRe = new RegExp(`<\\s*/\\s*${tag}\\s*>`, "i");

  const openMatch = normalized.match(openRe);
  if (!openMatch || openMatch.index === undefined) return null;

  const start = openMatch.index + openMatch[0].length;
  const tail = normalized.slice(start);
  const closeMatch = tail.match(closeRe);

  if (closeMatch && closeMatch.index !== undefined) {
    const inner = tail.slice(0, closeMatch.index).trim();
    return inner.length ? inner : null;
  }

  // Unclosed tag (truncation): use remainder if it looks like real content.
  const inner = tail.trim();
  return inner.length >= 24 ? inner : null;
}

function tryAlternateImageTags(normalized: string): string | null {
  const alternates = [
    /<\s*image-prompt\s*>([\s\S]*?)<\s*\/\s*image-prompt\s*>/i,
    /<\s*ImagePrompt\s*>([\s\S]*?)<\s*\/\s*ImagePrompt\s*>/i,
    /<\s*flux_prompt\s*>([\s\S]*?)<\s*\/\s*flux_prompt\s*>/i,
  ];
  for (const re of alternates) {
    const m = normalized.match(re);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return null;
}

/** Everything after first </interpretation>, if the model skipped image_prompt tags. */
function tailAfterInterpretation(normalized: string): string | null {
  const m = normalized.match(/<\s*\/\s*interpretation\s*>/i);
  if (!m || m.index === undefined) return null;
  let tail = normalized.slice(m.index + m[0].length).trim();
  tail = stripOuterMarkdownFences(tail);
  tail = tail
    .replace(/^#+\s*image[_\s-]*prompt\s*:?\s*/i, "")
    .replace(/^image[_\s-]*prompt\s*:?\s*/i, "")
    .replace(/^<\s*image_prompt\s*>\s*/i, "")
    .replace(/\s*<\s*\/\s*image_prompt\s*>\s*$/i, "");
  tail = tail.replace(/^[\s:*\-–—]+/, "").trim();
  return tail.length >= 32 ? tail : null;
}

function tryJsonArtDirection(s: string): ArtDirection | null {
  const t = s.trim();
  if (!t.startsWith("{")) return null;
  try {
    const o = JSON.parse(t) as Record<string, unknown>;
    const ip = o.image_prompt ?? o.imagePrompt;
    const interp = o.interpretation ?? o.interpretation_text;
    if (typeof ip !== "string") return null;
    const imagePrompt = ip.trim();
    if (imagePrompt.length < 16) return null;
    const interpretation =
      typeof interp === "string" ? interp.trim() : "";
    return { interpretation, imagePrompt };
  } catch {
    return null;
  }
}

export function parseTaggedArtDirection(raw: string): ArtDirection | null {
  const normalized = stripOuterMarkdownFences(raw);

  const fromJson = tryJsonArtDirection(normalized);
  if (fromJson) return fromJson;

  let imagePrompt =
    extractTaggedSection(normalized, "image_prompt") ??
    tryAlternateImageTags(normalized) ??
    tailAfterInterpretation(normalized);

  if (!imagePrompt) return null;

  imagePrompt = imagePrompt.replace(/\s+/g, " ").trim();
  if (imagePrompt.length < 16) return null;

  let interpretation = extractTaggedSection(normalized, "interpretation") ?? "";
  interpretation = interpretation.replace(/\s+/g, " ").trim();

  return { interpretation, imagePrompt };
}
