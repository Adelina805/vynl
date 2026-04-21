import { OpenAiCompatibleArtDirectionProvider } from "@/lib/llm/providers/openaiCompatible";
import { TemplateArtDirectionProvider } from "@/lib/llm/providers/template";
import type { ArtDirectionProvider } from "@/lib/llm/types";

export function createArtDirectionProvider(): ArtDirectionProvider {
  const provider = process.env.LLM_PROVIDER?.toLowerCase() ?? "template";

  if (provider === "openai-compatible") {
    const baseUrl = process.env.LLM_BASE_URL;
    const apiKey = process.env.LLM_API_KEY;
    const model = process.env.LLM_MODEL;

    if (!baseUrl || !apiKey || !model) {
      throw new Error(
        "LLM_PROVIDER=openai-compatible requires LLM_BASE_URL, LLM_API_KEY, and LLM_MODEL."
      );
    }

    return new OpenAiCompatibleArtDirectionProvider(baseUrl, apiKey, model);
  }

  return new TemplateArtDirectionProvider();
}

export type { ArtDirectionProvider, LlmUsage } from "@/lib/llm/types";
