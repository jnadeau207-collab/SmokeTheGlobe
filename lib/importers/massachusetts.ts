import fetch from 'node-fetch';
import { parse } from 'csv-parse/sync';
import { upsertLicenseRecord, LicenseInput } from '../licensing';

/**
 * Fetches and ingests Massachusetts Cannabis Control Commission license data.
 * This covers adult-use and medical licenses from the CCC open data CSV.
 */
export async function ingestMassachusettsLicenses(): Promise<number> {
  // Massachusetts CCC Open Data CSV (Licensing Tracker for Adult-Use and MTCs)
  const url = 'https://masscannabiscontrol.com/resource/l_licenses_aumtc.csv';
  let count = 0;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download Massachusetts license data: ${response.status}`);
    }
    const csvText = await response.text();
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true
    });
    for (const record of records) {
      try {
        const licenseNumber: string = record["License Number"]?.trim() 
                                   || record["License #"]?.trim() 
                                   || record["License ID"]?.trim() 
                                   || record["License"]?.trim() 
                                   || "";
        let licenseType: string = record["License Type"]?.trim() 
                                 || record["License Category"]?.trim() 
                                 || "";
        const designation: string = record["License Designation"]?.trim() 
                                  || record["Designation"]?.trim() 
                                  || "";
        if (designation && licenseType.toLowerCase().indexOf(designation.toLowerCase()) === -1) {
          // Prepend or append designation to licenseType for clarity
          // e.g., "Adult-Use Cultivator", "Medical Retailer"
          licenseType = `${designation} ${licenseType}`.trim();
        }
        const status: string = record["License Status"]?.trim() 
                             || record["Status"]?.trim() 
                             || record["Application/License Status"]?.trim() 
                             || "";
        const entityName: string = record["Licensee Name"]?.trim() 
                                || record["Entity Name"]?.trim() 
                                || record["Name"]?.trim() 
                                || "";
        const dbaName: string = record["Doing Business As"]?.trim() 
                              || record["DBA"]?.trim() 
                              || record["Trade Name"]?.trim() 
                              || "";
        const city: string = record["City"]?.trim() 
                           || record["Town"]?.trim() 
                           || record["Municipality"]?.trim() 
                           || "";
        // Massachusetts open data may not include street addresses or ZIP codes
        const issuedAt = record["Issue Date"] ? new Date(record["Issue Date"]) 
                      : record["Issued"] ? new Date(record["Issued"]) 
                      : undefined;
        // (Massachusetts data might not have explicit expiration dates in this dataset)
        const licenseInput: LicenseInput = {
          stateCode: "MA",
          licenseNumber,
          licenseType,
          status,
          entityName,
          locationName: dbaName || undefined,
          city,
          issuedAt,
          // No expiresAt provided in this dataset; skip if not present
          sourceUrl: url,
          sourceSystem: "MA_CCC",
          rawData: record
        };
        await upsertLicenseRecord(licenseInput);
        count++;
      } catch (err: any) {
        console.error("Error upserting Massachusetts license record:", err);
      }
    }
  } catch (err: any) {
    console.error("Error ingesting Massachusetts licenses:", err);
  }
  console.log(`Massachusetts: Imported ${count} licenses`);
  return count;
}
