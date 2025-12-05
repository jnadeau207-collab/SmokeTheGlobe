// pages/api/admin/lab-results/[id].ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';`r`nimport { PrismaPg } from '@prisma/adapter-pg';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions as any);

  if (!session || (session.user as any).role !== 'admin') {
    return res.status(403).json({ error: 'forbidden' });
  }

  const { id } = req.query;
  const idNum = Number(id);

  if (!id || Number.isNaN(idNum)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  // âœ… Update lab result fields (from debug page)
  if (req.method === 'PUT') {
    try {
      const {
        testedAt,
        thcPercent,
        cbdPercent,
        totalCannabinoidsPercent,
        passed,
      } = req.body || {};

      const updated = await prisma.labResult.update({
        where: { id: idNum },
        data: {
          testedAt: testedAt ? new Date(testedAt) : null,
          thcPercent:
            typeof thcPercent === 'number'
              ? thcPercent
              : thcPercent != null
                ? Number(thcPercent)
                : null,
          cbdPercent:
            typeof cbdPercent === 'number'
              ? cbdPercent
              : cbdPercent != null
                ? Number(cbdPercent)
                : null,
          totalCannabinoidsPercent:
            typeof totalCannabinoidsPercent === 'number'
              ? totalCannabinoidsPercent
              : totalCannabinoidsPercent != null
                ? Number(totalCannabinoidsPercent)
                : null,
          passed:
            typeof passed === 'boolean'
              ? passed
              : passed === 'true'
                ? true
                : passed === 'false'
                  ? false
                  : null,
        },
      });

      return res.json(updated);
    } catch (e: any) {
      console.error('Failed to update lab result', e);
      return res
        .status(500)
        .json({ error: e?.message || 'Failed to update lab result' });
    }
  }

  // âœ… Delete lab result + its COA document (used from batch detail)
  if (req.method === 'DELETE') {
    try {
      const lr = await prisma.labResult.findUnique({
        where: { id: idNum },
        select: {
          id: true,
          uploadedDocumentId: true,
        },
      });

      if (!lr) {
        return res.status(404).json({ error: 'lab result not found' });
      }

      await prisma.$transaction(async (tx) => {
        if (lr.uploadedDocumentId) {
          await tx.uploadedDocument.delete({
            where: { id: lr.uploadedDocumentId },
          });
        }

        await tx.labResult.delete({
          where: { id: lr.id },
        });
      });

      return res.json({ ok: true });
    } catch (e: any) {
      console.error('Failed to delete lab result / COA', e);
      return res
        .status(500)
        .json({ error: e?.message || 'Failed to delete lab result / COA' });
    }
  }

  return res.status(405).end();
}

