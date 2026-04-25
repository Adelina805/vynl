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

Create `.env.local` in the project root (Next.js loads it automatically). Prisma also reads a root `.env` for `DATABASE_URL` (see [`.env.example`](.env.example)); you can duplicate `DATABASE_URL` into `.env.local` so one file covers the app.

| Variable | Required | Purpose |
|----------|----------|---------|
| `SPOTIFY_CLIENT_ID` | Yes | Spotify Web API (client credentials) |
| `SPOTIFY_CLIENT_SECRET` | Yes | Same |
| `FAL_KEY` | Yes | fal.ai API key for image generation |
| `LLM_API_KEY` or `OPENAI_API_KEY` | Yes | OpenAI-compatible `/v1/chat/completions` |
| `LLM_BASE_URL` / `OPENAI_BASE_URL` | No | Defaults to `https://api.openai.com/v1` |
| `LLM_MODEL` / `OPENAI_MODEL` | No | Defaults to `gpt-4o-mini` |
| `DATABASE_URL` | Yes | SQLite for the gallery, e.g. `file:./data/gallery/dev.db` |
| `GALLERY_DATA_ROOT` | No | Override directory for stored images (default `./data/gallery`) |
| `GALLERY_ADMIN_SECRET` | No | Bearer token for `DELETE /api/gallery/[id]` (admin cleanup) |

Generations are copied to disk and listed at `/gallery`. Optional tuning (see `src/app/api/generate/route.ts` and `src/lib/llm`): `FAL_FLUX_MODEL`, `FAL_INFERENCE_STEPS`, `FAL_GUIDANCE_SCALE`, `FAL_ESTIMATE_PER_IMAGE_USD`, `LLM_PRICE_INPUT_PER_1M`, `LLM_PRICE_OUTPUT_PER_1M`, and others noted in dev cost panels.

**Vercel:** Configure `DATABASE_URL` (and your other secrets) in the dashboard so they exist at **runtime**. The production build does not need `DATABASE_URL` to finish. A `file:` SQLite path still will not give you a durable gallery on serverless (ephemeral disk); for real deployments use a hosted SQLite-compatible DB (for example Turso) and object storage for images, or run the app on a host with a persistent volume.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |

## Spotify setup

Use a [Spotify Developer](https://developer.spotify.com/dashboard) app with **Client ID** and **Client Secret**. The app uses the client-credentials flow (no user login) to read public track and audio-feature data.
