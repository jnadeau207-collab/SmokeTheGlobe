// lib/coaParser.ts

export type ParsedFailure = {
  analyte: string;
  category: string;
  line: string;
};

export type ParsedCOASummary = {
  batchCode?: string | null;
  productName?: string | null;
  labName?: string | null;
  matrix?: string | null;
  sampleId?: string | null;
  collectedOn?: string | null;
  receivedOn?: string | null;
  batchSizeGrams?: number | null;
  sampleSizeGrams?: number | null;

  thcPercent?: number | null;
  cbdPercent?: number | null;
  totalCannabinoidsPercent?: number | null;
  totalTerpenesPercent?: number | null;
  moisturePercent?: number | null;
  waterActivity?: number | null;

  batchResult?: 'PASS' | 'FAIL' | 'UNKNOWN';
  hasAnyFailure: boolean;
  failureReasons: ParsedFailure[];
};

export type ParsedCOA = {
  summary: ParsedCOASummary;
  rawSections: {
    potency?: string;
    terpenes?: string;
    pesticides?: string;
    microbials?: string;
    mycotoxins?: string;
    heavyMetals?: string;
    solvents?: string;
    notes?: string;
  };
};

/**
 * Utility: normalize line endings and compress multiple spaces
 */
function normalizeText(input: string): string {
  return input.replace(/\r\n/g, '\n');
}

/**
 * Utility: extract first match group as string or null
 */
function matchGroup(
  text: string,
  regex: RegExp,
  groupIndex = 1,
): string | null {
  const m = text.match(regex);
  if (!m || !m[groupIndex]) return null;
  return m[groupIndex].trim();
}

/**
 * Utility: extract number from a matched group like "28.5 %"
 */
function matchNumber(
  text: string,
  regex: RegExp,
  groupIndex = 1,
): number | null {
  const s = matchGroup(text, regex, groupIndex);
  if (!s) return null;
  const cleaned = s.replace(/[^\d.\-]/g, '');
  const n = Number(cleaned);
  return Number.isNaN(n) ? null : n;
}

/**
 * Utility: slice text between two markers (best effort)
 */
function sliceBetween(
  text: string,
  startMarker: string,
  endMarkers: string[],
): string | undefined {
  const lower = text.toLowerCase();
  const startIdx = lower.indexOf(startMarker.toLowerCase());
  if (startIdx === -1) return undefined;

  let endIdx = text.length;
  for (const end of endMarkers) {
    const idx = lower.indexOf(end.toLowerCase(), startIdx + startMarker.length);
    if (idx !== -1 && idx < endIdx) {
      endIdx = idx;
    }
  }

  return text.slice(startIdx, endIdx).trim();
}

/**
 * Scan the whole text for FAIL lines and try to infer category + analyte name.
 */
function detectFailures(text: string): ParsedFailure[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const failures: ParsedFailure[] = [];

  for (const line of lines) {
    if (!/FAIL\b/i.test(line)) continue;

    // crude heuristics to guess category by context keywords
    let category = 'Unknown';
    const lower = line.toLowerCase();
    if (lower.includes('mycotoxin')) category = 'Mycotoxins';
    else if (
      lower.includes('yeast') ||
      lower.includes('mold') ||
      lower.includes('bacteria') ||
      lower.includes('salmonella') ||
      lower.includes('coli') ||
      lower.includes('enterobacter')
    ) {
      category = 'Microbials';
    } else if (
      lower.includes('pesticide') ||
      lower.includes('fungicide') ||
      lower.includes('insecticide') ||
      lower.includes('growth regulator') ||
      lower.includes('Î¼g/kg')
    ) {
      category = 'Pesticides';
    } else if (
      lower.includes('arsenic') ||
      lower.includes('cadmium') ||
      lower.includes('lead') ||
      lower.includes('mercury')
    ) {
      category = 'Heavy metals';
    } else if (
      lower.includes('butane') ||
      lower.includes('propane') ||
      lower.includes('solvent')
    ) {
      category = 'Solvents';
    } else if (lower.includes('hop latent viroid') || lower.includes('virus')) {
      category = 'Viral / plant health';
    }

    // analyte is usually at the start of the line until a double-space or number chunk
    const analyteMatch = line.match(/^([A-Z0-9\-\.\s]+?)(\d|<|N|P|F|Î¼|Âµ|$)/i);
    const analyte = analyteMatch ? analyteMatch[1].trim() : 'Unknown analyte';

    failures.push({
      analyte,
      category,
      line,
    });
  }

  return failures;
}

/**
 * Main entrypoint: parse COA text into structured-ish data.
 * This is deliberately tolerant: it will fill what it can and leave the rest null.
 */
