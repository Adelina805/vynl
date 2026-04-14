import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/prompts";
import type { ArtStyle, SpotifyTrack } from "@/types";

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { track, style } = body as { track: SpotifyTrack; style: ArtStyle };

    if (!track || !style) {
      return new Response(
        JSON.stringify({ error: "Missing 'track' or 'style' field." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const userPrompt = buildUserPrompt(track, style);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const anthropicStream = client.messages.stream({
            model: "claude-opus-4-6",
            max_tokens: 8192,
            thinking: { type: "adaptive" },
            system: SYSTEM_PROMPT,
            messages: [{ role: "user", content: userPrompt }],
          });

          for await (const event of anthropicStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }

          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Generation failed";
          controller.enqueue(encoder.encode(`\n<error>${message}</error>`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
