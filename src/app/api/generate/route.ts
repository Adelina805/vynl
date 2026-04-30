import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { fal } from "@fal-ai/client";
import { resolveArtDirectionLlmConfig } from "@/lib/llm";
import { OpenAiCompatibleArtDirectionProvider } from "@/lib/llm/providers/openaiCompatible";
import { buildFluxImagePrompt, stableUint32 } from "@/lib/prompts";
import { persistGalleryPiece } from "@/lib/gallery/persist";
import type { ArtStyle, GalleryCostSnapshot, SpotifyTrack } from "@/types";

export const runtime = "nodejs";

type GenerationQualityTier = "balanced" | "fast";
type GenerationSeedMode = "random" | "stable";

function clampInt(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function parsePositiveFloat(raw: string | undefined, fallback: number): number {
  if (raw === undefined) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function llmHostFromBaseUrl(baseUrl: string): string {
  try {
    return new URL(baseUrl).hostname;
  } catch {
    return baseUrl.length > 64 ? `${baseUrl.slice(0, 64)}…` : baseUrl;
  }
}

function resolveQualityTier(): GenerationQualityTier {
  const raw = process.env.GENERATION_QUALITY_TIER?.trim().toLowerCase();
  if (raw === "fast") return "fast";
  return "balanced";
}

function resolveSeedMode(): GenerationSeedMode {
  const raw = process.env.GENERATION_SEED_MODE?.trim().toLowerCase();
  if (raw === "stable") return "stable";
  return "random";
}

/** fal-ai/* id only — avoids arbitrary strings in subscribe(). */
function resolveFluxModelId(tier: GenerationQualityTier): string {
  const raw = process.env.FAL_FLUX_MODEL?.trim();
  if (raw && /^fal-ai\/[a-z0-9][a-z0-9\-/]*$/i.test(raw)) {
    return raw;
  }
  return tier === "fast" ? "fal-ai/flux/schnell" : "fal-ai/flux/dev";
}

function resolveVariationSalt(
  mode: GenerationSeedMode,
  trackId: string,
  style: ArtStyle,
  bodyNonce: string | undefined
): string {
  if (bodyNonce !== undefined && bodyNonce.trim().length > 0) {
    return bodyNonce.trim().slice(0, 256);
  }
  if (mode === "stable") {
    return `stable:${trackId}:${style}`;
  }
  return `random:${randomUUID()}`;
}

export async function POST(request: NextRequest) {
  const falKey = process.env.FAL_KEY;
  if (!falKey) {
    return Response.json(
      { error: "FAL_KEY environment variable is not set." },
      { status: 500 }
    );
  }

  fal.config({ credentials: falKey });

  try {
    const body = await request.json();
    const { track, style, variationNonce } = body as {
      track: SpotifyTrack;
      style: ArtStyle;
      /** Optional: same nonce + track + style reproduces the same Flux seed / jitter. */
      variationNonce?: string;
    };

    if (!track || !style) {
      return Response.json(
        { error: "Missing 'track' or 'style' field." },
        { status: 400 }
      );
    }

    const llmCfg = resolveArtDirectionLlmConfig();
    const artDirectionProvider = new OpenAiCompatibleArtDirectionProvider(
      llmCfg.baseUrl,
      llmCfg.apiKey,
      llmCfg.model
    );
    const { direction, usage } = await artDirectionProvider.generate({ track, style });
    const interpretation = direction.interpretation;
    const imagePrompt = direction.imagePrompt;

    const qualityTier = resolveQualityTier();
    const seedMode = resolveSeedMode();
    const variationSalt = resolveVariationSalt(seedMode, track.id, style, variationNonce);

    const fluxModelId = resolveFluxModelId(qualityTier);
    const isSchnell = fluxModelId.includes("schnell");
    const maxFluxSteps = isSchnell ? 12 : 48;
    const defaultFluxSteps = isSchnell ? 8 : qualityTier === "balanced" ? 30 : 28;

    const stepsEnv = process.env.FAL_INFERENCE_STEPS;
    const num_inference_steps = stepsEnv
      ? clampInt(parseInt(stepsEnv, 10), 1, maxFluxSteps)
      : defaultFluxSteps;

    const guidanceEnv = process.env.FAL_GUIDANCE_SCALE;
    const guidance_scale =
      guidanceEnv !== undefined && Number.isFinite(Number(guidanceEnv))
        ? Number(guidanceEnv)
        : 3.45 + (stableUint32(`${track.id}:${style}:cfg:${variationSalt}`) % 76) / 100;

    const seed =
      stableUint32(`${track.id}:${style}:flux:${variationSalt}`) % 2_147_483_647;

    const falCostDefault = qualityTier === "balanced" ? 0.025 : 0.003;
    const falCost = parsePositiveFloat(
      process.env.FAL_ESTIMATE_PER_IMAGE_USD,
      falCostDefault
    );

    const fluxPrompt = buildFluxImagePrompt(style, track, imagePrompt);

    const falResult = (await fal.subscribe(fluxModelId, {
      input: {
        prompt: fluxPrompt,
        image_size: "square_hd",
        num_inference_steps,
        num_images: 1,
        seed,
        guidance_scale,
        enable_safety_checker: true,
      },
    })) as { data: { images: Array<{ url: string }> } };

    const imageUrl = falResult.data.images?.[0]?.url;
    if (!imageUrl) {
      return Response.json(
        { error: "Image generation failed — no image returned." },
        { status: 500 }
      );
    }

    const llmCost = usage.estimatedCostUsd ?? null;
    const costNotes: string[] = [];
    if (llmCost === null) {
      costNotes.push(
        "LLM USD: set LLM_PRICE_INPUT_PER_1M and LLM_PRICE_OUTPUT_PER_1M (USD per 1M tokens) to estimate chat cost."
      );
    } else {
      costNotes.push("LLM USD: estimated from tokens × LLM_PRICE_* env.");
    }
    costNotes.push(
      "LLM: non-zero ↑↓ token counts mean /chat/completions returned usage — your API key was accepted (401 otherwise)."
    );
    if (usage.model.toLowerCase().includes("mini")) {
      costNotes.push(
        "Richer prompts: try LLM_MODEL=gpt-4o (or gpt-4.1) if gpt-4o-mini keeps compositions samey."
      );
    }
    costNotes.push(
      `FAL: tier ${qualityTier} · model ${fluxModelId} · ${num_inference_steps} steps (Schnell max 12; dev max 48). Override with FAL_FLUX_MODEL. Flat USD uses FAL_ESTIMATE_PER_IMAGE_USD (default scales with tier).`
    );
    costNotes.push(
      `Seed: mode ${seedMode} — same track+style yields new art each request unless GENERATION_SEED_MODE=stable or you POST variationNonce. LLM quality repairs: LLM_QUALITY_REPAIR_MAX.`
    );

    const isDev = process.env.NODE_ENV === "development";

    const _cost = {
      llmProvider: usage.provider,
      llmModel: usage.model,
      llmInputTokens: usage.inputTokens ?? null,
      llmOutputTokens: usage.outputTokens ?? null,
      llmCost,
      falCost,
      falFluxModel: fluxModelId,
      falInferenceSteps: num_inference_steps,
      falGuidanceScale: guidance_scale,
      falSeed: seed,
      generationSeedMode: seedMode,
      generationVariationSalt: variationSalt,
      generationQualityTier: qualityTier,
      total: +((llmCost ?? 0) + falCost).toFixed(5),
      costNotes,
      ...(isDev
        ? {
            llmHost: llmHostFromBaseUrl(llmCfg.baseUrl),
            llmApiKeySource: llmCfg.apiKeySource,
          }
        : {}),
    };

    const costForGallery: GalleryCostSnapshot = {
      llmProvider: _cost.llmProvider,
      llmModel: _cost.llmModel,
      llmInputTokens: _cost.llmInputTokens,
      llmOutputTokens: _cost.llmOutputTokens,
      llmCost: _cost.llmCost,
      falCost: _cost.falCost,
      falFluxModel: _cost.falFluxModel,
      falInferenceSteps: _cost.falInferenceSteps,
      falGuidanceScale: _cost.falGuidanceScale,
      falSeed: _cost.falSeed,
      generationSeedMode: _cost.generationSeedMode,
      generationVariationSalt: _cost.generationVariationSalt,
      generationQualityTier: _cost.generationQualityTier,
      total: _cost.total,
      costNotes: _cost.costNotes,
    };

    let galleryId: string | undefined;
    let persistedImageUrl: string | undefined;
    try {
      const saved = await persistGalleryPiece({
        falImageUrl: imageUrl,
        style,
        track,
        interpretation,
        imagePrompt,
        fluxPrompt,
        cost: costForGallery,
      });
      galleryId = saved.id;
      persistedImageUrl = saved.persistedImageUrl;
    } catch (persistErr) {
      console.error("[gallery] persist failed:", persistErr);
    }

    return Response.json({
      imageUrl,
      interpretation,
      ...(galleryId !== undefined ? { galleryId } : {}),
      ...(persistedImageUrl !== undefined ? { persistedImageUrl } : {}),
      _cost,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
