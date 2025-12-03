import fetch from 'node-fetch';
import { parse } from 'csv-parse/sync';
import { upsertLicenseRecord, LicenseInput } from '../licensing';

/**
 * Fetches and ingests Maine's Adult Use cannabis license data.
 * 
 * Returns the number of licenses imported/updated.
 */
export async function ingestMaineLicenses(): Promise<number> {
  // URL for Maine's Adult Use Establishments CSV (latest as of Oct 2025).
  // NOTE: Update the URL with the newest filename when Maine publishes a new dataset.
  const url = 'https://www.maine.gov/dafs/ocp/sites/maine.gov.dafs.ocp/files/inline-files/Adult_Use_Establishments_And_Contacts_2025_10_01.csv';
  let count = 0;
  try {
    // Fetch the CSV file from the Maine OCP site
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download Maine license data: ${response.status} ${response.statusText}`);
    }
    const csvText = await response.text();
    // Parse the CSV text into records (array of objects) using csv-parse
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true
    });
    // Iterate over each record and upsert into the database
    for (const record of records) {
      try {
        // Map CSV fields to our LicenseInput structure
        const licenseNumber: string = record["LICENSE"]?.trim() || record["License"]?.trim() || "";
        // License category and type (combine if both present and distinct)
        const category: string = record["LICENSE_CATEGORY"]?.trim() || "";
        const type: string = record["LICENSE_TYPE"]?.trim() || "";
        let licenseType: string;
        if (type && category && type.toLowerCase() !== category.toLowerCase()) {
          // Combine category and type if type provides additional detail
          licenseType = `${category} â€“ ${type}`;
        } else {
          // If type is empty or same as category, use whichever is available
          licenseType = category || type || "";
        }
        const status: string = record["LICENSE_STATUS"]?.trim() || record["Status"]?.trim() || "";
        // Entity name (licensee name or business name)
        const entityName: string = record["LICENSE_NAME"]?.trim() || record["Licensee"]?.trim() || record["LICENSEE_NAME"]?.trim() || "";
        // Doing Business As (DBA) name if present
        const dbaName: string = record["DBA"]?.trim() || "";
        // City (municipality of the establishment)
        const city: string = record["LICENSE_CITY"]?.trim() || record["City"]?.trim() || "";
        // Issue and expiration dates (MM/DD/YYYY format in Maine data)
        let issuedAt: Date | undefined;
        let expiresAt: Date | undefined;
        const issueDateStr: string = record["ISSUE_DATE"]?.trim() || record["License Issue Date"]?.trim() || "";
        const expDateStr: string   = record["EXPIRATION_DATE"]?.trim() || record["License Expiration Date"]?.trim() || "";
        if (issueDateStr) {
          const parts = issueDateStr.split('/');
          if (parts.length === 3) {
            const [MM, DD, YYYY] = parts;
            issuedAt = new Date(Number(YYYY), Number(MM) - 1, Number(DD));
          } else {
            console.warn(`ME import: Unrecognized issue date format "${issueDateStr}"`);
          }
        }
        if (expDateStr) {
          const parts = expDateStr.split('/');
          if (parts.length === 3) {
            const [MM, DD, YYYY] = parts;
            expiresAt = new Date(Number(YYYY), Number(MM) - 1, Number(DD));
          } else {
            console.warn(`ME import: Unrecognized expiration date format "${expDateStr}"`);
          }
        }
        // Prepare the LicenseInput object
        const licenseInput: LicenseInput = {
          stateCode: "ME",
          licenseNumber,
          licenseType,
          status,
          entityName: dbaName ? `${entityName} (DBA: ${dbaName})` : entityName,
          issuedAt,
          expiresAt,
          city,
          // Maine's public dataset does not include street address or postal code
          addressLine1: undefined,
          addressLine2: undefined,
          postalCode: undefined,
          sourceUrl: url,
          sourceSystem: "ME_OCP",
          rawData: record
        };
        // Upsert the license record into the database
        await upsertLicenseRecord(licenseInput);
        count += 1;
      } catch (err: any) {
        console.error("Error upserting Maine license record:", err);
        // Continue with next record
      }
    }
  } catch (err: any) {
    console.error("Error ingesting Maine licenses:", err);
    // (Return count of processed records so far, even if incomplete)
  }
  console.log(`Maine: Imported ${count} licenses`);
  return count;
}
