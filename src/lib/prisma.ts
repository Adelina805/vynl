import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  sqliteAdapter: PrismaBetterSqlite3 | undefined;
};

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
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
  const token =
    process.env.DATABASE_AUTH_TOKEN?.trim() ||
    process.env.TURSO_AUTH_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "Remote libSQL/Turso requires DATABASE_AUTH_TOKEN (or TURSO_AUTH_TOKEN)."
    );
  }
  return token;
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
    : globalForPrisma.sqliteAdapter ??
      new PrismaBetterSqlite3(
        { url },
        { shadowDatabaseUrl: ":memory:" }
      );

  if (!libsql) {
    globalForPrisma.sqliteAdapter = adapter as PrismaBetterSqlite3;
  }

  const client = new PrismaClient({
    adapter,
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
