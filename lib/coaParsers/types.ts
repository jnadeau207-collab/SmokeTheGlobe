// lib/coaParsers/types.ts

export type ParsedContaminant = {
  group:
    | 'PESTICIDE'
    | 'MICROBIAL'
    | 'HEAVY_METAL'
    | 'SOLVENT'
    | 'MYCOTOXIN'
    | 'OTHER';
  name: string;
  status: 'PASS' | 'FAIL' | 'NA';
  valueRaw?: string;
};

export type ParsedCoa = {
  labName?: string;
  labCity?: string;
  labStateCode?: string; // e.g. "ME", "CA"

  producerName?: string;
  producerCity?: string;
  producerStateCode?: string;

  batchCode?: string;
  productName?: string;

  thcPercent?: number | null;
  cbdPercent?: number | null;
  totalCannabinoidsPercent?: number | null;
  overallPass?: boolean | null;

  contaminants: ParsedContaminant[];
};

export type LabParser = (text: string) => ParsedCoa | null;
