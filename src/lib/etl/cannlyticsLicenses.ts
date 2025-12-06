// src/lib/etl/cannlyticsLicenses.ts
//
// Phase 0 ETL: Ingest cannabis license data from the Cannlytics
// `cannabis_licenses` dataset into StateLicense.
//
// You must ensure your use complies with the dataset's CC BY 4.0 license
// and any applicable laws or terms. See:
// https://huggingface.co/datasets/cannlytics/cannabis_licenses
//
// This module is server-only.

import { prisma } from "@/lib/prisma";
import { parse } from "csv-parse/sync";
import fs from "node:fs/promises";

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

type NormalizedLicense = {
  licenseNumber: string;
  entityName: string;
  countryCode: string;
  regionCode: string;
  city: string;
  stateCode: string;
  licenseType: string;
  status: string;
};

function normalizeRow(row: Record<string, string>): NormalizedLicense | null {
  const rawLicense =
    (row["license_number"] ||
      row["LICENSE_NUMBER"] ||
      row["licenseNumber"] ||
      "").trim();

  const legalName =
    (row["business_legal_name"] ||
      row["BUSINESS_LEGAL_NAME"] ||
      row["businessLegalName"] ||
      "").trim();

  const dbaName =
    (row["business_dba_name"] ||
      row["BUSINESS_DBA_NAME"] ||
      row["businessDbaName"] ||
      "").trim();

  const city =
    (row["premise_city"] ||
      row["PREMISE_CITY"] ||
      row["city"] ||
      "").trim();

  const state =
    (row["premise_state"] ||
      row["PREMISE_STATE"] ||
      row["state"] ||
      "").trim();

  const country =
    (row["premise_country"] ||
      row["PREMISE_COUNTRY"] ||
      row["country"] ||
      "US").trim() || "US";

  const licenseTypeRaw =
    (row["license_type"] ||
      row["LICENSE_TYPE"] ||
      row["licenseType"] ||
      row["activity"] ||
      "").trim();

  const statusRaw =
    (row["license_status"] ||
      row["LICENSE_STATUS"] ||
      row["licenseStatus"] ||
      row["status"] ||
      "").trim();

  if (!rawLicense || (!legalName && !dbaName)) {
    return null;
  }

  const entityName = dbaName || legalName;
  const stateCode = state ? state.toUpperCase() : "NA";
  const countryCode = country.toUpperCase() || "US";
  const licenseType = licenseTypeRaw || "Unknown";
  const status = statusRaw || "Unknown";

  return {
    licenseNumber: rawLicense,
    entityName,
    countryCode,
    regionCode: stateCode,
    city,
    stateCode,
    licenseType,
    status,
  };
}

async function loadCsvText(): Promise<string> {
  const localPath = process.env.ETL_CANNABIS_LICENSES_LOCAL_PATH;
  if (localPath) {
    console.log("[ETL] Using local Cannlytics CSV from", localPath);
    return await fs.readFile(localPath, "utf8");
  }

  const url = process.env.ETL_CANNABIS_LICENSES_URL;
  if (!url) {
    throw new Error(
      "ETL_CANNABIS_LICENSES_URL is not set. Add it to your .env.local (e.g. https://huggingface.co/datasets/cannlytics/cannabis_licenses/resolve/main/data/all/licenses-all-latest.csv)."
    );
  }

  console.log("[ETL] Downloading Cannlytics licenses CSV from", url);
  const response = await fetch(url);
  if (!response.ok) {
    const bodySnippet = await response.text().catch(() => "");
    throw new Error(
      `Failed to download Cannlytics licenses CSV. HTTP ${response.status}. Response snippet: ${bodySnippet.slice(
        0,
        200
      )}`
    );
  }

  return await response.text();
}

export async function runCannlyticsLicensesEtl(
  options: EtlOptions = {}
): Promise<EtlResult> {
  const { limit, dryRun } = options;

  const csvText = await loadCsvText();

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
  const batchSize = 200;

  for (let i = 0; i < toProcess.length; i += batchSize) {
    const batch = toProcess.slice(i, i + batchSize);

    const ops = batch.map(async (row) => {
      const normalized = normalizeRow(row);
      if (!normalized) {
        result.skipped += 1;
        return;
      }

      const {
        licenseNumber,
        entityName,
        countryCode,
        regionCode,
        city,
        stateCode,
        licenseType,
        status,
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
        const existing = await prisma.stateLicense.findFirst({
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
              stateCode,
              licenseType,
              status,
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
              stateCode,
              licenseType,
              status,
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

  console.log("[ETL] Cannlytics licenses ETL complete", result);
  return result;
}