export function parseCoaText(raw: string): ParsedCOA {
  const text = normalizeText(raw);

  // Top-level summary values
  const batchCode =
    matchGroup(text, /BATCH:\s*([A-Za-z0-9\-\._]+)/i) ??
    matchGroup(text, /BATCH ID:\s*([A-Za-z0-9\-\._]+)/i) ??
    null;

  const productName =
    matchGroup(text, /COA EXAMPLE.*\(([^)]+)\)/i) ??
    matchGroup(text, /COA .*?FOR\s+([^\/\n]+)\//i) ??
    null;

  const labName =
    matchGroup(text, /([A-Z][A-Z0-9\s]+LABS)\b/) ??
    matchGroup(text, /CLIENT:\s*([A-Z0-9\s\-]+)\s*\/\//i) ??
    null;

  const matrix = matchGroup(text, /MATRIX:\s*([A-Z0-9 ]+)/i) ?? null;

  const sampleId = matchGroup(text, /SAMPLE ID:\s*([A-Za-z0-9\-]+)/i) ?? null;

  const collectedOn =
    matchGroup(text, /COLLECTED ON:\s*([A-Za-z]{3}\s+\d{1,2},\s+\d{4})/i) ??
    matchGroup(text, /COLLECTED ON:\s*([A-Za-z0-9 ,/]+)/i) ??
    null;

  const receivedOn =
    matchGroup(text, /RECEIVED ON:\s*([A-Za-z]{3}\s+\d{1,2},\s+\d{4})/i) ??
    matchGroup(text, /RECEIVED ON:\s*([A-Za-z0-9 ,/]+)/i) ??
    null;

  const batchSizeGrams =
    matchNumber(text, /BATCH SIZE:\s*([0-9.,]+)\s*G/i) ?? null;

  const sampleSizeGrams =
    matchNumber(text, /SAMPLE SIZE:\s*([0-9.,]+)\s*G/i) ?? null;

  const thcPercent =
    matchNumber(text, /Î”-?THC:?\s*([0-9]+(?:\.[0-9]+)?)\s*%/i) ??
    matchNumber(text, /TOTAL THC\s*([0-9]+(?:\.[0-9]+)?)\s*%/i) ??
    null;

  const cbdPercent =
    matchNumber(text, /CBD:?\s*([0-9]+(?:\.[0-9]+)?)\s*%/i) ??
    matchNumber(text, /TOTAL CBD\s*([0-9]+(?:\.[0-9]+)?)\s*%/i) ??
    null;

  const totalCannabinoidsPercent =
    matchNumber(text, /TOTAL CANNABINOIDS:?\s*([0-9]+(?:\.[0-9]+)?)\s*%/i) ??
    null;

  const totalTerpenesPercent =
    matchNumber(text, /TOTAL TERPENES\s*([0-9]+(?:\.[0-9]+)?)\s*%/i) ?? null;

  const moisturePercent =
    matchNumber(text, /MOISTURE\s*([0-9]+(?:\.[0-9]+)?)\s*%/i) ?? null;

  const waterActivity =
    matchNumber(text, /WATER ACTIVITY\s*([0-9]+(?:\.[0-9]+)?)\s*Aw/i) ?? null;

  const batchResultRaw =
    matchGroup(text, /BATCH RESULT:\s*(PASS|FAIL)/i) ?? null;

  const batchResult: 'PASS' | 'FAIL' | 'UNKNOWN' =
    batchResultRaw?.toUpperCase() === 'PASS'
      ? 'PASS'
      : batchResultRaw?.toUpperCase() === 'FAIL'
        ? 'FAIL'
        : 'UNKNOWN';

  const failures = detectFailures(text);
  const hasAnyFailure =
    batchResult === 'FAIL' || (failures && failures.length > 0);

  // Raw sections to show in debug viewer
  const potencySection = sliceBetween(text, 'CAN.1: POTENCY', [
    'TERPENES BY',
    'RSOL.1',
    'RESIDUAL SOLVENTS',
  ]);

  const terpenesSection = sliceBetween(text, 'TERPENES BY', [
    'RSOL.1',
    'RESIDUAL SOLVENTS',
    'PST.2',
  ]);

  const pesticidesSection = sliceBetween(text, 'PST.2:', [
    'MYC.1:',
    'HME.1:',
    'HEAVY METALS',
  ]);

  const mycotoxinsSection = sliceBetween(text, 'MYC.1:', [
    'HME.1:',
    'HEAVY METALS',
    'FMT.1:',
  ]);

  const heavyMetalsSection = sliceBetween(text, 'HME.1:', [
    'FMT.1:',
    'FILTH AND FOREIGN',
    'MOISTURE CONTENT',
  ]);

  const solventsSection = sliceBetween(text, 'RSOL.1:', ['PST.2', 'MYC.1']);

  const microbialsSection = sliceBetween(text, 'TOTAL YEAST AND MOLD', [
    'NOTES',
    'END OF REPORT',
  ]);

  const notesSection = sliceBetween(text, 'NOTES', ['END OF REPORT']);

  const summary: ParsedCOASummary = {
    batchCode,
    productName,
    labName,
    matrix,
    sampleId,
    collectedOn,
    receivedOn,
    batchSizeGrams,
    sampleSizeGrams,
    thcPercent,
    cbdPercent,
    totalCannabinoidsPercent,
    totalTerpenesPercent,
    moisturePercent,
    waterActivity,
    batchResult,
    hasAnyFailure,
    failureReasons: failures,
  };

  return {
    summary,
    rawSections: {
      potency: potencySection,
      terpenes: terpenesSection,
      pesticides: pesticidesSection,
      microbials: microbialsSection,
      mycotoxins: mycotoxinsSection,
      heavyMetals: heavyMetalsSection,
      solvents: solventsSection,
      notes: notesSection,
    },
  };
}
