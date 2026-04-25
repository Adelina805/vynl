# Vynl

**Music → visual art.** Paste a Spotify track URL, pick a style, and get a square artwork plus a short interpretation. Track metadata (and optional audio features) feed an OpenAI-compatible chat model for art direction; images are generated with [fal.ai](https://fal.ai) Flux.

Built with **Next.js** (App Router), **React 18**, **TypeScript**, and **Tailwind CSS**.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Create `.env.local` in the project root (Next.js loads it automatically).

| Variable | Required | Purpose |
|----------|----------|---------|
| `SPOTIFY_CLIENT_ID` | Yes | Spotify Web API (client credentials) |
| `SPOTIFY_CLIENT_SECRET` | Yes | Same |
| `FAL_KEY` | Yes | fal.ai API key for image generation |
| `LLM_API_KEY` or `OPENAI_API_KEY` | Yes | OpenAI-compatible `/v1/chat/completions` |
| `LLM_BASE_URL` / `OPENAI_BASE_URL` | No | Defaults to `https://api.openai.com/v1` |
| `LLM_MODEL` / `OPENAI_MODEL` | No | Defaults to `gpt-4o-mini` |

Optional tuning (see `src/app/api/generate/route.ts` and `src/lib/llm`): `FAL_FLUX_MODEL`, `FAL_INFERENCE_STEPS`, `FAL_GUIDANCE_SCALE`, `FAL_ESTIMATE_PER_IMAGE_USD`, `LLM_PRICE_INPUT_PER_1M`, `LLM_PRICE_OUTPUT_PER_1M`, and others noted in dev cost panels.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |

## Spotify setup

Use a [Spotify Developer](https://developer.spotify.com/dashboard) app with **Client ID** and **Client Secret**. The app uses the client-credentials flow (no user login) to read public track and audio-feature data.
