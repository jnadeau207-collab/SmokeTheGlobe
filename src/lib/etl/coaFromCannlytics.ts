// src/lib/etl/coaFromCannlytics.ts
import "server-only";

import { parse } from "csv-parse/sync";
import { prisma } from "@/lib/prisma";

export interface CoaEtlRunOptions {
  dryRun?: boolean;
  limit?: number;
  stateFilter?: string[]; // e.g. ["ME", "CA"]
}

export interface CoaEtlRunResult {
  dryRun: boolean;
  totalFetched: number;
  totalFiltered: number;
  totalProcessed: number;
  totalUpserts: number;
  totalSkipped: number;
  states: string[];
  notes?: string[];
}

type RawRow = Record<string, string>;

const DEFAULT_COAS_URL =
  process.env.ETL_CANNABIS_COAS_URL ??
  // Cannlytics COA metadata API, CSV format, high row limit
  "https://cannlytics.com/api/data/coas?format=csv&limit=200000";

const US_STATE_CODES = new Set([
  "AK","AL","AR","AZ","CA","CO","CT","DC","DE","FL",
  "GA","HI","IA","ID","IL","IN","KS","KY","LA","MA",
  "MD","ME","MI","MN","MO","MS","MT","NC","ND","NE",
  "NH","NJ","NM","NV","NY","OH","OK","OR","PA","RI",
  "SC","SD","TN","TX","UT","VA","VT","WA","WI","WV","WY",
]);

function pick(row: RawRow, keys: string[]): string | undefined {
  for (const key of keys) {
    const val = row[key];
    if (val != null && String(val).trim() !== "") {
      return String(val).trim();
    }
  }
  return undefined;
}

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
    if (US_STATE_CODES.has(maybe)) return maybe;
  }
  return null;
}

// Helper: parse a date string into JS Date | null
function parseDate(raw?: string): Date | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function runCannlyticsCoasEtl(
  opts: CoaEtlRunOptions = {},
): Promise<CoaEtlRunResult> {
  const dryRun = !!opts.dryRun;
  const limit = opts.limit ?? 10_000;

  const url = DEFAULT_COAS_URL;

  const headers: Record<string, string> = {
    Accept: "text/csv",
  };

  // Optional: authorized access if Cannlytics requires an API key
  if (process.env.CANNLYTICS_API_KEY) {
    headers.Authorization = `Bearer ${process.env.CANNLYTICS_API_KEY}`;
  }

  const res = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
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
  }) as RawRow[];

  // Filter to rows that we can reasonably map + stateFilter if provided
  const filtered = rows.filter((row) => {
    const state = normalizeState(row);
    if (!state) return false;

    if (opts.stateFilter && opts.stateFilter.length > 0) {
      return opts.stateFilter.includes(state);
    }
    return true;
  });

  const toProcess = filtered.slice(0, limit);

  let totalUpserts = 0;
  let totalSkipped = 0;
  const statesSeen = new Set<string>();

  for (const row of toProcess) {
    const state = normalizeState(row);
    if (state) statesSeen.add(state);

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

    const brandName =
      pick(row, ["brand", "producer"]) ?? null;

    const licenseRef =
      pick(row, ["producer_license_number", "license"]) ?? null;

    const sourceUrl =
      pick(row, ["url", "lab_results_url"]) ?? null;

    const coaUrl =
      pick(row, ["coa_pdf", "coa_url"]) ?? sourceUrl ?? null;

    // If we truly have nothing to identify or link, skip
    if (!sampleId && !batchRef && !coaUrl) {
      totalSkipped++;
      continue;
    }

    const titleParts = [
      productName,
      sampleId ?? batchRef ?? undefined,
      state ?? undefined,
    ].filter(Boolean);

    const title =
      titleParts.length > 0
        ? titleParts.join(" · ")
        : "COA (Cannlytics)";

    const sampleCollectedAt = parseDate(row["date_collected"]);
    const sampleTestedAt = parseDate(row["date_tested"]);

    if (dryRun) {
      totalUpserts++;
      continue;
    }

    // Idempotent-ish: reuse an existing document if we find one for the
    // same source, title, and lab.
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
      sampleId,
      licenseRef,
      productName,
      productType: row["product_type"] ?? null,
      cultivarName: row["strain"] ?? null,
      brandName,
      jurisdiction: state,
      fileType: coaUrl ? "url" : null,
      fileUrl: coaUrl,
      sourceType: "etl-cannlytics-coas",
      sourceUrl,
      status: "parsed",
      rawText: JSON.stringify(row),
      parsedSummary: row as unknown as Record<string, unknown>,
      // Keep a bit of extra structured context
      sampleCollectedAt,
      sampleTestedAt,
    };

    if (existing) {
      await prisma.coaDocument.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.coaDocument.create({ data });
    }

    totalUpserts++;
  }

  return {
    dryRun,
    totalFetched: rows.length,
    totalFiltered: filtered.length,
    totalProcessed: toProcess.length,
    totalUpserts,
    totalSkipped,
    states: Array.from(statesSeen).sort(),
    notes: [
      "Source: Cannlytics COA metadata API",
      "This job only populates CoaDocument; Batch / LabResult enrichment can be layered on later.",
    ],
  };
}
