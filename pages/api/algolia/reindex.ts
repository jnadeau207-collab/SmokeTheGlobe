import { PrismaClient } from '@prisma/client';`r`nimport { PrismaPg } from '@prisma/adapter-pg';
import { indexDispensary } from '../../../lib/algolia';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();

  const dispensaries = await prisma.dispensary.findMany();

  for (const d of dispensaries) {
    await indexDispensary(d);
  }

  res.json({ ok: true, count: dispensaries.length });
}

