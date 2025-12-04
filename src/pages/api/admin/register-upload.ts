import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/authOptions';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user as any).role !== 'admin')
    return res.status(403).json({ error: 'forbidden' });
  if (req.method !== 'POST') return res.status(405).end();
  const { key, fileName, batchId, labName, sha256 } = req.body;
  // In production, validate the file exists in S3 and verify sha256 via ETag or by downloading and hashing.
  const doc = await prisma.uploadedDocument.create({
    data: {
      filePath: key,
      fileName,
      mimeType: 'application/pdf',
      size: 0,
      sha256: sha256 || key,
      labName: labName || null,
      batchId: batchId ? Number(batchId) : undefined,
    },
  });
  res.json({ ok: true, doc });
}



