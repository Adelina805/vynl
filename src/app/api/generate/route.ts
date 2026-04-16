import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { fal } from "@fal-ai/client";
import { PROMPT_SYSTEM, buildUserPrompt } from "@/lib/prompts";
import type { ArtStyle, SpotifyTrack } from "@/types";

const anthropic = new Anthropic();

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

    // Step 1: Claude Haiku generates interpretation + image prompt (~1-2s, ~$0.001)
    const userPrompt = buildUserPrompt(track, style);
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: PROMPT_SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text =
      message.content.find((b) => b.type === "text")?.text ?? "";

    const interpretationMatch = text.match(
      /<interpretation>([\s\S]*?)<\/interpretation>/
    );
    const imagePromptMatch = text.match(
      /<image_prompt>([\s\S]*?)<\/image_prompt>/
    );

    if (!imagePromptMatch) {
      return Response.json(
        { error: "Failed to generate image concept." },
        { status: 500 }
      );
    }

    const interpretation = interpretationMatch?.[1].trim() ?? "";
    const imagePrompt = imagePromptMatch[1].trim();

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

    return Response.json({ imageUrl, interpretation });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
