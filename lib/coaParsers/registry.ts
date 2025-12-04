/**
 * Temporary COA parser registry stub for local development.
 * The real implementation should route to lab / jurisdiction-specific parsers.
 */

export interface ParsedCoaResult {
  labName?: string | null;
  productName?: string | null;
  lotNumber?: string | null;
  rawText?: string;
  [key: string]: unknown;
}

// Keep the signature very relaxed so whatever the API route passes will compile.
export async function parseCoa(file: any, options?: any): Promise<ParsedCoaResult> {
  return {
    ...(typeof options === "object" ? options : {}),
    rawText: "",
  };
}
