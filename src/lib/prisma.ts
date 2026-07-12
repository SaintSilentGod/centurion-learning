import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";

function poolMaxConnections(): number {
  const fromEnv = Number(process.env.DATABASE_POOL_MAX);
  if (Number.isFinite(fromEnv) && fromEnv > 0) {
    return fromEnv;
  }
  // Serverless: keep the pool small to avoid exhausting Postgres max_connections.
  return process.env.NODE_ENV === "production" ? 3 : 10;
}

function createPgPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL не задан");
  }

  return new Pool({
    connectionString,
    max: poolMaxConnections(),
    idleTimeoutMillis: 10_000,
  });
}

const globalForDb = globalThis as unknown as {
  pgPool: Pool | undefined;
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const pool = globalForDb.pgPool ?? createPgPool();
  if (!globalForDb.pgPool) {
    globalForDb.pgPool = pool;
  }

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForDb.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.prisma = prisma;
}

export function createSeedPrismaClient(): PrismaClient {
  return createPrismaClient();
}
