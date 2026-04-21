import { NextRequest } from "next/server";
import { fal } from "@fal-ai/client";
import { createArtDirectionProvider } from "@/lib/llm";
import type { ArtStyle, SpotifyTrack } from "@/types";

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
    const { track, style } = body as { track: SpotifyTrack; style: ArtStyle };

    if (!track || !style) {
      return Response.json(
        { error: "Missing 'track' or 'style' field." },
        { status: 400 }
      );
    }

    // Step 1: Provider-agnostic art-direction generation.
    const artDirectionProvider = createArtDirectionProvider();
    const { direction, usage } = await artDirectionProvider.generate({ track, style });
    const interpretation = direction.interpretation;
    const imagePrompt = direction.imagePrompt;

    const falCost = 0.003; // flux/schnell flat rate

    // Step 2: fal.ai FLUX Schnell generates the image (~2-4s, ~$0.003)
    const falResult = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: imagePrompt,
        image_size: "square_hd",
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
      },
    }) as { data: { images: Array<{ url: string }> } };

    const imageUrl = falResult.data.images?.[0]?.url;
    if (!imageUrl) {
      return Response.json(
        { error: "Image generation failed — no image returned." },
        { status: 500 }
      );
    }

    return Response.json({
      imageUrl,
      interpretation,
      _cost: {
        llmProvider: usage.provider,
        llmModel: usage.model,
        llmInputTokens: usage.inputTokens ?? null,
        llmOutputTokens: usage.outputTokens ?? null,
        llmCost: usage.estimatedCostUsd ?? null,
        falCost,
        total: +((usage.estimatedCostUsd ?? 0) + falCost).toFixed(5),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
