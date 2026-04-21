import type { ArtDirection } from "@/lib/llm/types";

export function parseTaggedArtDirection(raw: string): ArtDirection | null {
  const interpretationMatch = raw.match(
    /<interpretation>([\s\S]*?)<\/interpretation>/
  );
  const imagePromptMatch = raw.match(/<image_prompt>([\s\S]*?)<\/image_prompt>/);

  if (!imagePromptMatch) {
    return null;
  }

  return {
    interpretation: interpretationMatch?.[1].trim() ?? "",
    imagePrompt: imagePromptMatch[1].trim(),
  };
}
