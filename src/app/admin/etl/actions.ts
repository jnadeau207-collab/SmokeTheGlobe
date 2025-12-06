// src/app/admin/etl/actions.ts
"use server";

import { runCannlyticsLicensesEtl } from "@/lib/etl/cannlyticsLicenses";
import { runNyOcmLicensesEtl } from "@/lib/etl/nyOcmLicenses";
import { runMeOcpLicensesEtl } from "@/lib/etl/meOcpLicenses";
import { runCaDccLicensesEtl } from "@/lib/etl/caDccLicenses";
import { runMaCccLicensesEtl } from "@/lib/etl/maCccLicenses";
import { runWaLcbLicensesEtl } from "@/lib/etl/waLcbLicenses";
import { ingestCoasFromUploadedDocs } from "@/lib/etl/coaFromUpload";
import { runCannlyticsCoasEtl } from "@/lib/etl/coaFromCannlytics";
import type { CoaEtlRunResult } from "@/lib/etl/coaFromCannlytics";

// A common shape for ETL results we surface in the UI
export interface EtlRunResult {
  label: string;
  ok: boolean;
  dryRun: boolean;
  processed: number;
  upserts: number;
  skipped: number;
  notes: string[];
}

function mapEtlResult(result: CoaEtlRunResult, label: string): EtlRunResult {
  const summaryNotes: string[] = [];

  summaryNotes.push(
    `Fetched ${result.totalFetched} rows, filtered to ${result.totalFiltered}, processed ${result.totalProcessed}.`
  );
  summaryNotes.push(
    `Upserts: ${result.totalUpserts}, skipped: ${result.totalSkipped}.`
  );

  if (result.states.length > 0) {
    summaryNotes.push(`States seen: ${result.states.join(", ")}`);
  }

  if (result.notes && result.notes.length > 0) {
    summaryNotes.push(...result.notes);
  }

  return {
    label,
    ok: true,
    dryRun: result.dryRun,
    processed: result.totalProcessed,
    upserts: result.totalUpserts,
    skipped: result.totalSkipped,
    notes: summaryNotes,
  };
}

// Cannlytics – All States
export async function runCannlyticsCoasDryRun(): Promise<EtlRunResult> {
  "use server";

  const result = await runCannlyticsCoasEtl({
    dryRun: true,
    limit: 2_000,
  });

  return mapEtlResult(result, "Cannlytics COAs – Dry Run");
}

export async function runCannlyticsCoasFull(): Promise<EtlRunResult> {
  "use server";

  const result = await runCannlyticsCoasEtl({
    dryRun: false,
    limit: 50_000,
  });

  return mapEtlResult(result, "Cannlytics COAs – Full Sync");
}
export async function runCannlyticsDryRun(): Promise<EtlRunResult> {
  const result = await runCannlyticsLicensesEtl({
    dryRun: true,
    limit: 200,
  });

  return {
    label: "Cannlytics – All States (dry run)",
    ok: true,
    dryRun: true,
    processed: result.processed ?? 0,
    upserts: result.upserts ?? 0,
    skipped: result.skipped ?? 0,
    notes: result.notes ?? [],
  };
}

export async function runCannlyticsFull(): Promise<EtlRunResult> {
  const result = await runCannlyticsLicensesEtl({
    dryRun: false,
    limit: undefined,
  });

  return {
    label: "Cannlytics – All States (full sync)",
    ok: true,
    dryRun: false,
    processed: result.processed ?? 0,
    upserts: result.upserts ?? 0,
    skipped: result.skipped ?? 0,
    notes: result.notes ?? [],
  };
}

// NY OCM – Canonical
export async function runNyOcmDryRun(): Promise<EtlRunResult> {
  const result = await runNyOcmLicensesEtl({
    dryRun: true,
    limit: 200,
  });

  return {
    label: "NY OCM – Licenses (dry run)",
    ok: true,
    dryRun: true,
    processed: result.processed ?? 0,
    upserts: result.upserts ?? 0,
    skipped: result.skipped ?? 0,
    notes: result.notes ?? [],
  };
}

export async function runNyOcmFull(): Promise<EtlRunResult> {
  const result = await runNyOcmLicensesEtl({
    dryRun: false,
    limit: undefined,
  });

  return {
    label: "NY OCM – Licenses (full sync)",
    ok: true,
    dryRun: false,
    processed: result.processed ?? 0,
    upserts: result.upserts ?? 0,
    skipped: result.skipped ?? 0,
    notes: result.notes ?? [],
  };
}

// Stub state canonical feeds – ME / CA / WA / MA
// These don't hit real sources yet – we just return TODO notes.

async function stubStateFeed(label: string, dryRun: boolean): Promise<EtlRunResult> {
  return {
    label,
    ok: true,
    dryRun,
    processed: 0,
    upserts: 0,
    skipped: 0,
    notes: [
      "State-specific canonical feed is stubbed.",
      "Wire to official CSV/API once legal, stable endpoint is selected.",
    ],
  };
}

export async function runMeOcpDryRun() {
  return stubStateFeed("Maine OCP – Licenses (dry run)", true);
}

export async function runMeOcpFull() {
  return stubStateFeed("Maine OCP – Licenses (full sync)", false);
}

export async function runCaDccDryRun() {
  return stubStateFeed("California DCC – Licenses (dry run)", true);
}

export async function runCaDccFull() {
  return stubStateFeed("California DCC – Licenses (full sync)", false);
}

export async function runWaLcbDryRun() {
  return stubStateFeed("Washington LCB – Licenses (dry run)", true);
}

export async function runWaLcbFull() {
  return stubStateFeed("Washington LCB – Licenses (full sync)", false);
}

export async function runMaCccDryRun() {
  return stubStateFeed("Massachusetts CCC – Licenses (dry run)", true);
}

export async function runMaCccFull() {
  return stubStateFeed("Massachusetts CCC – Licenses (full sync)", false);
}

// COA ingestion from uploaded docs – Phase 1
export async function runCoaIngestFromUploadsDryRun(): Promise<EtlRunResult> {
  const result = await ingestCoasFromUploadedDocs({ dryRun: true, limit: 50 });

  return {
    label: "COA ingestion from uploaded documents (dry run)",
    ok: true,
    dryRun: true,
    processed: result.processed,
    upserts: result.upserts,
    skipped: result.skipped,
    notes: result.notes,
  };
}

export async function runCoaIngestFromUploadsFull(): Promise<EtlRunResult> {
  const result = await ingestCoasFromUploadedDocs({ dryRun: false, limit: 500 });

  return {
    label: "COA ingestion from uploaded documents (full run)",
    ok: true,
    dryRun: false,
    processed: result.processed,
    upserts: result.upserts,
    skipped: result.skipped,
    notes: result.notes,
  };
}
