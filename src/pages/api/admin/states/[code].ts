// pages/api/admin/states/[code].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';`r`nimport { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { code } = req.query;
  const stateCode =
    typeof code === 'string' ? code.toUpperCase() : String(code[0]).toUpperCase();

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  try {
    // Labs in this state
    const labs = await prisma.lab.findMany({
      where: { stateCode },
      include: {
        stateLicense: true,
        labResults: {
          select: {
            id: true,
            passed: true,
            thcPercent: true,
            totalCannabinoidsPercent: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Batches in this state
    const batches = await prisma.batch.findMany({
      where: { stateCode },
      include: {
        brand: true,
        reviewAggregate: true,
        labResults: {
          select: {
            id: true,
            passed: true,
            thcPercent: true,
            totalCannabinoidsPercent: true,
          },
        },
        locations: {
          include: {
            location: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 500, // basic guard for now
    });

    // Locations in this state
    const locations = await prisma.location.findMany({
      where: { state: stateCode },
      include: {
        brand: true,
        stateLicense: true,
        batchLinks: {
          include: {
            batch: {
              select: { id: true, batchCode: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({
      stateCode,
      labs,
      batches,
      locations,
    });
  } catch (e: any) {
    console.error(`Failed to load state detail for ${stateCode}`, e);
    return res
      .status(500)
      .json({ error: e?.message || 'Failed to load state detail' });
  }
}

