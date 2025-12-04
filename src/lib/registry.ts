// src/lib/coaParsers/registry.ts

/**
 * Temporary COA parser registry stub for local development.
 * The real implementation can route to lab / jurisdiction-specific parsers.
 */

export interface ParsedCoaResult {
  labName?: string | null;
  productName?: string | null;
  lotNumber?: string | null;
  rawText?: string;
  // allow arbitrary extracted fields
  [key: string]: unknown;
}

// Signature kept loose so existing calls compile.
export async function parseCoa(
  file: any,
  options?: any
): Promise<ParsedCoaResult> {
  return {
    ...(typeof options === "object" ? options : {}),
    rawText: "",
  };
}
