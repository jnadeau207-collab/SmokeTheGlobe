export type NovaParsed = {
  labName: string;
  batchCode: string | null;
  thcPercent: number | null;
  cbdPercent: number | null;
  totalCannabinoidsPercent: number | null;
  moisturePercent: number | null;
  waterActivity: number | null;
  pesticidesPass: boolean | null;
  microbialsPass: boolean | null;
  heavyMetalsPass: boolean | null;
};

export function isNovaLabsCoa(text: string): boolean {
  // Key identity markers for Nova Analytic Labs
  return (
    /NOVA ANALYTIC LABS/i.test(text) ||
    /nova-analyticlabs\.com/i.test(text) ||
    /NOVA ANALYTIC LABS\s*\/\/\s*65 MILLIKEN STREET/i.test(text)
  );
}

function matchNumber(re: RegExp, text: string): number | null {
  const m = text.match(re);
  if (!m || !m[1]) return null;
  const v = parseFloat(m[1].replace(',', ''));
  return Number.isNaN(v) ? null : v;
}

export function parseNovaLabsCoa(text: string): NovaParsed {
  const labName = 'Nova Analytic Labs';

  // From line: CLIENT: NOVA - PT ACCOUNT // BATCH: FAIL
  const batchMatch = text.match(/BATCH:\s*([A-Za-z0-9\-]+)/i);
  const batchCode = batchMatch ? batchMatch[1].trim() : null;

  // Î”-THC or TOTAL THC
  const thcPercent =
    matchNumber(/Î”-THC[:\s]+(\d+(?:\.\d+)?)\s*%/i, text) ??
    matchNumber(/TOTAL THC\s*([\d.]+)\s*%/i, text);

  // CBD often ND in this example; leave null unless a % is found
  const cbdPercent = matchNumber(/CBD[:\s]+(\d+(?:\.\d+)?)\s*%/i, text);

  // TOTAL CANNABINOIDS:29.1 %
  const totalCannabinoidsPercent = matchNumber(
    /TOTAL CANNABINOIDS[:\s]+([\d.]+)\s*%/i,
    text,
  );

  // Moisture line: MOISTURE9.000.0100/0.0100N/A  => 9.00 %
  const moisturePercent = matchNumber(/MOISTURE\s*([\d.]+)\s*%?/i, text);

  // Water activity: WATER ACTIVITY0.65 Aw0.54...
  const waterActivity = matchNumber(/WATER ACTIVITY\s*([\d.]+)\s*Aw/i, text);

  // Summary flags at top: PESTICIDESFAIL, MICROBIALFAIL, METALSPASS
  const pesticidesFail = /PESTICIDESFAIL/i.test(text);
  const microbialsFail = /MICROBIALFAIL/i.test(text);
  const metalsPass = /METALSPASS/i.test(text);

  return {
    labName,
    batchCode,
    thcPercent,
    cbdPercent,
    totalCannabinoidsPercent,
    moisturePercent,
    waterActivity,
    pesticidesPass: pesticidesFail ? false : null,
    microbialsPass: microbialsFail ? false : null,
    heavyMetalsPass: metalsPass ? true : null,
  };
}
