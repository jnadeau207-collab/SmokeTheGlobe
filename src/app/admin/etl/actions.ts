// src/app/admin/etl/actions.ts
"use server";

import { runCannlyticsLicensesEtl } from "@/lib/etl/cannlyticsLicenses";
import { runNyOcmLicensesEtl } from "@/lib/etl/nyOcmLicenses";
import type { EtlResult as NyOcmEtlResult } from "@/lib/etl/nyOcmLicenses";
import {
  ingestCoasFromUploadedDocs,
  type CoaIngestResult,
} from "@/lib/etl/coaFromUpload";
import {
  runCannlyticsCoasEtl,
  type CoaEtlRunResult,
} from "@/lib/etl/coaFromCannlytics";
import type { LicenseEtlResult } from "@/lib/etl/stateLicenseUtils";

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

/**
 * Map a LicenseEtlResult (used by most license ETL modules) into the
 * generic EtlRunResult consumed by the ETL control panel.
 */
function mapLicenseEtlResult(
  label: string,
  result: LicenseEtlResult,
): EtlRunResult {
  const notes: string[] = [];

  notes.push(
    `Fetched ${result.totalFetched} rows, filtered to ${result.totalFiltered}, processed ${result.totalProcessed}.`,
  );
  notes.push(
    `Upserts: ${result.totalUpserts}, skipped: ${result.totalSkipped}.`,
  );

  if (result.states && result.states.length > 0) {
    notes.push(`States seen: ${result.states.join(", ")}`);
  }

  return {
    label,
    ok: result.ok,
    dryRun: result.dryRun,
    processed: result.totalProcessed,
    upserts: result.totalUpserts,
    skipped: result.totalSkipped,
    notes,
  };
}

/**
 * Map the NY OCM ETL result shape into EtlRunResult.
 */
function mapNyOcmResult(
  label: string,
  result: NyOcmEtlResult,
  dryRun: boolean,
): EtlRunResult {
  const upserts = result.created + result.updated;
  const notes: string[] = [];

  notes.push(
    `Total rows: ${result.totalRows}, processed: ${result.processed}.`,
  );
  notes.push(
    `Created: ${result.created}, updated: ${result.updated}, skipped: ${result.skipped}, errors: ${result.errors}.`,
  );

  return {
    label,
    ok: result.errors === 0,
    dryRun,
    processed: result.processed,
    upserts,
    skipped: result.skipped + result.errors,
    notes,
  };
}

/**
 * Map Cannlytics COA ETL results into EtlRunResult.
 */
function mapCoaEtlResult(label: string, result: CoaEtlRunResult): EtlRunResult {
  const summaryNotes: string[] = [];

  summaryNotes.push(
    `Fetched ${result.totalFetched} rows, filtered to ${result.totalFiltered}, processed ${result.totalProcessed}.`,
  );
  summaryNotes.push(
    `Upserts: ${result.totalUpserts}, skipped: ${result.totalSkipped}.`,
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

/**
 * Simple helper for ETL modules that are still stubbed out.
 */
function stubStateFeed(label: string, dryRun: boolean): Promise<EtlRunResult> {
  return Promise.resolve({
    label,
    ok: true,
    dryRun,
    processed: 0,
    upserts: 0,
    skipped: 0,
    notes: [
      "State-specific canonical feed is stubbed.",
      "Wire to official CSV/API once a stable, legally usable endpoint is selected.",
    ],
  });
}

// -------- Cannlytics – Global Licenses --------

export async function runCannlyticsDryRun(): Promise<EtlRunResult> {
  const result = await runCannlyticsLicensesEtl({
    dryRun: true,
    limit: 200,
  });

  return mapLicenseEtlResult("Cannlytics – All States (dry run)", result);
}

export async function runCannlyticsFull(): Promise<EtlRunResult> {
  const result = await runCannlyticsLicensesEtl({
    dryRun: false,
    limit: undefined,
  });

  return mapLicenseEtlResult("Cannlytics – All States (full sync)", result);
}

// -------- NY OCM – Canonical Licenses --------

export async function runNyOcmDryRun(): Promise<EtlRunResult> {
  const result = await runNyOcmLicensesEtl({
    dryRun: true,
    limit: 200,
  });

  return mapNyOcmResult("NY OCM – Licenses (dry run)", result, true);
}

export async function runNyOcmFull(): Promise<EtlRunResult> {
  const result = await runNyOcmLicensesEtl({
    dryRun: false,
    limit: undefined,
  });

  return mapNyOcmResult("NY OCM – Licenses (full sync)", result, false);
}

// -------- Stubbed State Feeds (Phase 1 scaffolding) --------

export async function runMeOcpDryRun(): Promise<EtlRunResult> {
  // Stubbed for now; wire to runMeOcpLicensesEtl when ready.
  return stubStateFeed("Maine OCP – Licenses (dry run)", true);
}

export async function runMeOcpFull(): Promise<EtlRunResult> {
  return stubStateFeed("Maine OCP – Licenses (full sync)", false);
}

export async function runCaDccDryRun(): Promise<EtlRunResult> {
  return stubStateFeed("California DCC – Licenses (dry run)", true);
}

export async function runCaDccFull(): Promise<EtlRunResult> {
  return stubStateFeed("California DCC – Licenses (full sync)", false);
}

export async function runWaLcbDryRun(): Promise<EtlRunResult> {
  return stubStateFeed("Washington LCB – Licenses (dry run)", true);
}

export async function runWaLcbFull(): Promise<EtlRunResult> {
  return stubStateFeed("Washington LCB – Licenses (full sync)", false);
}

export async function runMaCccDryRun(): Promise<EtlRunResult> {
  return stubStateFeed("Massachusetts CCC – Licenses (dry run)", true);
}

export async function runMaCccFull(): Promise<EtlRunResult> {
  return stubStateFeed("Massachusetts CCC – Licenses (full sync)", false);
}

// -------- COA ingestion from uploaded documents --------

export async function runCoaIngestFromUploadsDryRun(): Promise<EtlRunResult> {
  const result: CoaIngestResult = await ingestCoasFromUploadedDocs({
    dryRun: true,
    limit: 50,
  });

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
  const result: CoaIngestResult = await ingestCoasFromUploadedDocs({
    dryRun: false,
    limit: 500,
  });

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

// -------- Cannlytics COAs – global metadata feed --------

export async function runCannlyticsCoasDryRun(): Promise<EtlRunResult> {
  const result = await runCannlyticsCoasEtl({
    dryRun: true,
    limit: 2_000,
  });

  return mapCoaEtlResult("Cannlytics COAs – Dry Run", result);
}

export async function runCannlyticsCoasFull(): Promise<EtlRunResult> {
  const result = await runCannlyticsCoasEtl({
    dryRun: false,
    limit: 50_000,
  });

  return mapCoaEtlResult("Cannlytics COAs – Full Sync", result);
}
