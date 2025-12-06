// src/lib/etl/caDccLicenses.ts
//
// California Department of Cannabis Control (DCC) licenses.
//
// Data source: DCC license listings or open-data downloads, if available.
// Configure ETL_CA_LICENSES_URL to point to a CSV that you are legally
// allowed to automate against.
//
// NOTE: Some CA resources are interactive search tools rather than static
// CSVs. If there is no documented API, consider a separate offline job
// that periodically exports a clean CSV to S3, and point this ETL at it.

import { prisma } from "@/lib/prisma";
import {
  LicenseEtlResult,
  NormalizedLicense,
  parseCsv
} from "./stateLicenseUtils";

export interface CaDccEtlOptions {
  limit?: number;
  dryRun?: boolean;
}

export async function runCaDccLicensesEtl(
  options: CaDccEtlOptions = {}
): Promise<LicenseEtlResult> {
  const { limit, dryRun = false } = options;

  const url = process.env.ETL_CA_LICENSES_URL;
  if (!url) {
    throw new Error(
      "ETL_CA_LICENSES_URL is not set. Configure it to point at a California DCC license CSV."
    );
  }

  console.log("[etl:CA_DCC] Fetching CSV from", url);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `[etl:CA_DCC] Failed to fetch CSV: ${res.status} ${res.statusText}`
    );
  }

  const csvText = await res.text();
  const rows = parseCsv(csvText);

  const totalFetched = rows.length;
  let totalFiltered = 0;
  let totalProcessed = 0;
  let totalUpserts = 0;
  let totalSkipped = 0;

  const normalized: NormalizedLicense[] = [];

  for (const row of rows) {
    if (limit && normalized.length >= limit) break;

    // TODO: map CA DCC columns → NormalizedLicense.
    totalSkipped += 1;
  }

  totalProcessed = normalized.length;
  const stateCode = "CA";

  if (!dryRun && normalized.length > 0) {
    for (const lic of normalized) {
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

  return {
    ok: true,
    dryRun,
    totalFetched,
    totalFiltered,
    totalProcessed,
    totalUpserts,
    totalSkipped,
    states: [stateCode]
  };
}
