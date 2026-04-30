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

Use a **single** file, **`.env`**, in the project root. Next.js and Prisma both load it. Copy [`.env.example`](.env.example) to `.env` and fill in values (`.env` is gitignored).

| Variable | Required | Purpose |
|----------|----------|---------|
| `SPOTIFY_CLIENT_ID` | Yes | Spotify Web API (client credentials) |
| `SPOTIFY_CLIENT_SECRET` | Yes | Same |
| `FAL_KEY` | Yes | fal.ai API key for image generation |
| `LLM_API_KEY` or `OPENAI_API_KEY` | Yes | OpenAI-compatible `/v1/chat/completions` |
| `LLM_BASE_URL` / `OPENAI_BASE_URL` | No | Defaults to `https://api.openai.com/v1` |
| `LLM_MODEL` / `OPENAI_MODEL` | No | Defaults to `gpt-4o-mini` |
| `DATABASE_URL` | Yes | Gallery DB: local `file:./data/gallery/dev.db` **or** remote [Turso](https://turso.tech) `libsql://…` |
| `DATABASE_AUTH_TOKEN` | With Turso | libSQL auth token (same as `TURSO_AUTH_TOKEN`) |
| `DATABASE_DRIVER` | No | `libsql` or `sqlite` if URL-based detection is wrong |
| `GALLERY_DATA_ROOT` | No | Override directory for stored images (default `./data/gallery`; local `file:` DB only) |
| `GALLERY_ADMIN_SECRET` | No | Bearer token for `DELETE /api/gallery/[id]` (admin cleanup) |

Generations are copied to disk when possible and listed at `/gallery`. On serverless hosts without a writable data directory, rows still save to the database and thumbnails fall back to redirecting to the original fal URL when the file is missing (those CDN links may expire over time). Optional tuning (see `src/app/api/generate/route.ts` and `src/lib/llm`): `GENERATION_QUALITY_TIER` (`balanced` default → `fal-ai/flux/dev`, or `fast` → Schnell), `GENERATION_SEED_MODE` (`random` vs `stable` for reproducible seeds), optional JSON body field `variationNonce` to pin a seed, `FAL_FLUX_MODEL`, `FAL_INFERENCE_STEPS`, `FAL_GUIDANCE_SCALE`, `FAL_ESTIMATE_PER_IMAGE_USD`, `LLM_QUALITY_REPAIR_MAX`, `LLM_PRICE_INPUT_PER_1M`, `LLM_PRICE_OUTPUT_PER_1M`, and others noted in dev cost panels.

Run `npm test` to execute prompt-quality unit checks (Node experimental TypeScript strip).

### Deploying the gallery (e.g. Vercel)

1. Create a Turso database and get a `libsql://…` URL plus token (`turso db tokens create` or the dashboard).
2. In Vercel → Settings → Environment Variables, set **`DATABASE_URL`**, **`DATABASE_AUTH_TOKEN`**, and your existing API keys for **Production** (and Preview if needed).
3. **Create tables on Turso:** Prisma Migrate cannot run against `libsql://` (you would see **P1013**). With `DATABASE_URL` and `DATABASE_AUTH_TOKEN` set in `.env`, run:
   ```bash
   npm run db:apply-turso
   ```
   That creates the `GalleryPiece` table (idempotent). Alternatively, use the Turso CLI: `turso db shell YOUR_DB_NAME < prisma/migrations/20260425010852_init_gallery/migration.sql`
   When you add new migrations later, apply each new `migration.sql` the same way (or use a local `file:` DB with `PRISMA_MIGRATE_DATABASE_URL` for `migrate dev`, then pipe the new file to Turso).
4. Optional: **`npx prisma migrate deploy`** only targets the URL in [`prisma.config.ts`](prisma.config.ts). If `DATABASE_URL` is Turso, the CLI uses a local `file:./data/gallery/migrate.db` instead — that keeps Prisma’s migration history on your machine; it does **not** replace step 3 for the remote database.
5. Redeploy. The production build does not require `DATABASE_URL`; the **runtime** does. Do **not** use a `file:` SQLite path on Vercel for the **app** — it is not a persistent volume.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |
| `npm test` | Prompt-quality checks (Node test runner) |

## Spotify setup

Use a [Spotify Developer](https://developer.spotify.com/dashboard) app with **Client ID** and **Client Secret**. The app uses the client-credentials flow (no user login) to read public track and audio-feature data.
