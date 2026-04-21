import { buildUserPrompt, PROMPT_SYSTEM } from "@/lib/prompts";
import { parseTaggedArtDirection } from "@/lib/llm/parsing";
import type {
  ArtDirectionProvider,
  GenerateArtDirectionInput,
  GenerateArtDirectionOutput,
} from "@/lib/llm/types";

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
}

export class OpenAiCompatibleArtDirectionProvider
  implements ArtDirectionProvider
{
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly model: string
  ) {}

  async generate({
    track,
    style,
  }: GenerateArtDirectionInput): Promise<GenerateArtDirectionOutput> {
    const userPrompt = buildUserPrompt(track, style);
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: PROMPT_SYSTEM },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM request failed with status ${response.status}.`);
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content ?? "";
    const parsed = parseTaggedArtDirection(content);

    if (!parsed) {
      throw new Error("LLM response did not include a valid <image_prompt>.");
    }

    return {
      direction: parsed,
      usage: {
        provider: "openai-compatible",
        model: this.model,
        inputTokens: data.usage?.prompt_tokens,
        outputTokens: data.usage?.completion_tokens,
      },
    };
  }
}
