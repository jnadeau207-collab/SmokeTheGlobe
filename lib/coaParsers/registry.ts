// lib/coaParsers/registry.ts
import { LabParser, ParsedCoa } from './types';
import { parseNovaAnalytic } from './novaAnalytic';

type LabRegistryEntry = {
  slug: string;
  displayName: string;
  states: string[];  // where they mainly operate
  patterns: RegExp[]; // name/branding text in COA
  parser: LabParser;
  website?: string;
};

const noopParser: LabParser = (text) => ({
  contaminants: [],
});

export const LAB_REGISTRY: LabRegistryEntry[] = [
  {
    slug: 'nova-analytic-labs',
    displayName: 'Nova Analytic Labs',
    states: ['ME'],
    patterns: [/NOVA ANALYTIC LABS?/i],
    parser: parseNovaAnalytic,
    website: 'https://www.nova-analyticlabs.com/',
  },
  {
    slug: 'mcr-labs',
    displayName: 'MCR Labs',
    states: ['MA', 'CT', 'PA'],
    patterns: [/MCR LABS?/i],
    parser: noopParser,
    website: 'https://mcrlabs.com/',
  },
  {
    slug: 'proverde-labs',
    displayName: 'ProVerde Laboratories',
    states: ['MA', 'ME'],
    patterns: [/PROVERDE LAB/i],
    parser: noopParser,
    website: 'https://www.proverdelabs.com/',
  },
  {
    slug: 'sc-labs',
    displayName: 'SC Labs',
    states: ['CA', 'CO', 'MI', 'OR', 'TX'],
    patterns: [/SC LABS?/i],
    parser: noopParser,
    website: 'https://www.sclabs.com/',
  },
  {
    slug: 'kaycha-labs',
    displayName: 'Kaycha Labs',
    states: ['FL', 'CA', 'MA', 'NY', 'CO', 'TN'],
    patterns: [/KAYCHA LABS?/i],
    parser: noopParser,
    website: 'https://kaychalabs.com/',
  },
  {
    slug: 'green-leaf-lab',
    displayName: 'Green Leaf Lab',
    states: ['OR', 'CA'],
    patterns: [/GREEN LEAF LAB/i],
    parser: noopParser,
    website: 'https://www.greenleaflab.org/',
  },
  {
    slug: 'confidence-analytics',
    displayName: 'Confidence Analytics',
    states: ['WA'],
    patterns: [/CONFIDENCE ANALYTICS/i],
    parser: noopParser,
    website: 'https://www.confidenceanalytics.com/',
  },
  // Add new labs here as you get COA examples.
];

export function findLabEntry(text: string): LabRegistryEntry | null {
  for (const entry of LAB_REGISTRY) {
    if (entry.patterns.some((re) => re.test(text))) {
      return entry;
    }
  }
  return null;
}

export function parseCoa(text: string): ParsedCoa {
  const entry = findLabEntry(text);

  if (entry) {
    const parsed = entry.parser(text);
    if (parsed) {
      return {
        ...parsed,
        labName: parsed.labName ?? entry.displayName,
        labStateCode: parsed.labStateCode ?? entry.states[0],
        contaminants: parsed.contaminants ?? [],
      };
    }
  }

  // Generic fallback parser (THC/CBD/Total Cannabinoids only)
  const generic: ParsedCoa = {
    contaminants: [],
  };

  const canonical = text.replace(/\r\n/g, '\n');

  const thcMatch =
    canonical.match(/TOTAL\s+THC[:\s]+(\d+(\.\d+)?)\s*%/i) ||
    canonical.match(/Î”-?9?[-\s]*THC[:\s]+(\d+(\.\d+)?)\s*%/i);
  if (thcMatch) generic.thcPercent = parseFloat(thcMatch[1]);

  const cbdMatch =
    canonical.match(/TOTAL\s+CBD[:\s]+(\d+(\.\d+)?)\s*%/i) ||
    canonical.match(/\bCBD[:\s]+(\d+(\.\d+)?)\s*%/i);
  if (cbdMatch) generic.cbdPercent = parseFloat(cbdMatch[1]);

  const totalCannMatch = canonical.match(
    /TOTAL\s+CANNABINOIDS?[:\s]+(\d+(\.\d+)?)\s*%/i
  );
  if (totalCannMatch) {
    generic.totalCannabinoidsPercent = parseFloat(totalCannMatch[1]);
  }

  return generic;
}
