import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

// Enable WebSocket connections for Neon serverless driver
// This eliminates cold-start TCP handshake latency (~100-300ms savings)
neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true; // Use HTTP fetch for queries when possible (faster for short queries)

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    // Fallback for build time (prisma generate)
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }

  // Use Neon serverless driver with connection pooling for production
  // This uses WebSocket connections which survive across invocations
  // and eliminates cold-start TCP/TLS handshake overhead
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
