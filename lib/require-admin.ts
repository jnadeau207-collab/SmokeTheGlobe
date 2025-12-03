import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../pages/api/auth/[...nextauth]';

export default async function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !(session.user as any)?.role || (session.user as any).role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }

  return session;
}
