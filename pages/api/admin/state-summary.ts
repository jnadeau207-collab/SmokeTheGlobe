// pages/api/admin/state-summary.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
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

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  try {
    // Batches grouped by stateCode
    const batchGroups = await prisma.batch.groupBy({
      by: ['stateCode'],
      _count: { _all: true },
      where: {
        stateCode: { not: null },
      },
    });

    // Labs grouped by stateCode
    const labGroups = await prisma.lab.groupBy({
      by: ['stateCode'],
      _count: { _all: true },
      where: {
        stateCode: { not: null },
      },
    });

    // Locations grouped by state (Location.state is a string like "ME")
    const locationGroups = await prisma.location.groupBy({
      by: ['state'],
      _count: { _all: true },
      where: {
        state: { not: null },
      },
    });

    type StateSummary = {
      stateCode: string;
      batches: number;
      labs: number;
      locations: number;
    };

    const summaryMap = new Map<string, StateSummary>();

    function ensureState(code: string): StateSummary {
      const upper = code.toUpperCase();
      let entry = summaryMap.get(upper);
      if (!entry) {
        entry = {
          stateCode: upper,
          batches: 0,
          labs: 0,
          locations: 0,
        };
        summaryMap.set(upper, entry);
      }
      return entry;
    }

    for (const row of batchGroups) {
      if (!row.stateCode) continue;
      const entry = ensureState(row.stateCode);
      entry.batches += row._count._all;
    }

    for (const row of labGroups) {
      if (!row.stateCode) continue;
      const entry = ensureState(row.stateCode);
      entry.labs += row._count._all;
    }

    for (const row of locationGroups) {
      if (!row.state) continue;
      const entry = ensureState(row.state);
      entry.locations += row._count._all;
    }

    const result = Array.from(summaryMap.values()).sort((a, b) =>
      a.stateCode.localeCompare(b.stateCode)
    );

    return res.status(200).json(result);
  } catch (e: any) {
    console.error('Failed to build state summary', e);
    return res
      .status(500)
      .json({ error: e?.message || 'Failed to build state summary' });
  }
}

