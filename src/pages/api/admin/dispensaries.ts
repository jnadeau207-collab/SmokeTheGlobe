import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/authOptions';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function requireAdmin(req: any, res: any) {
  const session = await getServerSession(req, res, authOptions as any);

  if (!session || (session.user as any).role !== 'admin') {
    res.status(403).json({ error: 'forbidden' });
    return null;
  }

  return session;
}

export default async function handler(req: any, res: any) {
  const session = await requireAdmin(req, res);
  if (!session) return;

  if (req.method === 'GET') {
    const list = await prisma.dispensary.findMany({
      orderBy: { name: 'asc' },
    });
    return res.json(list); // ðŸ‘ˆ important: plain array
  }

  if (req.method === 'POST') {
    const body = req.body;
    const created = await prisma.dispensary.create({
      data: {
        name: body.name,
        slug: body.slug,
        city: body.city,
        state: body.state,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
      },
    });

    return res.json(created);
  }

  if (req.method === 'PUT') {
    const body = req.body;
    const updated = await prisma.dispensary.update({
      where: { id: body.id },
      data: {
        name: body.name,
        slug: body.slug,
        city: body.city,
        state: body.state,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
      },
    });

    return res.json(updated);
  }

  if (req.method === 'DELETE') {
    const id = Number(req.query.id);
    await prisma.dispensary.delete({ where: { id } });
    return res.json({ ok: true });
  }

  res.status(405).end();
}



