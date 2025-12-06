// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

/**
 * Global Prisma client singleton.
 *
 * This uses the DATABASE_URL from your environment and relies on
 * Prisma's built-in connection management. No custom pg Pool or
 * adapter logic is needed for the current Next.js + Node runtime.
 *
 * It works cleanly with:
 *   datasource db {
 *     provider = "postgresql"
 *     url      = env("DATABASE_URL")
 *   }
 * in prisma/schema.prisma.
 */

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
  });

// Only store in globalThis in dev to avoid hot-reload re-instantiation.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Support both:
//   import { prisma } from "@/lib/prisma";
// and
//   import prisma from "@/lib/prisma";
export default prisma;
