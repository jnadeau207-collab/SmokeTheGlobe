// src/lib/etl/stateLicenseUtils.ts
//
// Shared helpers for state-specific license ETL modules.
// These are intentionally generic; each state module will
// provide its own column mapping.

import { parse } from "csv-parse/sync";

export type RawRow = Record<string, any>;

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

export interface NormalizedLicense {
  stateCode: string;
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

export const US_STATE_CODES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
  "DC","PR","GU","VI"
]);

export function pickField(row: RawRow, candidates: string[]): string | null {
  for (const cand of candidates) {
    const variations = [cand, cand.toLowerCase(), cand.toUpperCase()];
    for (const key of variations) {
      if (Object.prototype.hasOwnProperty.call(row, key)) {
        const value = row[key];
        if (value !== undefined && value !== null) {
          const s = String(value).trim();
          if (s !== "") return s;
        }
      }
    }
  }
  return null;
}

export function asFloat(value: string | null): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.+-]/g, "");
  if (!cleaned) return null;
  const num = Number.parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
}

export function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function parseCsv(text: string): RawRow[] {
  return parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  }) as RawRow[];
}
