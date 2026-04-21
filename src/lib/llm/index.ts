import { OpenAiCompatibleArtDirectionProvider } from "@/lib/llm/providers/openaiCompatible";
import type { ArtDirectionProvider } from "@/lib/llm/types";

const DEFAULT_OPENAI_BASE = "https://api.openai.com/v1";
const DEFAULT_CHAT_MODEL = "gpt-4o-mini";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Resolves OpenAI-compatible chat credentials. LLM_* wins; otherwise OPENAI_* is used.
 * With only OPENAI_API_KEY set, defaults match the public OpenAI API and gpt-4o-mini.
 */
export type LlmApiKeySource = "LLM_API_KEY" | "OPENAI_API_KEY";

export function resolveArtDirectionLlmConfig(): {
  baseUrl: string;
  apiKey: string;
  model: string;
  apiKeySource: LlmApiKeySource;
} {
  const fromLlm = process.env.LLM_API_KEY?.trim();
  const fromOpenai = process.env.OPENAI_API_KEY?.trim();
  const apiKey = fromLlm ?? fromOpenai;
  if (!apiKey) {
    throw new Error(
      "Art direction needs an API key: set LLM_API_KEY or OPENAI_API_KEY in .env.local (OpenAI-compatible /chat/completions)."
    );
  }

  const baseRaw =
    process.env.LLM_BASE_URL ??
    process.env.OPENAI_BASE_URL ??
    DEFAULT_OPENAI_BASE;
  const baseUrl = normalizeBaseUrl(baseRaw.trim());

  const model = (
    process.env.LLM_MODEL ??
    process.env.OPENAI_MODEL ??
    DEFAULT_CHAT_MODEL
  ).trim();

  const apiKeySource: LlmApiKeySource = fromLlm ? "LLM_API_KEY" : "OPENAI_API_KEY";

  return { baseUrl, apiKey, model, apiKeySource };
}

export function createArtDirectionProvider(): ArtDirectionProvider {
  const { baseUrl, apiKey, model } = resolveArtDirectionLlmConfig();
  return new OpenAiCompatibleArtDirectionProvider(baseUrl, apiKey, model);
}

export type { ArtDirectionProvider, LlmUsage } from "@/lib/llm/types";
