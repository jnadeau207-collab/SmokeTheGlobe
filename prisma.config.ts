import { defineConfig } from '@prisma/config';

export default defineConfig({
  // Where the actual Prisma schema lives
  schema: 'prisma/schema.prisma',

  // Prisma 7: move the connection string here instead of schema.prisma
  datasources: {
    db: {
      provider: 'postgresql',
      url: { env: 'DATABASE_URL' },
    },
  },
});
