// src/lib/etl/nyOcmLicenses.ts
//
// Phase 1 ETL: Ingest New York Office of Cannabis Management
// "Current OCM Licenses" dataset into StateLicense.
//
// Dataset: https://data.ny.gov/Economic-Development/Current-OCM-Licenses/jskf-tt3q
// API:     https://data.ny.gov/resource/jskf-tt3q.json
//
// This module is server-only; don't import it into client components.
// All access is read-only and uses the official Socrata Open Data API.
// You are responsible for complying with New York's Open Data terms
// and any other applicable laws when using this data.

import { prisma } from "@/lib/prisma";

export type EtlOptions = {
  limit?: number;
  dryRun?: boolean;
};

export type EtlResult = {
  totalRows: number;
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
};

// Partial shape of the NY OCM "Current OCM Licenses" dataset.
type NyOcmLicenseRow = {
  license_number?: string;
  license_type?: string;
  license_type_code?: string;
  license_status?: string;
  license_status_code?: string;
  entity_name?: string;
  dba?: string;
  city?: string;
  state?: string;
  county?: string;
  zip_code?: string;
  issued_date?: string;
  effective_date?: string;
  expiration_date?: string;
  latitude?: string;
  longitude?: string;
  [key: string]: any;
};

type NormalizedLicense = {
  licenseNumber: string;
  entityName: string;
  stateCode: string;
  countryCode: string;
  regionCode: string | null;
  city: string | null;
  licenseType: string;
  status: string;
  issuedAt: Date | null;
  expiresAt: Date | null;
  latitude: number | null;
  longitude: number | null;
  sourceUrl: string;
  sourceSystem: string;
  rawData: any;
};

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const timestamp = Date.parse(trimmed);
  if (Number.isNaN(timestamp)) return null;
  return new Date(timestamp);
}

function parseFloatOrNull(value?: string): number | null {
  if (!value) return null;
  const n = parseFloat(value);
  return Number.isNaN(n) ? null : n;
}

/**
 * Normalize a NY OCM row into our StateLicense shape.
 */
function normalizeNyRow(
  row: NyOcmLicenseRow,
  sourceUrl: string
): NormalizedLicense | null {
  const licenseNumber = (row.license_number ?? "").trim();

  const entityNameRaw = (row.entity_name ?? "").trim();
  const dba = (row.dba ?? "").trim();
  const entityName = entityNameRaw || dba;

  if (!licenseNumber || !entityName) {
    // Skip rows without a usable key + name.
    return null;
  }

  const city = (row.city ?? "").trim() || null;
  const state = (row.state ?? "NY").trim() || "NY";
  const countryCode = "US";
  const regionCode = state || "NY";

  const licenseTypeRaw =
    (row.license_type ?? row.license_type_code ?? "").toString().trim();
  const statusRaw =
    (row.license_status ?? row.license_status_code ?? "").toString().trim();

  const licenseType = licenseTypeRaw || "unknown";
  const status = statusRaw || "unknown";

  const issuedAt = parseDate(row.issued_date);
  const expiresAt = parseDate(row.expiration_date);

  const latitude = parseFloatOrNull(row.latitude);
  const longitude = parseFloatOrNull(row.longitude);

  return {
    licenseNumber,
    entityName,
    stateCode: state,
    countryCode,
    regionCode,
    city,
    licenseType,
    status,
    issuedAt,
    expiresAt,
    latitude,
    longitude,
    sourceUrl,
    sourceSystem: "NY_OCM_OPEN_DATA",
    rawData: row,
  };
}

export async function runNyOcmLicensesEtl(
  options: EtlOptions = {}
): Promise<EtlResult> {
  const { limit, dryRun } = options;

  const url = process.env.ETL_NY_OCM_LICENSES_URL;
  if (!url) {
    throw new Error(
      "ETL_NY_OCM_LICENSES_URL is not set. " +
        "Add it to your .env.local, e.g. " +
        '"https://data.ny.gov/resource/jskf-tt3q.json".'
    );
  }

  const headers: Record<string, string> = {};
  if (process.env.NY_OPEN_DATA_APP_TOKEN) {
    headers["X-App-Token"] = process.env.NY_OPEN_DATA_APP_TOKEN;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(
      `Failed to download NY OCM licenses JSON. HTTP ${response.status}`
    );
  }

  const rows = (await response.json()) as NyOcmLicenseRow[];

  const result: EtlResult = {
    totalRows: rows.length,
    processed: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  const seen = new Set<string>();
  const toProcess =
    typeof limit === "number" ? rows.slice(0, limit) : rows;

  const batchSize = 200;
  for (let i = 0; i < toProcess.length; i += batchSize) {
    const batch = toProcess.slice(i, i + batchSize);

    const ops = batch.map(async (row) => {
      const normalized = normalizeNyRow(row, url);
      if (!normalized) {
        result.skipped += 1;
        return;
      }

      const {
        licenseNumber,
        entityName,
        stateCode,
        countryCode,
        regionCode,
        city,
        licenseType,
        status,
        issuedAt,
        expiresAt,
        latitude,
        longitude,
        sourceUrl,
        sourceSystem,
        rawData,
      } = normalized;

      if (seen.has(licenseNumber)) {
        result.skipped += 1;
        return;
      }
      seen.add(licenseNumber);

      result.processed += 1;

      if (dryRun) {
        return;
      }

      try {
        const existing = await prisma.stateLicense.findUnique({
          where: { licenseNumber },
          select: { id: true },
        });

        const baseData = {
          licenseNumber,
          entityName,
          stateCode,
          countryCode,
          regionCode,
          city,
          licenseType,
          status,
          issuedAt,
          expiresAt,
          latitude,
          longitude,
          sourceUrl,
          sourceSystem,
          rawData,
        };

        if (existing) {
          await prisma.stateLicense.update({
            where: { id: existing.id },
            data: baseData,
          });
          result.updated += 1;
        } else {
          await prisma.stateLicense.create({
            data: baseData,
          });
          result.created += 1;
        }
      } catch (err) {
        console.error(
          "[ETL] Error upserting NY StateLicense for licenseNumber",
          licenseNumber,
          err
        );
        result.errors += 1;
      }
    });

    await Promise.all(ops);
  }

  return result;
}
