// src/lib/etl/coaFromCannlytics.ts
import "server-only";

import { parse } from "csv-parse/sync";
import { prisma } from "@/lib/prisma";
import {
  US_STATE_CODES,
  pickField,
  parseDate,
  type RawRow,
} from "@/lib/etl/stateLicenseUtils";

export interface CoaEtlRunOptions {
  dryRun?: boolean;
  /**
   * Max number of rows to process from the source.
   * Defaults to 10,000 to avoid accidentally ingesting the entire world
   * when testing.
   */
  limit?: number;
  /**
   * Optional list of 2‑letter state codes to include, e.g. ["ME","CA"].
   * If omitted, all states in the dataset are eligible.
   */
  stateFilter?: string[];
}

export interface CoaEtlRunResult {
  dryRun: boolean;
  totalFetched: number;
  totalFiltered: number;
  totalProcessed: number;
  totalUpserts: number;
  totalSkipped: number;
  states: string[];
  notes: string[];
}

// Default COA metadata source. You can override via ETL_CANNABIS_COAS_URL
// in your environment if you host your own snapshot.
const DEFAULT_COAS_URL =
  process.env.ETL_CANNABIS_COAS_URL ??
  "https://huggingface.co/datasets/cannlytics/cannabis_results/resolve/main/data/md/md-results-latest.csv";

/**
 * Attempt to normalize a US state from a Cannlytics COA row.
 */
function normalizeState(row: RawRow): string | null {
  const candidates = [
    row["producer_region"],
    row["producer_state"],
    row["producer_subregion"],
    row["state"],
    row["origin"],
  ];

  for (const c of candidates) {
    if (!c) continue;
    const maybe = String(c).trim().toUpperCase().slice(0, 2);
    if (US_STATE_CODES.has(maybe)) {
      return maybe;
    }
  }

  return null;
}

/**
 * Thin wrapper around pickField for readability.
 */
function pick(row: RawRow, candidates: string[]): string | null {
  return pickField(row, candidates);
}

export async function runCannlyticsCoasEtl(
  options: CoaEtlRunOptions = {},
): Promise<CoaEtlRunResult> {
  const {
    dryRun = false,
    limit = 10_000,
    stateFilter,
  } = options;

  const url = DEFAULT_COAS_URL;

  const headers: Record<string, string> = {
    Accept: "text/csv",
  };

  // If at some point the upstream source requires an API key, we can
  // still send it through here without changing call sites.
  if (process.env.CANNLYTICS_API_KEY) {
    headers.Authorization = `Bearer ${process.env.CANNLYTICS_API_KEY}`;
  }

  const res = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch Cannlytics COAs: ${res.status} ${res.statusText}`,
    );
  }

  const csv = await res.text();

  const rows = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as RawRow[];

  // First cut: only keep rows that have a recognizable US state
  const filtered = rows.filter((row) => {
    const state = normalizeState(row);
    if (!state) return false;

    if (stateFilter && stateFilter.length > 0) {
      return stateFilter.includes(state);
    }

    return true;
  });

  const toProcess = filtered.slice(0, limit);

  let totalUpserts = 0;
  let totalSkipped = 0;
  const statesSeen = new Set<string>();
  const notes: string[] = [];

  // Only for full runs: compute a before/after count so we can
  // surface this in the ETL control panel.
  const beforeCount = dryRun
    ? null
    : await prisma.coaDocument.count({
        where: { sourceType: "etl-cannlytics-coas" },
      });

  for (const row of toProcess) {
    const state = normalizeState(row);
    if (state) {
      statesSeen.add(state);
    }

    const sampleId =
      pick(row, ["sample_id", "sampleid", "sample"]) ?? null;

    const batchRef =
      pick(row, ["batch", "batch_number", "metrc_id"]) ??
      sampleId ??
      null;

    const productName =
      pick(row, ["product_name", "reported_name", "strain"]) ??
      "Unknown product";

    const labName =
      pick(row, ["lab", "lab_name"]) ?? null;

    const licenseRef =
      pick(row, ["producer_license_number", "license"]) ?? null;

    const brandName =
      pick(row, ["brand", "producer"]) ?? null;

    const sourceUrl =
      pick(row, ["url", "lab_results_url"]) ?? null;

    const coaUrl =
      pick(row, ["coa_pdf", "coa_url"]) ?? sourceUrl ?? null;

    // If we truly have no way to identify or link this COA, skip it.
    if (!sampleId && !batchRef && !coaUrl) {
      totalSkipped += 1;
      continue;
    }

    const titleParts = [
      productName,
      sampleId ?? batchRef ?? undefined,
      state ?? undefined,
    ].filter(Boolean);

    const title =
      titleParts.length > 0 ? titleParts.join(" · ") : "COA (Cannlytics)";

    // We parse these even if we don't yet store them, so we can
    // easily add them to Batch / LabResult later.
    const sampleCollectedAt = parseDate(
      pick(row, ["date_collected", "date_sampled"]),
    );
    const sampleTestedAt = parseDate(
      pick(row, ["date_tested", "date_reported"]),
    );
    // sampleCollectedAt / sampleTestedAt are not yet written anywhere,
    // but are kept here for future enrichment.

    if (dryRun) {
      totalUpserts += 1;
      continue;
    }

    try {
      const existing = await prisma.coaDocument.findFirst({
        where: {
          sourceType: "etl-cannlytics-coas",
          title,
          labName: labName ?? undefined,
        },
      });

      const data: Parameters<
        typeof prisma.coaDocument.create
      >[0]["data"] = {
        title,
        labName,
        batchRef,
        licenseRef,
        fileType: coaUrl ? "url" : null,
        sourceType: "etl-cannlytics-coas",
        status: "parsed",
        rawText: JSON.stringify(row),
        parsedSummary: row as unknown as Record<string, unknown>,
      };

      if (existing) {
        await prisma.coaDocument.update({
          where: { id: existing.id },
          data,
        });
      } else {
        await prisma.coaDocument.create({ data });
      }

      totalUpserts += 1;
    } catch (err) {
      totalSkipped += 1;
      const message =
        err instanceof Error ? err.message : String(err);
      notes.push(
        `Error writing COA "${title}" (${sampleId ?? batchRef ?? "no-sample-id"}): ${message}`,
      );
    }
  }

  let afterCount: number | null = null;
  if (!dryRun) {
    afterCount = await prisma.coaDocument.count({
      where: { sourceType: "etl-cannlytics-coas" },
    });

    const delta = (afterCount ?? 0) - (beforeCount ?? 0);
    notes.push(
      `CoaDocument count (sourceType="etl-cannlytics-coas") before=${beforeCount} after=${afterCount} delta=${delta}.`,
    );
  }

  notes.unshift(
    "Source: Cannlytics COA metadata (cannabis_results snapshot).",
    "This job only populates CoaDocument; Batch / LabResult enrichment can be layered on later.",
  );

  return {
    dryRun,
    totalFetched: rows.length,
    totalFiltered: filtered.length,
    totalProcessed: toProcess.length,
    totalUpserts,
    totalSkipped,
    states: Array.from(statesSeen).sort(),
    notes,
  };
}
