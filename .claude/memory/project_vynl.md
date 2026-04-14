---
name: Vynl project overview
description: Architecture, stack, and key decisions for the Vynl music-to-visual-art web app
type: project
---

**Project:** Vynl — music to visual art generator at /Users/adelinamartinez/vynl

**Stack:** Next.js (latest, App Router), TypeScript, Tailwind CSS, Anthropic SDK (`claude-opus-4-6`), Spotify Web API (Client Credentials flow)

**Key architecture decisions:**
- Spotify: Client Credentials auth — no user login. Tries `audio-features` endpoint but gracefully degrades if unavailable (deprecated for new apps Nov 2024).
- Art generation: Claude `claude-opus-4-6` with `thinking: adaptive`, streaming via ReadableStream. Outputs tagged `<interpretation>` + `<artwork><svg>` format parsed client-side.
- Five curated art styles with detailed system prompt engineering: grunge-y2k, chrome-melancholy, distressed-editorial, cerebral-experimental, dream-wreckage.
- UI: dark gallery aesthetic, monospace font, minimal chrome.

**How to apply:** When the user asks about extending or debugging Vynl, reference this structure. API routes at `src/app/api/{extract,generate}/route.ts`. Prompt engineering in `src/lib/prompts.ts`.

**Env vars needed:** `ANTHROPIC_API_KEY`, `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` — copy `.env.local.example` to `.env.local`.
