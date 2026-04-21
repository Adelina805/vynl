---
name: Vynl project overview
description: Architecture, stack, and key decisions for the Vynl music-to-visual-art web app
type: project
---

**Project:** Vynl — music to visual art generator at /Users/adelinamartinez/vynl

**Stack:** Next.js (latest, App Router), TypeScript, Tailwind CSS, provider-agnostic LLM module (`template` default, `openai-compatible` optional), Spotify Web API (Client Credentials flow)

**Key architecture decisions:**
- Spotify: Client Credentials auth — no user login. Tries `audio-features` endpoint but gracefully degrades if unavailable (deprecated for new apps Nov 2024).
- Art generation: two-step pipeline where an LLM generates `<interpretation>` + `<image_prompt>`, then fal.ai FLUX Schnell generates the image. LLM provider is swappable via `src/lib/llm`.
- Five curated art styles with detailed system prompt engineering: grunge-y2k, chrome-melancholy, distressed-editorial, cerebral-experimental, dream-wreckage.
- UI: dark gallery aesthetic, monospace font, minimal chrome.

**How to apply:** When the user asks about extending or debugging Vynl, reference this structure. API routes at `src/app/api/{extract,generate}/route.ts`. Prompt engineering in `src/lib/prompts.ts`.

**Env vars needed:** `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `FAL_KEY` (plus optional `LLM_PROVIDER`, `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` for non-template providers) — copy `.env.local.example` to `.env.local`.
