import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  let connectionString = process.env.DATABASE_URL;

  if (connectionString) {
    // Strip accidental wrapping quotes (single or double) from UI environment variables
    connectionString = connectionString.trim().replace(/^["']|["']$/g, "");
  }

  if (!connectionString) {
    // Fallback for build time (prisma generate)
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }

  // Only use the Neon serverless adapter if connecting to a Neon database
  if (connectionString.includes("neon.tech")) {
    const adapter = new PrismaNeon({ connectionString });
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }

  // Fallback to standard native TCP PrismaClient for DigitalOcean, Docker, or other standard PostgreSQL servers
  return new PrismaClient({
    datasourceUrl: connectionString,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
