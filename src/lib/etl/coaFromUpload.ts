// src/lib/etl/coaFromUploaded.ts
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

/**
 * Phase 1 COA ingestion:
 * - Looks for UploadedDocument rows that look like COAs and have not yet been linked.
 * - Creates a LabResult + CoaDocument for each, with very minimal mapping.
 * - Idempotent: if we already created a LabResult for a given uploadedDocumentId, we skip.
 */
export async function ingestCoasFromUploadedDocs(
  options: CoaIngestOptions = {}
): Promise<CoaIngestResult> {
  const { dryRun = false, limit = 100 } = options;

  const notes: string[] = [];
  let processed = 0;
  let upserts = 0;
  let skipped = 0;

  // Heuristic: COA-ish mime types
  const possibleMimeTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];

  // Pick UploadedDocuments that:
  // - are verified (you can relax this later if needed)
  // - mimeType suggests COA
  // - do NOT already have a LabResult linked
    const candidates = await prisma.uploadedDocument.findMany({
    where: {
      verified: true,
      mimeType: { in: possibleMimeTypes },
      labResult: {
        is: null, // no linked LabResult yet
      },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  if (candidates.length === 0) {
    notes.push("No candidate UploadedDocument rows found for COA ingestion.");
    return { processed, upserts, skipped, notes };
  }

  notes.push(`Found ${candidates.length} candidate uploaded documents.`);

  for (const doc of candidates) {
    processed += 1;

    // Basic guardrail: must have a filePath
    if (!doc.filePath) {
      skipped += 1;
      notes.push(`Skipping uploadedDocument id=${doc.id}: missing filePath.`);
      continue;
    }

    // Check idempotency at LabResult level (extra guard)
    const existingLabResult = await prisma.labResult.findFirst({
      where: { uploadedDocumentId: doc.id },
      select: { id: true },
    });

    if (existingLabResult) {
      skipped += 1;
      notes.push(`Skipping uploadedDocument id=${doc.id}: LabResult already exists.`);
      continue;
    }

    const batchCode = doc.batchCode || null;
    const labName = doc.labName || doc.source || null;

    let batchId: number | null = null;
    let labId: number | null = null;

    // Try to resolve or create a Batch (very lightweight right now)
    if (batchCode) {
      const batch = await prisma.batch.findFirst({
        where: { batchCode },
        select: { id: true },
      });

      if (batch) {
        batchId = batch.id;
      } else if (!dryRun) {
        const created = await prisma.batch.create({
          data: {
            batchCode,
            // Attach any metadata we can salvage from the uploaded doc.
            originType: doc.source ?? "uploaded-coa",
            collectedAt: doc.sampledAt ?? null,
          },
        });
        batchId = created.id;
        notes.push(`Created new Batch for batchCode=${batchCode} (id=${created.id}).`);
      } else {
        notes.push(
          `Would create new Batch for batchCode=${batchCode} (dry run; no DB write performed).`
        );
      }
    }

    // Try to resolve or create a Lab
    if (labName) {
      const lab = await prisma.lab.findFirst({
        where: { name: labName },
        select: { id: true },
      });

      if (lab) {
        labId = lab.id;
      } else if (!dryRun) {
        const created = await prisma.lab.create({
          data: {
            name: labName,
            sourceSystem: doc.source ?? "uploaded-coa",
          },
        });
        labId = created.id;
        notes.push(`Created new Lab for labName=${labName} (id=${created.id}).`);
      } else {
        notes.push(
          `Would create new Lab for labName=${labName} (dry run; no DB write performed).`
        );
      }
    }

    if (dryRun) {
      // Don't actually write LabResult / CoaDocument in dry run.
      upserts += 1;
      notes.push(
        `DRY RUN: would create LabResult + CoaDocument for uploadedDocument id=${doc.id}.`
      );
      continue;
    }

    // Create LabResult
    const labResult = await prisma.labResult.create({
      data: {
        uploadedDocumentId: doc.id,
        batchId: batchId ?? undefined,
        labId: labId ?? undefined,
        // Minimal fields – we'll enrich later
        sampleId: doc.sampleId ?? null,
        receivedAt: doc.sampledAt ?? null,
        resultStatus: "unknown",
        sourceSystem: doc.source ?? "uploaded-coa",
      },
    });

    // Create CoaDocument – canonical document row
    await prisma.coaDocument.create({
      data: {
        storageKey: doc.filePath,
        // Use file name as a human-readable title if available
        title: doc.fileName ?? `COA #${labResult.id}`,
        fileType: doc.mimeType ?? "application/octet-stream",
        labName: labName ?? undefined,
        batchRef: batchCode ?? undefined,
        licenseRef: doc.licenseNumber ?? undefined,
        rawText: doc.extractedText ?? null,
        // For now we treat uploaded docs as "manual-upload"
        sourceType: "manual-upload",
      },
    });

    upserts += 1;
    notes.push(
      `Created LabResult id=${labResult.id} + CoaDocument for uploadedDocument id=${doc.id}.`
    );
  }

  return { processed, upserts, skipped, notes };
}
