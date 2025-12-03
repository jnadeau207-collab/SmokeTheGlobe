// pages/api/admin/uploads/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

import { parseCoa } from '../../../../lib/coaParsers/registry';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// --- Multer: in-memory upload, we write to disk ourselves ---
const upload = multer({ storage: multer.memoryStorage() });

// Helper to run middleware (multer) inside Next API route
function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: (...args: any[]) => void
) {
  return new Promise<void>((resolve, reject) => {
    fn(req, res, (result: unknown) => {
      if (result instanceof Error) return reject(result);
      return resolve();
    });
  });
}

// Small helpers
function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Very simple fallback batch-code detection if parser doesnâ€™t give one
function detectBatchCode(text: string): string | null {
  const m =
    text.match(/batch\s*[:#]\s*([A-Za-z0-9\-_.]+)/i) ||
    text.match(/lot\s*[:#]\s*([A-Za-z0-9\-_.]+)/i);
  return m ? m[1].trim() : null;
}

// Very simple fallback lab name detection
function detectLabName(text: string): string | null {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // look for something with "LAB" in it
  const candidate = lines.find((l) => /lab(s)?/i.test(l));
  return candidate || null;
}

export const config = {
  api: {
    bodyParser: false, // let multer handle the body
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // ðŸ” Require any authenticated session (we can tighten to role:"admin" later)
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // -------- GET: list uploaded documents --------
  if (req.method === 'GET') {
    try {
      const docs = await prisma.uploadedDocument.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          labResult: {
            select: { id: true },
          },
        },
      });

      return res.status(200).json(docs);
    } catch (e: any) {
      console.error('Failed to list uploads', e);
      return res
        .status(500)
        .json({ error: e?.message || 'Failed to list uploads' });
    }
  }

  // -------- POST: upload + parse a COA PDF --------
  if (req.method === 'POST') {
    try {
      // run multer to populate req.file
      await runMiddleware(req, res, upload.single('file'));

      const anyReq = req as any;
      const file = anyReq.file as Express.Multer.File | undefined;

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      if (file.mimetype !== 'application/pdf') {
        return res.status(400).json({ error: 'Only PDF files are allowed' });
      }

      // SHA-256 hash to de-dupe
      const sha256 = crypto
        .createHash('sha256')
        .update(file.buffer)
        .digest('hex');

      // Check if this COA is already in the DB
      const existing = await prisma.uploadedDocument.findUnique({
        where: { sha256 },
        include: { labResult: { select: { id: true } } },
      });

      if (existing) {
        return res.status(200).json({
          reused: true,
          document: existing,
          labResult: existing.labResult || null,
        });
      }

      // Ensure upload directory exists
      const uploadDir = path.join(process.cwd(), 'uploads', 'coa');
      await fs.mkdir(uploadDir, { recursive: true });

      const safeName = `${sha256}.pdf`;
      const finalPath = path.join(uploadDir, safeName);

      // Write PDF to disk
      await fs.writeFile(finalPath, file.buffer);

      // Extract text from PDF
      let extractedText = '';
      try {
        const parsed = await pdfParse(file.buffer);
        extractedText = parsed.text || '';
      } catch (err) {
        console.error('PDF parse error', err);
      }

      // Try lab-specific parser first
      let parsedCoa: any = null;
      if (extractedText) {
        try {
          parsedCoa = parseCoa(extractedText);
        } catch (err) {
          console.error('parseCoa() error', err);
        }
      }

      const batchCode =
        parsedCoa?.batchCode || detectBatchCode(extractedText) || null;
      const labName = parsedCoa?.labName || detectLabName(extractedText) || null;

      // Create UploadedDocument record
      const document = await prisma.uploadedDocument.create({
        data: {
          filePath: finalPath,
          fileName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          sha256,
          extractedText,
          batchCode,
          labName,
          uploader: (session.user as any)?.email || null,
          verified: false,
        },
      });

      // Optionally create Lab / Batch / LabResult
      let labResult = null;

      if (parsedCoa) {
        const thcPercent =
          parsedCoa.thcPercent ??
          parsedCoa.thc ??
          parsedCoa.totalTHC ??
          null;
        const cbdPercent =
          parsedCoa.cbdPercent ??
          parsedCoa.cbd ??
          parsedCoa.totalCBD ??
          null;
        const totalCannabinoidsPercent =
          parsedCoa.totalCannabinoidsPercent ??
          parsedCoa.totalCannabinoids ??
          null;
        const totalTerpenesPercent =
          parsedCoa.totalTerpenesPercent ??
          parsedCoa.totalTerpenes ??
          null;

        // Upsert Lab if we have a name (slug is unique in schema)
        let labRecord = null;
        if (labName) {
          const slug = slugify(labName);
          labRecord = await prisma.lab.upsert({
            where: { slug },
            update: { name: labName },
            create: {
              name: labName,
              slug,
              stateCode: parsedCoa.stateCode || parsedCoa.jurisdiction || null,
            },
          });
        }

        // ðŸ” Manual "upsert" for Batch by batchCode (since batchCode is NOT unique)
        let batchRecord = null;
        if (batchCode) {
          const existingBatch = await prisma.batch.findFirst({
            where: { batchCode },
          });

          if (existingBatch) {
            batchRecord = await prisma.batch.update({
              where: { id: existingBatch.id },
              data: {
                productName:
                  parsedCoa.productName ?? existingBatch.productName,
                jurisdiction:
                  parsedCoa.jurisdiction ?? existingBatch.jurisdiction,
                stateCode:
                  parsedCoa.stateCode ??
                  parsedCoa.jurisdiction ??
                  existingBatch.stateCode,
              },
            });
          } else {
            batchRecord = await prisma.batch.create({
              data: {
                batchCode,
                productName: parsedCoa.productName || null,
                jurisdiction: parsedCoa.jurisdiction || null,
                stateCode:
                  parsedCoa.stateCode || parsedCoa.jurisdiction || null,
                isActive: true,
              },
            });
          }
        }

        // Create LabResult and connect to UploadedDocument + Batch/Lab
        labResult = await prisma.labResult.create({
          data: {
            uploadedDocument: { connect: { id: document.id } },

            // If we already have a batchRecord, connect; otherwise create a simple fallback batch
            batch: batchRecord
              ? { connect: { id: batchRecord.id } }
              : {
                  create: {
                    batchCode: batchCode || `COA-${document.id}`,
                    productName: parsedCoa.productName || null,
                    jurisdiction: parsedCoa.jurisdiction || null,
                    stateCode:
                      parsedCoa.stateCode || parsedCoa.jurisdiction || null,
                    isActive: true,
                  },
                },

            lab: labRecord
              ? { connect: { id: labRecord.id } }
              : undefined,

            coaIdentifier:
              parsedCoa.coaIdentifier || parsedCoa.sampleId || null,
            sampleId: parsedCoa.sampleId || null,
            sampleType: parsedCoa.sampleType || null,

            testedAt: parsedCoa.testedAt
              ? new Date(parsedCoa.testedAt)
              : null,
            reportedAt: parsedCoa.reportedAt
              ? new Date(parsedCoa.reportedAt)
              : null,

            thcPercent,
            cbdPercent,
            totalCannabinoidsPercent,
            totalTerpenesPercent,

            passed:
              typeof parsedCoa.passed === 'boolean'
                ? parsedCoa.passed
                : null,
            pesticidesPass:
              typeof parsedCoa.pesticidesPass === 'boolean'
                ? parsedCoa.pesticidesPass
                : null,
            solventsPass:
              typeof parsedCoa.solventsPass === 'boolean'
                ? parsedCoa.solventsPass
                : null,
            heavyMetalsPass:
              typeof parsedCoa.heavyMetalsPass === 'boolean'
                ? parsedCoa.heavyMetalsPass
                : null,
            microbialsPass:
              typeof parsedCoa.microbialsPass === 'boolean'
                ? parsedCoa.microbialsPass
                : null,

            moisturePercent:
              typeof parsedCoa.moisturePercent === 'number'
                ? parsedCoa.moisturePercent
                : null,
            waterActivity:
              typeof parsedCoa.waterActivity === 'number'
                ? parsedCoa.waterActivity
                : null,

            analyteSummary: parsedCoa.analyteSummary || null,
            rawJson: parsedCoa.rawJson || parsedCoa || null,
          },
        });
      }

      return res.status(200).json({
        reused: false,
        document,
        labResult,
      });
    } catch (e: any) {
      console.error('Error handling upload', e);
      return res
        .status(500)
        .json({ error: e?.message || 'Failed to handle upload' });
    }
  }

  // Any other method
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end();
}


