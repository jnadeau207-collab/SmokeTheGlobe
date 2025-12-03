import { PrismaClient } from '@prisma/client';`r`nimport { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
async function main() {
  const pass = await bcrypt.hash('ChangeMe123!', 10);
  await prisma.adminUser.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { email: 'admin@example.com', password: pass, name: 'Admin' },
  });
  console.log('Seeded admin user: admin@example.com / ChangeMe123!');
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

