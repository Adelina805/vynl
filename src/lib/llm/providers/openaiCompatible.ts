import {
  assessImagePromptQuality,
  assessInterpretationQuality,
  formatQualityRepairHint,
  mergeQualityResults,
} from "@/lib/llm/artDirectionQuality";
import { estimateLlmCostUsd } from "@/lib/llm/estimateLlmCost";
import { parseTaggedArtDirection } from "@/lib/llm/parsing";
import { buildUserPrompt, PROMPT_SYSTEM } from "@/lib/prompts";
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Best-effort parse of OpenAI-style and plain error bodies. */
function summarizeErrorBody(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  try {
    const j = JSON.parse(trimmed) as {
      error?: { message?: string; code?: string; type?: string };
      message?: string;
    };
    const msg = j.error?.message ?? j.message;
    const code = j.error?.code ?? j.error?.type;
    if (msg && code) return `${msg} (${code})`;
    if (msg) return msg;
  } catch {
    /* ignore */
  }
  return trimmed.length > 280 ? `${trimmed.slice(0, 280)}…` : trimmed;
}

function retryAfterMs(response: Response, attempt: number): number {
  const header = response.headers.get("retry-after");
  if (header) {
    const seconds = parseInt(header, 10);
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.min(seconds * 1000, 60_000);
    }
  }
  return Math.min(1000 * 2 ** attempt, 10_000);
}

function shouldRetryStatus(status: number): boolean {
  return status === 429 || status === 503;
}

function formatLlmFailure(status: number, detail: string): string {
  const hint =
    status === 429
      ? " Often caused by rate limits or exceeded quota — wait a minute, check billing/limits, or use a lighter model."
      : "";
  const suffix = detail ? ` ${detail}` : "";
  return `LLM request failed (${status}).${hint}${suffix}`;
}

export class OpenAiCompatibleArtDirectionProvider
  implements ArtDirectionProvider
{
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly model: string
  ) {}

  private static envFloat(name: string, fallback: number): number {
    const raw = process.env[name];
    if (raw === undefined) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  }

  private static maxRetries(): number {
    const raw = process.env.LLM_RETRY_MAX;
    if (raw === undefined) return 3;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 && n <= 8 ? n : 3;
  }

  /** Extra LLM round-trips when image_prompt is generic or structurally weak. */
  private static maxQualityRepairs(): number {
    const raw = process.env.LLM_QUALITY_REPAIR_MAX;
    if (raw === undefined) return 4;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 && n <= 6 ? n : 4;
  }

  private async postChatCompletion(
    userPrompt: string
  ): Promise<ChatCompletionResponse> {
    const maxRetries = OpenAiCompatibleArtDirectionProvider.maxRetries();
    let lastDetail = "";

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
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
          max_tokens: 2568,
          temperature: OpenAiCompatibleArtDirectionProvider.envFloat("LLM_TEMPERATURE", 0.82),
          top_p: OpenAiCompatibleArtDirectionProvider.envFloat("LLM_TOP_P", 0.9),
        }),
      });

      if (response.ok) {
        return (await response.json()) as ChatCompletionResponse;
      }

      const bodyText = await response.text();
      lastDetail = summarizeErrorBody(bodyText);

      if (
        shouldRetryStatus(response.status) &&
        attempt < maxRetries
      ) {
        await delay(retryAfterMs(response, attempt));
        continue;
      }

      throw new Error(formatLlmFailure(response.status, lastDetail));
    }

    throw new Error(formatLlmFailure(429, lastDetail));
  }

  async generate({
    track,
    style,
  }: GenerateArtDirectionInput): Promise<GenerateArtDirectionOutput> {
    const userPrompt = buildUserPrompt(track, style);
    let data = await this.postChatCompletion(userPrompt);
    let content = data.choices?.[0]?.message?.content ?? "";
    let parsed = parseTaggedArtDirection(content);

    if (!parsed) {
      const repairUser = `${userPrompt}

---
The last reply was not parseable. Output ONLY two blocks in order, with nothing else:
1) <interpretation>…</interpretation> — THREE sentences that name "${track.title}" AND ${track.artist.split(",")[0]?.trim()}, and cite verse/intro/bridge/drum/groove/BPM/production detail (facts, not moods).
2) <image_prompt>…</image_prompt> — line 1 comma-heavy fragments + dominance hex tags; prose after MUST include verbatim substrings emotional arc AND rhythm AND (geometry OR geometric). Close with ONE contrast sentence vs another plausible hit/genre-peer. Repeat medium tags flat 2D.
Use lowercase tag names; image_prompt contains underscore; no markdown fences, no preamble.`;

      data = await this.postChatCompletion(repairUser);
      content = data.choices?.[0]?.message?.content ?? "";
      parsed = parseTaggedArtDirection(content);
    }

    if (!parsed) {
      throw new Error("LLM response did not include a valid <image_prompt>.");
    }

    const maxQualityRepairs = OpenAiCompatibleArtDirectionProvider.maxQualityRepairs();
    let combined = mergeQualityResults(
      assessInterpretationQuality(parsed.interpretation, track),
      assessImagePromptQuality(parsed.imagePrompt)
    );
    let qualityAttempts = 0;

    while (!combined.ok && qualityAttempts < maxQualityRepairs) {
      qualityAttempts += 1;
      const repairUser = `${userPrompt}

---
${formatQualityRepairHint(combined.reasons)}

Output ONLY two blocks in order: <interpretation>…</interpretation> then <image_prompt>…</image_prompt>.
Tags lowercase; image_prompt underscore; prose must include literal emotional arc, rhythm, geometric or geometry wording, plus ONE contrast-vs-another-hit sentence. Prefer newline OR period after comma-heavy opener before prose begins. No markdown fences, no preamble.`;

      data = await this.postChatCompletion(repairUser);
      content = data.choices?.[0]?.message?.content ?? "";
      const again = parseTaggedArtDirection(content);
      if (!again) {
        continue;
      }
      parsed = again;
      combined = mergeQualityResults(
        assessInterpretationQuality(parsed.interpretation, track),
        assessImagePromptQuality(parsed.imagePrompt)
      );
    }

    if (!combined.ok) {
      throw new Error(
        `art direction failed quality checks after repair: ${combined.reasons.join("; ")}`
      );
    }

    const inputTokens = data.usage?.prompt_tokens;
    const outputTokens = data.usage?.completion_tokens;

    return {
      direction: parsed,
      usage: {
        provider: "openai-compatible",
        model: this.model,
        inputTokens,
        outputTokens,
        estimatedCostUsd: estimateLlmCostUsd(inputTokens, outputTokens),
      },
    };
  }
}
