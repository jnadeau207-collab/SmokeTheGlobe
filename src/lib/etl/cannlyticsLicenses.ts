// src/lib/etl/cannlyticsLicenses.ts
//
// Phase 0 ETL: Ingest cannabis license data from the Cannlytics
// `cannabis_licenses` dataset into StateLicense.
//
// This uses a CSV file specified via ETL_CANNABIS_LICENSES_URL.
// YOU are responsible for ensuring that your use of that URL/dataset
// complies with its license (CC BY 4.0) and any applicable laws.
//
// This module is server-only; don't import it into client components.

import { prisma } from "@/lib/prisma";
import { parse } from "csv-parse/sync";

type EtlOptions = {
  limit?: number;
  dryRun?: boolean;
};

type EtlResult = {
  totalRows: number;
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
};

/**
 * Normalize a single Cannlytics license row into our StateLicense shape.
 *
 * The Cannlytics dataset uses fields such as:
 *  - license_number
 *  - business_legal_name
 *  - business_dba_name
 *  - premise_city
 *  - premise_state
 *  - premise_country (often "US")
 *
 * We only touch fields we KNOW exist in your Prisma model:
 *  - licenseNumber
 *  - entityName
 *  - countryCode
 *  - regionCode
 *  - city
 */
function normalizeRow(
  row: Record<string, string>
):
  | {
      licenseNumber: string;
      entityName: string;
      countryCode: string;
      regionCode: string;
      city: string;
    }
  | null {
  const rawLicense = (row["license_number"] || row["licenseNumber"] || "").trim();
  const legalName = (row["business_legal_name"] || row["business_legal_name".toUpperCase()] || "").trim();
  const dbaName = (row["business_dba_name"] || row["business_dba_name".toUpperCase()] || "").trim();
  const city = (row["premise_city"] || row["premiseCity"] || "").trim();
  const state = (row["premise_state"] || row["premiseState"] || "").trim();
  const country =
    (row["premise_country"] || row["premiseCountry"] || "US").trim() || "US";

  if (!rawLicense || (!legalName && !dbaName)) {
    return null;
  }

  const entityName = dbaName || legalName;

  return {
    licenseNumber: rawLicense,
    entityName,
    countryCode: country.toUpperCase(),
    regionCode: state.toUpperCase(),
    city,
  };
}

/**
 * Run the Cannlytics licenses ETL:
 *  - Fetch CSV from ETL_CANNABIS_LICENSES_URL
 *  - Parse rows
 *  - Upsert into StateLicense by licenseNumber
 */
export async function runCannlyticsLicensesEtl(
  options: EtlOptions = {}
): Promise<EtlResult> {
  const { limit, dryRun } = options;

  const url = process.env.ETL_CANNABIS_LICENSES_URL;
  if (!url) {
    throw new Error(
      "ETL_CANNABIS_LICENSES_URL is not set. Please add it to your .env.local."
    );
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to download Cannlytics licenses CSV. HTTP ${response.status}`
    );
  }

  const csvText = await response.text();

  const records: Record<string, string>[] = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
  });

  const seen = new Set<string>();
  const result: EtlResult = {
    totalRows: records.length,
    processed: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  const toProcess = typeof limit === "number" ? records.slice(0, limit) : records;

  // Simple batched upsert to avoid massive single transactions.
  const batchSize = 200;
  for (let i = 0; i < toProcess.length; i += batchSize) {
    const batch = toProcess.slice(i, i + batchSize);

    const ops = batch.map(async (row) => {
      const normalized = normalizeRow(row);
      if (!normalized) {
        result.skipped += 1;
        return;
      }

      const { licenseNumber, entityName, countryCode, regionCode, city } =
        normalized;

      if (seen.has(licenseNumber)) {
        result.skipped += 1;
        return;
      }
      seen.add(licenseNumber);

      result.processed += 1;

      if (dryRun) {
        // In dryRun we just count rows and skip DB writes.
        return;
      }

      try {
        // We assume licenseNumber is unique or at least stable enough
        // to use as a natural key. If it's not unique in your schema,
        // consider adding a unique index or using a composite key.
        const existing = await prisma.stateLicense.findUnique({
          where: { licenseNumber },
          select: { id: true },
        });

        if (existing) {
          await prisma.stateLicense.update({
            where: { id: existing.id },
            data: {
              entityName,
              countryCode,
              regionCode,
              city,
            },
          });
          result.updated += 1;
        } else {
          await prisma.stateLicense.create({
            data: {
              licenseNumber,
              entityName,
              countryCode,
              regionCode,
              city,
            },
          });
          result.created += 1;
        }
      } catch (err) {
        console.error(
          "[ETL] Error upserting StateLicense for licenseNumber",
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
