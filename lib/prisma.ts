// lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Postgres adapter using your DATABASE_URL
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

// Reuse Prisma in dev so hot-reload doesn't create a new client each time
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
