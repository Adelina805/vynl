import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  sqliteAdapter: PrismaBetterSqlite3 | undefined;
};

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Example: file:./data/gallery/dev.db"
    );
  }
  return url;
}

function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const adapter =
    globalForPrisma.sqliteAdapter ??
    new PrismaBetterSqlite3(
      { url: getDatabaseUrl() },
      { shadowDatabaseUrl: ":memory:" }
    );
  globalForPrisma.sqliteAdapter = adapter;

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
  globalForPrisma.prisma = client;
  return client;
}

/**
 * Lazy Prisma client: connecting only happens on first query.
 * This lets `next build` succeed when `DATABASE_URL` is not injected at build time
 * (e.g. some Vercel setups); set `DATABASE_URL` for runtime.
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
