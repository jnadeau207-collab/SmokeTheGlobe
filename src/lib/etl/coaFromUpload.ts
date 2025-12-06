// src/lib/etl/coaFromUpload.ts
//
// Phase 2: COA ingestion from uploaded documents.
//
// This module looks at UploadedDocument records that have been marked
// as verified and whose mime type looks COA‑ish (PDF / image). For each
// document that does *not* already have a LabResult, we:
//
//   • Resolve or create a Batch (using batchCode when present)
//   • Resolve or create a Lab (using labName when present)
//   • Create a LabResult linked to the UploadedDocument
//   • Create a CoaDocument that points at the underlying file
//
// Parsing of analytes / potency is intentionally left as a later step;
// for now we only create the core relational skeleton.
//

import "server-only";

import { prisma } from "@/lib/prisma";

export interface CoaIngestOptions {
  dryRun?: boolean;
  limit?: number;
}

export interface CoaIngestResult {
  processed: number;
  upserts: number;
  skipped: number;
  notes: string[];
}

const POSSIBLE_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
];

function inferFileType(mimeType: string | null | undefined): string | null {
  if (!mimeType) return null;
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  return null;
}

/**
 * Ingest verified uploaded COA-like documents into LabResult + CoaDocument.
 */
export async function ingestCoasFromUploadedDocs(
  options: CoaIngestOptions = {},
): Promise<CoaIngestResult> {
  const { dryRun = false, limit = 100 } = options;

  const notes: string[] = [];
  let processed = 0;
  let upserts = 0;
  let skipped = 0;

  // Pick UploadedDocuments that:
  //  - are verified (you can relax this later if needed)
  //  - mimeType suggests a COA file
  //  - do NOT already have a LabResult linked
  const candidates = await prisma.uploadedDocument.findMany({
    where: {
      verified: true,
      mimeType: { in: POSSIBLE_MIME_TYPES },
      labResult: {
        is: null,
      },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  notes.push(`Found ${candidates.length} candidate uploaded documents.`);

  for (const doc of candidates) {
    processed += 1;

    // Basic guardrail: must have a filePath where the asset lives.
    if (!doc.filePath) {
      skipped += 1;
      notes.push(`Skipping uploadedDocument id=${doc.id}: missing filePath.`);
      continue;
    }

    // Extra guard in case something linked a LabResult between the
    // initial query and now.
    const existingLabResult = await prisma.labResult.findFirst({
      where: { uploadedDocumentId: doc.id },
      select: { id: true },
    });

    if (existingLabResult) {
      skipped += 1;
      notes.push(
        `Skipping uploadedDocument id=${doc.id}: LabResult already exists (id=${existingLabResult.id}).`,
      );
      continue;
    }

    const batchCode = doc.batchCode ?? null;
    const labName = doc.labName ?? null;

    if (!batchCode && !labName) {
      skipped += 1;
      notes.push(
        `Skipping uploadedDocument id=${doc.id}: no batchCode or labName present; cannot safely create batch / lab.`,
      );
      continue;
    }

    if (dryRun) {
      upserts += 1;
      notes.push(
        `Would create LabResult + CoaDocument for uploadedDocument id=${doc.id} (batchCode=${batchCode ?? "n/a"}, labName=${labName ?? "n/a"}).`,
      );
      continue;
    }

    // Resolve or create Batch
    let batchId: number;
    if (batchCode) {
      const existingBatch = await prisma.batch.findFirst({
        where: { batchCode },
        select: { id: true },
      });

      if (existingBatch) {
        batchId = existingBatch.id;
      } else {
        const createdBatch = await prisma.batch.create({
          data: {
            batchCode,
            notes: "Auto-created from uploaded COA.",
          },
          select: { id: true },
        });

        batchId = createdBatch.id;
        notes.push(
          `Created new Batch id=${batchId} for batchCode=${batchCode} (uploadedDocument id=${doc.id}).`,
        );
      }
    } else {
      // Create a minimal placeholder batch to hang the lab result on.
      const createdBatch = await prisma.batch.create({
        data: {
          batchCode: `uploaded-${doc.id}`,
          notes:
            "Auto-created placeholder batch from uploaded COA without explicit batchCode.",
        },
        select: { id: true, batchCode: true },
      });

      batchId = createdBatch.id;
      notes.push(
        `Created placeholder Batch id=${batchId} (batchCode=${createdBatch.batchCode}) for uploadedDocument id=${doc.id}.`,
      );
    }

    // Resolve or create Lab
    let labId: number | null = null;
    if (labName) {
      const existingLab = await prisma.lab.findFirst({
        where: { name: labName },
        select: { id: true },
      });

      if (existingLab) {
        labId = existingLab.id;
      } else {
        const createdLab = await prisma.lab.create({
          data: { name: labName },
          select: { id: true },
        });
        labId = createdLab.id;
        notes.push(
          `Created new Lab id=${labId} with name="${labName}" for uploadedDocument id=${doc.id}.`,
        );
      }
    }

    // Create a minimal LabResult that can be enriched later.
    const labResult = await prisma.labResult.create({
      data: {
        batchId,
        labId: labId ?? undefined,
        uploadedDocumentId: doc.id,
      },
      select: { id: true },
    });

    const fileType = inferFileType(doc.mimeType);

    await prisma.coaDocument.create({
      data: {
        title:
          doc.fileName ||
          (batchCode
            ? `COA for batch ${batchCode}`
            : `COA for uploaded document ${doc.id}`),
        labName: labName ?? undefined,
        batchRef: batchCode,
        licenseRef: null, // we do not yet resolve license from uploaded docs
        fileType,
        storageKey: doc.filePath,
        rawText: doc.extractedText ?? null,
        parsedSummary: null,
        sourceType: "manual-upload",
        status: "parsed",
      },
    });

    upserts += 1;
    notes.push(
      `Created LabResult id=${labResult.id} and CoaDocument for uploadedDocument id=${doc.id}.`,
    );
  }

  return { processed, upserts, skipped, notes };
}
