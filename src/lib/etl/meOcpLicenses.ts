// src/lib/etl/meOcpLicenses.ts
//
// Maine Office of Cannabis Policy (OCP) adult-use licenses.
//
// Data source: OCP adult-use open data portal (CSV/XLSX download).
// You should configure ETL_ME_LICENSES_URL to point at a CSV
// that includes at least: license number, business name,
// license type, city, status, issue/expiration dates, etc.
//
// IMPORTANT: Always review OCP's data use terms before
// automating fetches, and respect any rate limits or usage
// restrictions they specify.

import { prisma } from "@/lib/prisma";
import {
  asFloat,
  LicenseEtlResult,
  NormalizedLicense,
  parseCsv,
  parseDate,
  pickField,
  US_STATE_CODES
} from "./stateLicenseUtils";

export interface MeOcpEtlOptions {
  limit?: number;
  dryRun?: boolean;
}

export async function runMeOcpLicensesEtl(
  options: MeOcpEtlOptions = {}
): Promise<LicenseEtlResult> {
  const { limit, dryRun = false } = options;

  const url = process.env.ETL_ME_LICENSES_URL;
  if (!url) {
    throw new Error(
      "ETL_ME_LICENSES_URL is not set. Configure it to point at a Maine OCP license CSV."
    );
  }

  console.log("[etl:ME_OCP] Fetching CSV from", url);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `[etl:ME_OCP] Failed to fetch CSV: ${res.status} ${res.statusText}`
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

    // TODO: map Maine OCP columns → NormalizedLicense.
    // For now, we just count and skip, so you can safely
    // wire this into admin tooling without DB writes.

    totalSkipped += 1;
  }

  totalProcessed = normalized.length;
  const stateCode = "ME";

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
