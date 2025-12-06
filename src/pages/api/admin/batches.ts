// pages/api/admin/batches.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/lib/auth";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // âœ… Same auth pattern as /api/admin/uploads
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const { stateCode, q } = req.query;

    const where: any = {};

    // Optional state filter (used by /admin/states/[stateCode])
    if (typeof stateCode === 'string' && stateCode.trim() !== '') {
      where.stateCode = stateCode.toUpperCase();
    }

    // Optional text search (batch code, product name, category)
    if (typeof q === 'string' && q.trim() !== '') {
      const search = q.trim();
      where.OR = [
        { batchCode: { contains: search, mode: 'insensitive' } },
        { productName: { contains: search, mode: 'insensitive' } },
        { primaryCategory: { contains: search, mode: 'insensitive' } },
        { subCategory: { contains: search, mode: 'insensitive' } },
      ];
    }

    const batches = await prisma.batch.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        brand: true,
        labResults: {
          orderBy: { testedAt: 'desc' },
          take: 1,
          include: { lab: true },
        },
      },
    });

    const mapped = batches.map((b) => {
      const latest = b.labResults[0];

      return {
        id: b.id,
        batchCode: b.batchCode,
        productName: b.productName,
        productSku: b.productSku,
        primaryCategory: b.primaryCategory,
        subCategory: b.subCategory,
        jurisdiction: b.jurisdiction,
        stateCode: b.stateCode,
        isActive: b.isActive,
        createdAt: b.createdAt,

        brand: b.brand
          ? {
              id: b.brand.id,
              name: b.brand.name,
            }
          : null,

        latestLab: latest
          ? {
              id: latest.id,
              testedAt: latest.testedAt,
              thcPercent: latest.thcPercent,
              cbdPercent: latest.cbdPercent,
              totalCannabinoidsPercent: latest.totalCannabinoidsPercent,
              passed: latest.passed,
              labName: latest.lab?.name ?? null,
            }
          : null,
      };
    });

    return res.json(mapped);
  }

  if (req.method === 'POST') {
    const body = req.body || {};

    const created = await prisma.batch.create({
      data: {
        batchCode: body.batchCode,
        productName: body.productName ?? null,
        productSku: body.productSku ?? null,
        primaryCategory: body.primaryCategory ?? null,
        subCategory: body.subCategory ?? null,
        jurisdiction: body.jurisdiction ?? null,
        stateCode: body.stateCode ? String(body.stateCode).toUpperCase() : null,
        brandId:
          body.brandId === null || body.brandId === undefined
            ? null
            : Number(body.brandId),
        harvestDate: body.harvestDate ? new Date(body.harvestDate) : null,
        productionDate: body.productionDate
          ? new Date(body.productionDate)
          : null,
        packageDate: body.packageDate ? new Date(body.packageDate) : null,
        expirationDate: body.expirationDate
          ? new Date(body.expirationDate)
          : null,
        isActive:
          typeof body.isActive === 'boolean' ? body.isActive : true,
        notes: body.notes ?? null,
      },
    });

    return res.status(201).json(created);
  }

  if (req.method === 'PUT') {
    const id = Number(req.query.id);
    if (!id) {
      return res.status(400).json({ error: 'missing id' });
    }

    const body = req.body || {};

    const updated = await prisma.batch.update({
      where: { id },
      data: {
        batchCode: body.batchCode,
        productName: body.productName ?? null,
        productSku: body.productSku ?? null,
        primaryCategory: body.primaryCategory ?? null,
        subCategory: body.subCategory ?? null,
        jurisdiction: body.jurisdiction ?? null,
        stateCode: body.stateCode ? String(body.stateCode).toUpperCase() : null,
        brandId:
          body.brandId === null || body.brandId === undefined
            ? null
            : Number(body.brandId),
        harvestDate: body.harvestDate ? new Date(body.harvestDate) : null,
        productionDate: body.productionDate
          ? new Date(body.productionDate)
          : null,
        packageDate: body.packageDate ? new Date(body.packageDate) : null,
        expirationDate: body.expirationDate
          ? new Date(body.expirationDate)
          : null,
        isActive:
          typeof body.isActive === 'boolean' ? body.isActive : true,
        notes: body.notes ?? null,
      },
    });

    return res.json(updated);
  }

  if (req.method === 'DELETE') {
    const id = Number(req.query.id);
    if (!id) {
      return res.status(400).json({ error: 'missing id' });
    }

    try {
      // Remove child lab results first to avoid FK errors
      await prisma.labResult.deleteMany({
        where: { batchId: id },
      });

      await prisma.batch.delete({
        where: { id },
      });

      // 204 = no content (what your client already expects)
      return res.status(204).end();
    } catch (e: any) {
      console.error('Failed to delete batch', e);
      return res
        .status(500)
        .json({ error: e?.message || 'Failed to delete batch' });
    }
  }

  return res.status(405).end();
}



