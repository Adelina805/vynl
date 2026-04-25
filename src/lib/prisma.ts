import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

function databaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Example: file:./data/gallery/dev.db"
    );
  }
  return url;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  sqliteAdapter: PrismaBetterSqlite3 | undefined;
};

const adapter =
  globalForPrisma.sqliteAdapter ??
  new PrismaBetterSqlite3(
    { url: databaseUrl() },
    { shadowDatabaseUrl: ":memory:" }
  );

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.sqliteAdapter = adapter;
}
