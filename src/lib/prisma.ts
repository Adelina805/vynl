import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sqliteAdapter: any;
};

/** Vercel / dashboard env values sometimes include wrapping quotes — strip them. */
function normalizeEnvValue(raw: string | undefined): string {
  if (raw === undefined) return "";
  let s = raw.trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

function getDatabaseUrl(): string {
  const url = normalizeEnvValue(process.env.DATABASE_URL);
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Local example: file:./data/gallery/dev.db · Vercel: use Turso (libsql://…) — see README."
    );
  }
  return url;
}

function useLibsqlDriver(url: string): boolean {
  const d = process.env.DATABASE_DRIVER?.trim().toLowerCase();
  if (d === "libsql") return true;
  if (d === "sqlite" || d === "better-sqlite3" || d === "file") return false;

  const u = url.toLowerCase();
  return (
    u.startsWith("libsql://") ||
    (u.startsWith("https://") &&
      (u.includes("libsql") || u.includes("turso.io")))
  );
}

function libsqlAuthToken(): string {
  const token = normalizeEnvValue(
    process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN
  );
  if (!token) {
    throw new Error(
      "Remote libSQL/Turso requires DATABASE_AUTH_TOKEN (or TURSO_AUTH_TOKEN)."
    );
  }
  return token;
}

/**
 * Load native better-sqlite3 only for local `file:` databases.
 * Importing it on Vercel (libsql-only deploys) can break serverless bundles.
 */
function createBetterSqliteAdapter(url: string) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3") as {
    PrismaBetterSqlite3: new (
      a: { url: string },
      b?: { shadowDatabaseUrl?: string }
    ) => object;
  };

  return (
    globalForPrisma.sqliteAdapter ??
    new PrismaBetterSqlite3(
      { url },
      { shadowDatabaseUrl: ":memory:" }
    )
  );
}

function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const url = getDatabaseUrl();
  const libsql = useLibsqlDriver(url);

  const adapter = libsql
    ? new PrismaLibSql({
        url,
        authToken: libsqlAuthToken(),
      })
    : (() => {
        const a = createBetterSqliteAdapter(url);
        globalForPrisma.sqliteAdapter = a;
        return a;
      })();

  const client = new PrismaClient({
    adapter: adapter as never,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
  globalForPrisma.prisma = client;
  return client;
}

/**
 * Lazy Prisma client: connecting only happens on first query.
 * This lets `next build` succeed when `DATABASE_URL` is not injected at build time.
 *
 * - **Local:** `file:./…` with `better-sqlite3`
 * - **Vercel / serverless:** `libsql://…` (Turso) + `DATABASE_AUTH_TOKEN`
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
