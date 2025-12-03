import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';`r`nimport { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions as any);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const id = Number(req.query.id);
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  try {
    if (req.method === 'GET') {
      const doc = await prisma.uploadedDocument.findUnique({
        where: { id },
        include: {
          labResult: {
            include: {
              lab: true,
              batch: {
                include: {
                  brand: true,
                  locations: {
                    include: {
                      location: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!doc) {
        return res.status(404).json({ error: 'Not found' });
      }

      return res.json(doc);
    }

    if (req.method === 'PUT') {
      const { batchCode, labName, verified } = req.body || {};

      const updated = await prisma.uploadedDocument.update({
        where: { id },
        data: {
          batchCode: batchCode ?? null,
          labName: labName ?? null,
          verified: verified === undefined ? false : !!verified,
        },
      });

      return res.json(updated);
    }

    if (req.method === 'DELETE') {
      // delete any linked labResult first
      await prisma.labResult.deleteMany({
        where: { uploadedDocumentId: id },
      });

      await prisma.uploadedDocument.delete({
        where: { id },
      });

      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e: any) {
    console.error('Error in /api/admin/uploads/[id]', e);
    return res
      .status(500)
      .json({ error: e?.message || 'Internal server error' });
  }
}

