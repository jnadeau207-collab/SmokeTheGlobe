import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { ingestMaineLicenses } from '../../../lib/importers/maine';
import { ingestMassachusettsLicenses } from '../../../lib/importers/massachusetts';
import { ingestColoradoLicenses } from '../../../lib/importers/colorado';
import { ingestCaliforniaLicenses } from '../../../lib/importers/california';
import { ingestRemainingStates } from '../../../lib/importers/remainingStates';
import { ingestNewBrunswickStores } from '../../../lib/importers/newBrunswick';

let importInProgress = false;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Authenticate admin session or cron token
  const session = await getServerSession(req, res, authOptions);
  const cronToken = process.env.CRON_SECRET;
  if (!session) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !cronToken || authHeader !== `Bearer ${cronToken}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // If authorized via token, allow to proceed as admin (no session)
  } else if (session.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed, use POST' });
  }
  if (importInProgress) {
    return res.status(429).json({ error: 'Import already in progress' });
  }
  importInProgress = true;
  const results: { [key: string]: number | string } = {};
  try {
    const stateParam = req.query.state;
    if (stateParam) {
      const code = Array.isArray(stateParam) ? stateParam[0].toUpperCase() : (stateParam as string).toUpperCase();
      switch (code) {
        case 'ME':
          results.ME = await ingestMaineLicenses();
          break;
        case 'MA':
          results.MA = await ingestMassachusettsLicenses();
          break;
        case 'CO':
          results.CO = await ingestColoradoLicenses();
          break;
        case 'CA':
          results.CA = await ingestCaliforniaLicenses();
          break;
        case 'NB':
          results.NB = await ingestNewBrunswickStores();
          break;
        case 'ALL':
          // Run all importers in sequence
          results.ME = await ingestMaineLicenses();
          results.MA = await ingestMassachusettsLicenses();
          results.CO = await ingestColoradoLicenses();
          results.CA = await ingestCaliforniaLicenses();
          results.NB = await ingestNewBrunswickStores();
          results.RemainingUS = await ingestRemainingStates();
          break;
        default:
          importInProgress = false;
          return res.status(400).json({ error: `Unsupported state code: ${code}` });
      }
    } else {
      // No state specified: run everything
      results.ME = await ingestMaineLicenses();
      results.MA = await ingestMassachusettsLicenses();
      results.CO = await ingestColoradoLicenses();
      results.CA = await ingestCaliforniaLicenses();
      results.NB = await ingestNewBrunswickStores();
      results.RemainingUS = await ingestRemainingStates();
    }
    importInProgress = false;
    return res.status(200).json({ ok: true, updated: results });
  } catch (error: any) {
    importInProgress = false;
    console.error('Data import failed:', error);
    return res.status(500).json({ error: error.message || 'Import failed' });
  }
}
