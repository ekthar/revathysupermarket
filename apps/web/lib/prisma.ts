import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client — configured for Oracle VM with self-hosted PostgreSQL.
 *
 * Architecture:
 * - Direct TCP connection to PostgreSQL on Oracle Cloud VM
 * - Connection pooling via Prisma's built-in pool (connection_limit)
 * - No serverless adapter needed (persistent VM, not ephemeral functions)
 * - Global singleton pattern prevents connection exhaustion in dev (HMR)
 *
 * Connection URL format:
 *   postgresql://user:password@<oracle-vm-ip>:5432/dbname?connection_limit=20&pool_timeout=10
 *
 * For production on Oracle VM:
 * - PostgreSQL runs on the same VM or a separate DB VM in the VCN
 * - Connection is direct TCP (low latency, no HTTP overhead)
 * - connection_limit should match: max_connections / number_of_app_instances
 * - pool_timeout prevents hanging connections under load
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    // Datasource URL is read from DATABASE_URL env var automatically
    // Connection pool settings are passed via the URL query params:
    //   ?connection_limit=20&pool_timeout=10
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
