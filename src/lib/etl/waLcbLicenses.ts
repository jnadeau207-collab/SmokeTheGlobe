// src/lib/etl/waLcbLicenses.ts
//
// Washington State Liquor and Cannabis Board licenses.
//
// Data source: LCB "Frequently Requested Lists" (cannabis licenses, labs).
// These are typically downloadable spreadsheets. For automated use, it's
// safest to export/convert them to CSV and host them somewhere you control,
// then set ETL_WA_LICENSES_URL to that CSV.
//
// Always verify the LCB's terms of use before automating.

import { prisma } from "@/lib/prisma";
import {
  LicenseEtlResult,
  NormalizedLicense,
  parseCsv
} from "./stateLicenseUtils";

export interface WaLcbEtlOptions {
  limit?: number;
  dryRun?: boolean;
}

export async function runWaLcbLicensesEtl(
  options: WaLcbEtlOptions = {}
): Promise<LicenseEtlResult> {
  const { limit, dryRun = false } = options;

  const url = process.env.ETL_WA_LICENSES_URL;
  if (!url) {
    throw new Error(
      "ETL_WA_LICENSES_URL is not set. Configure it to point at a WA LCB license CSV."
    );
  }

  console.log("[etl:WA_LCB] Fetching CSV from", url);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `[etl:WA_LCB] Failed to fetch CSV: ${res.status} ${res.statusText}`
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

    // TODO: map WA LCB columns → NormalizedLicense.
    totalSkipped += 1;
  }

  totalProcessed = normalized.length;
  const stateCode = "WA";

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
