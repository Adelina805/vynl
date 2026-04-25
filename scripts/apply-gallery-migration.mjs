/**
 * Apply the initial gallery schema to Turso / libSQL using DATABASE_URL + token from .env.
 * Prisma Migrate cannot target libsql:// (P1013), so this is the supported one-liner.
 *
 * Usage: npm run db:apply-turso
 */
import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env") });

function stripQuotes(s) {
  if (!s) return "";
  let t = String(s).trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    t = t.slice(1, -1).trim();
  }
  return t;
}

const url = stripQuotes(process.env.DATABASE_URL);
const authToken = stripQuotes(
  process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN
);

const isTurso =
  url.startsWith("libsql://") ||
  (url.startsWith("https://") &&
    (url.includes("turso.io") || url.includes("libsql")));

if (!url || !isTurso) {
  console.error(
    "DATABASE_URL must be Turso (libsql:// or https://*.turso.io).\n" +
      "For local file: SQLite run: npx prisma migrate deploy"
  );
  process.exit(1);
}

if (!authToken) {
  console.error("Set DATABASE_AUTH_TOKEN or TURSO_AUTH_TOKEN in .env");
  process.exit(1);
}

const migrationPath = resolve(
  process.cwd(),
  "prisma/migrations/20260425010852_init_gallery/migration.sql"
);

if (!existsSync(migrationPath)) {
  console.error("Missing migration file:", migrationPath);
  process.exit(1);
}

let sql = readFileSync(migrationPath, "utf8").trim();
// Idempotent: safe to run more than once
sql = sql.replace(
  /^CREATE TABLE "GalleryPiece"/m,
  'CREATE TABLE IF NOT EXISTS "GalleryPiece"'
);
// libSQL / SQLite: JSON is widely supported; JSONB may fail on some builds
sql = sql.replace(/\bJSONB\b/g, "JSON");

const client = createClient({ url, authToken });

try {
  await client.execute(sql);
  console.log("OK: GalleryPiece table is ready on your Turso database.");
} catch (e) {
  const msg = String(e);
  if (
    msg.includes("already exists") ||
    msg.includes("duplicate") ||
    msg.includes("SQLITE_UNKNOWN") && msg.includes("exists")
  ) {
    console.log("GalleryPiece already exists — nothing to do.");
    process.exit(0);
  }
  console.error("Migration failed:", e);
  process.exit(1);
}
