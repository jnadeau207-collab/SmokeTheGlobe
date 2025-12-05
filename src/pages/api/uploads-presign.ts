import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import crypto from 'crypto';
const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || (session as any).user.role !== 'admin')
    return res.status(403).json({ error: 'forbidden' });
  if (req.method !== 'POST') return res.status(405).end();
  const { fileName, contentType } = req.body;
  if (!fileName || !contentType)
    return res.status(400).json({ error: 'fileName and contentType required' });
  const key = `uploads/${Date.now()}-${fileName}`;
  // presigned POST (browser can use form fields)
  const params = {
    Bucket: process.env.AWS_S3_BUCKET!,
    Fields: { key },
    Conditions: [['content-length-range', 1, 50 * 1024 * 1024]],
  };
  try {
    const presign = await s3.createPresignedPost({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      Expires: 60,
    });
    // In production, after upload completes use an S3 event to trigger scan (ClamAV) or scan immediately if you proxy upload through server.
    // Example placeholder: return presign fields and key to client.
    res.json({ ok: true, presign, key });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 's3 error' });
  }
}
