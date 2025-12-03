// lib/coaParsers/novaAnalytic.ts
import { LabParser, ParsedCoa } from './types';

const STATE_ABBREVS = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

function detectCityStateFromLine(
  line: string
): { city?: string; state?: string } {
  // e.g. "65 MILLIKEN STREET, UNIT C PORTLAND ME 04103"
  const regex = new RegExp(
    `\\b([A-Za-z][A-Za-z]+)\\s+(${STATE_ABBREVS.join('|')})\\s+\\d{5}\\b`
  );
  const m = line.match(regex);
  if (!m) return {};
  const city = m[1];
  const state = m[2];
  return { city, state };
}

export const parseNovaAnalytic: LabParser = (text) => {
  if (!/NOVA ANALYTIC LABS/i.test(text)) {
    return null;
  }

  const result: ParsedCoa = {
    labName: 'Nova Analytic Labs',
    contaminants: [],
  };

  const canonicalText = text.replace(/\r\n/g, '\n');

  // Lab address line
  const labLineMatch = canonicalText.match(
    /NOVA ANALYTIC LABS\s*\/\/\s*([^\n]+)/i
  );
  if (labLineMatch) {
    const { city, state } = detectCityStateFromLine(labLineMatch[1]);
    if (city) result.labCity = city;
    if (state) result.labStateCode = state;
  }

  // Batch code, e.g. "BATCH: FAIL"
  const batchMatch =
    canonicalText.match(/BATCH:\s*([A-Za-z0-9_-]+)/i) ||
    canonicalText.match(/BATCH\s+RESULT\s*:\s*([A-Za-z0-9_-]+)/i);
  if (batchMatch) {
    result.batchCode = batchMatch[1].trim();
  }

  // Basic cannabinoid metrics
  const thcMatch = canonicalText.match(/Î”-THC:?(\d+(\.\d+)?)\s*%/i);
  if (thcMatch) result.thcPercent = parseFloat(thcMatch[1]);

  const totalMatch = canonicalText.match(
    /TOTAL\s+CANNABINOIDS:?(\d+(\.\d+)?)\s*%/i
  );
  if (totalMatch) result.totalCannabinoidsPercent = parseFloat(totalMatch[1]);

  const cbdMatch = canonicalText.match(/CBD:?(\d+(\.\d+)?)\s*%/i);
  if (cbdMatch) result.cbdPercent = parseFloat(cbdMatch[1]);

  // Overall batch result: PASS/FAIL
  const batchResultMatch = canonicalText.match(
    /BATCH RESULT:\s*(PASS|FAIL)/i
  );
  if (batchResultMatch) {
    result.overallPass = batchResultMatch[1].toUpperCase() === 'PASS';
  }

  // Simple contaminant summary: capture FAIL lines
  const failLines = canonicalText
    .split('\n')
    .filter((line) => /\bFAIL\b/i.test(line));

  for (const line of failLines) {
    const nameMatch = line.match(/([A-Z][A-Za-z]+)\s*FAIL/i);
    const name = nameMatch ? nameMatch[1] : 'Unknown';
    result.contaminants.push({
      group: 'OTHER',
      name,
      status: 'FAIL',
      valueRaw: line.trim(),
    });
  }

  return result;
};
