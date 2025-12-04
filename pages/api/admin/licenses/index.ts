import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user as any)?.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (req.method === 'GET') {
    try {
      const licenses = await prisma.stateLicense.findMany({
        select: {
          id: true,
          licenseNumber: true,
          entityName: true,
          stateCode: true,
          status: true,
          transparencyScore: true
        },
        orderBy: { licenseNumber: 'asc' }
      });
      return res.status(200).json(licenses);
    } catch (e: any) {
      console.error('Failed to retrieve licenses:', e);
      return res.status(500).json({ error: e.message || 'Failed to retrieve licenses' });
    }
  } else {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
}
