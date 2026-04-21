import type { ArtStyle, SpotifyTrack } from "@/types";

export interface ArtDirection {
  interpretation: string;
  imagePrompt: string;
}

export interface LlmUsage {
  provider: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostUsd?: number;
}

export interface GenerateArtDirectionInput {
  track: SpotifyTrack;
  style: ArtStyle;
}

export interface GenerateArtDirectionOutput {
  direction: ArtDirection;
  usage: LlmUsage;
}

export interface ArtDirectionProvider {
  generate(input: GenerateArtDirectionInput): Promise<GenerateArtDirectionOutput>;
}
