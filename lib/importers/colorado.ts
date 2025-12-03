import fetch from 'node-fetch';
import { parse } from 'csv-parse/sync';
import { upsertLicenseRecord, LicenseInput } from '../licensing';

/**
 * Ingests Colorado Marijuana Enforcement Division license data from Google Sheets.
 * Multiple categories (stores, cultivations, etc.) are processed.
 */
export async function ingestColoradoLicenses(): Promise<number> {
  // Array of Colorado MED public Google Sheets for various license categories.
  // TODO: Update the sheetId values with actual IDs from the Colorado MED site.
  const coloradoSheets = [
    { category: 'Stores',        sheetId: 'ABCDEFG12345',  gid: '0', licenseType: 'Marijuana Store' },
    { category: 'Cultivations',  sheetId: 'HIJKLMN67890',  gid: '0', licenseType: 'Cultivation Facility' },
    { category: 'Manufacturers', sheetId: 'OPQRSTU13579',  gid: '0', licenseType: 'Product Manufacturer' },
    { category: 'Testing',       sheetId: 'UVWXYZ24680',   gid: '0', licenseType: 'Testing Facility' },
    { category: 'Transporters',  sheetId: 'ABCDEF135790',  gid: '0', licenseType: 'Transporter' },
    { category: 'Hospitality',   sheetId: 'GHIJKL246801',  gid: '0', licenseType: 'Hospitality' },
    { category: 'Operators',     sheetId: 'MNOPQR135792',  gid: '0', licenseType: 'Operator' }
  ];
  let totalCount = 0;
  try {
    for (const sheet of coloradoSheets) {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheet.sheetId}/export?format=csv&gid=${sheet.gid}`;
      try {
        const res = await fetch(csvUrl);
        if (!res.ok) {
          throw new Error(`Failed to fetch ${sheet.category} sheet: ${res.status}`);
        }
        const csvText = await res.text();
        const records = parse(csvText, {
          columns: true,
          skip_empty_lines: true
        });
        for (const record of records) {
          try {
            const licenseNumber: string = record["License Number"]?.trim() 
                                       || record["License #"]?.trim() 
                                       || record["License"]?.trim() 
                                       || "";
            const entityName: string = record["Licensee"]?.trim() 
                                     || record["Licensee Name"]?.trim() 
                                     || record["Entity Name"]?.trim() 
                                     || "";
            const tradeName: string = record["Trade Name"]?.trim() 
                                    || record["DBA"]?.trim() 
                                    || "";
            const city: string = record["City"]?.trim() 
                               || record["Town"]?.trim() 
                               || "";
            // Colorado lists are active licenses by context; default status to Active if missing
            const status: string = record["License Status"]?.trim() 
                                 || record["Status"]?.trim() 
                                 || "Active";
            const licenseType = sheet.licenseType; // e.g., "Marijuana Store", "Cultivation Facility"
            const sourceUrl = `https://docs.google.com/spreadsheets/d/${sheet.sheetId}/edit#gid=${sheet.gid}`;
            const licenseInput: LicenseInput = {
              stateCode: "CO",
              licenseNumber,
              licenseType,
              status,
              entityName,
              locationName: tradeName || undefined,
              city,
              // No street address or postal code in public data
              sourceUrl,
              sourceSystem: "CO_MED",
              rawData: record
            };
            await upsertLicenseRecord(licenseInput);
            totalCount++;
          } catch (innerErr: any) {
            console.error(`Error upserting Colorado ${sheet.category} record:`, innerErr);
            // continue to next record
          }
        }
        // Polite delay between sheet fetches to avoid hitting Google too fast
        await new Promise(res => setTimeout(res, 200));
      } catch (sheetErr: any) {
        console.error(`Failed to process ${sheet.category} data:`, sheetErr);
        // Continue with next category
      }
    }
  } catch (err: any) {
    console.error("Error ingesting Colorado licenses:", err);
  }
  console.log(`Colorado: Imported ${totalCount} licenses across ${coloradoSheets.length} categories`);
  return totalCount;
}
