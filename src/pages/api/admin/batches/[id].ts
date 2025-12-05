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

  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  const { id } = req.query;
  const idNum = Number(id);

  if (!id || Number.isNaN(idNum)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  try {
    const batch = await prisma.batch.findUnique({
      where: { id: idNum },
      include: {
        brand: true,
        labResults: {
          orderBy: { createdAt: 'desc' },
          include: {
            lab: true,
            uploadedDocument: true,
          },
        },
        // If you later add real relations for these, you can include them here:
        // locations: { include: { location: true } },
        // verifications: true,
        // recalls: true,
        // ratingSources: true,
      },
    });

    if (!batch) {
      return res.status(404).json({ error: 'not found' });
    }

    // Map Prisma model â†’ shape expected by your BatchDetail type
    const response = {
      id: batch.id,
      batchCode: batch.batchCode,
      productName: batch.productName ?? null,
      productSku: (batch as any).productSku ?? (batch as any).sku ?? null,
      primaryCategory:
        (batch as any).primaryCategory ?? batch.productCategory ?? null,
      subCategory:
        (batch as any).subCategory ?? batch.productSubcategory ?? null,
      brand: batch.brand
        ? {
            id: batch.brand.id,
            name: batch.brand.name,
          }
        : null,
      harvestDate: (batch as any).harvestDate
        ? (batch as any).harvestDate.toISOString()
        : null,
      productionDate: (batch as any).productionDate
        ? (batch as any).productionDate.toISOString()
        : null,
      packageDate: (batch as any).packageDate
        ? (batch as any).packageDate.toISOString()
        : null,
      expirationDate: (batch as any).expirationDate
        ? (batch as any).expirationDate.toISOString()
        : null,
      isActive: batch.isActive,
      notes: (batch as any).notes ?? null,

      // These are future features; for now we return null/empty to keep the UI happy
      reviewAggregate: null,
      ratingSources: [] as any[],
      locations: [] as any[],
      verifications: [] as any[],
      recalls: [] as any[],

      labResults: batch.labResults.map((lr) => ({
        id: lr.id,
        testedAt: lr.testedAt ? lr.testedAt.toISOString() : null,
        reportedAt: lr.reportedAt ? lr.reportedAt.toISOString() : null,
        thcPercent: lr.thcPercent,
        cbdPercent: lr.cbdPercent,
        totalCannabinoidsPercent: lr.totalCannabinoidsPercent,
        passed: lr.passed,
        lab: lr.lab
          ? {
              id: lr.lab.id,
              name: lr.lab.name,
            }
          : null,
        uploadedDocument: lr.uploadedDocument
          ? {
              id: lr.uploadedDocument.id,
              fileName: lr.uploadedDocument.fileName,
            }
          : null,
      })),
    };

    return res.json(response);
  } catch (e: any) {
    console.error('Failed to fetch batch detail', e);
    return res
      .status(500)
      .json({ error: e?.message || 'Failed to fetch batch detail' });
  }
}

