// src/lib/etl/cannlyticsLicenses.ts
//
// ETL for the Cannlytics "cannabis_licenses" dataset.
// Normalizes rows into the StateLicense model and either
// creates or updates records by (stateCode, licenseNumber).
//
// Data fields reference:
// https://huggingface.co/datasets/cannlytics/cannabis_licenses
//

import { parse } from "csv-parse/sync";
import { prisma } from "@/lib/prisma";

type RawRow = Record<string, any>;

export interface LicenseEtlResult {
  ok: boolean;
  dryRun: boolean;
  totalFetched: number;
  totalFiltered: number;
  totalProcessed: number;
  totalUpserts: number;
  totalSkipped: number;
  states: string[];
}

export interface CannlyticsEtlOptions {
  limit?: number;
  dryRun?: boolean;
  states?: string[]; // e.g. ["CA","ME"]
}

interface NormalizedLicense {
  stateCode: string;        // 2‑letter state code
  licenseNumber: string;
  licenseType: string;
  status: string;
  entityName: string;
  countryCode: string;
  regionCode: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  issuedAt: Date | null;
  expiresAt: Date | null;
  sourceUrl: string | null;
  sourceSystem: string | null;
  rawData: Record<string, unknown>;
}

// 50 states + DC/territories we might see in Cannlytics.
const US_STATE_CODES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
  "DC","PR","GU","VI"
]);

function pickField(row: RawRow, candidates: string[]): string | null {
  for (const cand of candidates) {
    const variants = [cand, cand.toLowerCase(), cand.toUpperCase()];
    for (const key of variants) {
      if (Object.prototype.hasOwnProperty.call(row, key)) {
        const value = row[key];
        if (value !== undefined && value !== null) {
          const str = String(value).trim();
          if (str !== "") return str;
        }
      }
    }
  }
  return null;
}

function asFloat(value: string | null): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.+-]/g, "");
  if (!cleaned) return null;
  const num = Number.parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Many open data sources are ISO (YYYY‑MM‑DD) or US (MM/DD/YYYY).
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d;
}

function normalizeRow(
  row: RawRow,
  allowedStates?: Set<string>
): NormalizedLicense | null {
  const rawStateCode = pickField(row, [
    "premise_state",
    "state",
    "state_code",
    "jurisdiction"
  ]);

  const stateCode = rawStateCode?.toUpperCase() ?? null;
  if (!stateCode) return null;
  if (!US_STATE_CODES.has(stateCode)) return null;
  if (allowedStates && !allowedStates.has(stateCode)) return null;

  const licenseNumber = pickField(row, [
    "license_number",
    "licenseNumber",
    "license_nbr",
    "license"
  ]);

  const entityName = pickField(row, [
    "business_legal_name",
    "business_dba_name",
    "licensee",
    "licensee_name",
    "business_name",
    "trade_name",
    "company",
    "name"
  ]);

  if (!licenseNumber || !entityName) {
    return null;
  }

  const status =
    pickField(row, ["license_status", "status"]) ?? "Unknown";

  const licenseType =
    pickField(row, ["license_type", "type", "activity_license_type"]) ??
    "Unknown";

  const city = pickField(row, ["premise_city", "city"]);

  const latitude = asFloat(
    pickField(row, ["premise_latitude", "latitude"])
  );
  const longitude = asFloat(
    pickField(row, ["premise_longitude", "longitude"])
  );

  const issuedAt = parseDate(
    pickField(row, [
      "issue_date",
      "license_issue_date",
      "issued_date"
    ])
  );
  const expiresAt = parseDate(
    pickField(row, [
      "expiration_date",
      "license_expiration_date",
      "exp_date"
    ])
  );

  const sourceUrl =
    pickField(row, ["source_url", "source"]) ??
    "https://huggingface.co/datasets/cannlytics/cannabis_licenses";

  const sourceSystem =
    pickField(row, [
      "licensing_authority",
      "licensing_authority_id"
    ]) ?? "cannlytics";

  return {
    stateCode,
    licenseNumber,
    licenseType,
    status,
    entityName,
    countryCode: "US",
    regionCode: stateCode,
    city: city ?? null,
    latitude,
    longitude,
    issuedAt,
    expiresAt,
    sourceUrl,
    sourceSystem,
    rawData: row as Record<string, unknown>
  };
}

/**
 * Main ETL entry point.
 *
 * - Reads CSV from ETL_CANNABIS_LICENSES_URL or a default Cannlytics URL.
 * - Normalizes into StateLicense objects.
 * - In dryRun mode: just returns counts, no DB writes.
 * - In live mode: for each (stateCode, licenseNumber), create or update.
 */
export async function runCannlyticsLicensesEtl(
  options: CannlyticsEtlOptions = {}
): Promise<LicenseEtlResult> {
  const {
    limit,
    dryRun = false,
    states
  } = options;

  const allowedStates =
    states && states.length > 0
      ? new Set(states.map((s) => s.toUpperCase()))
      : undefined;

  const url =
    process.env.ETL_CANNABIS_LICENSES_URL ||
    "https://huggingface.co/datasets/cannlytics/cannabis_licenses/resolve/main/data/all/licenses-all-latest.csv";

  console.log("[etl:cannlytics] Fetching CSV from", url);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `[etl:cannlytics] Failed to fetch CSV: ${res.status} ${res.statusText}`
    );
  }

  const csvText = await res.text();

  const rows = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  }) as RawRow[];

  const totalFetched = rows.length;
  let totalFiltered = 0;
  let totalProcessed = 0;
  let totalUpserts = 0;
  let totalSkipped = 0;

  const normalized: NormalizedLicense[] = [];

  for (const row of rows) {
    if (limit && normalized.length >= limit) break;

    const lic = normalizeRow(row, allowedStates);
    if (!lic) {
      totalSkipped += 1;
      continue;
    }

    totalFiltered += 1;
    normalized.push(lic);
  }

  totalProcessed = normalized.length;

  if (!dryRun) {
    for (const lic of normalized) {
      // No composite unique yet, so do a find‑then‑update/create.
      const existing = await prisma.stateLicense.findFirst({
        where: {
          stateCode: lic.stateCode,
          licenseNumber: lic.licenseNumber
        },
        select: { id: true }
      });

      const data = {
        stateCode: lic.stateCode,
        licenseNumber: lic.licenseNumber,
        licenseType: lic.licenseType,
        status: lic.status,
        entityName: lic.entityName,
        countryCode: lic.countryCode,
        regionCode: lic.regionCode,
        city: lic.city ?? undefined,
        latitude: lic.latitude ?? undefined,
        longitude: lic.longitude ?? undefined,
        issuedAt: lic.issuedAt ?? undefined,
        expiresAt: lic.expiresAt ?? undefined,
        sourceUrl: lic.sourceUrl ?? undefined,
        sourceSystem: lic.sourceSystem ?? undefined,
        rawData: lic.rawData
      };

      if (existing) {
        await prisma.stateLicense.update({
          where: { id: existing.id },
          data
        });
      } else {
        await prisma.stateLicense.create({ data });
      }

      totalUpserts += 1;
    }
  }

  console.log(
    "[etl:cannlytics] Done.",
    JSON.stringify(
      {
        dryRun,
        totalFetched,
        totalFiltered,
        totalProcessed,
        totalUpserts,
        totalSkipped,
        states: states ?? "ALL"
      },
      null,
      2
    )
  );

  return {
    ok: true,
    dryRun,
    totalFetched,
    totalFiltered,
    totalProcessed,
    totalUpserts,
    totalSkipped,
    states: states ?? ["ALL"]
  };
}
