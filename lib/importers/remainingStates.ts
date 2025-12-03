import fetch from 'node-fetch';
import { upsertLicenseRecord, LicenseInput } from '../licensing';

/**
 * Ingests licenses for all remaining U.S. states using a consolidated dataset (e.g., Cannlytics).
 * Skips states that have dedicated importers (ME, MA, CO, CA).
 */
export async function ingestRemainingStates(): Promise<number> {
  const url = 'https://huggingface.co/datasets/cannlytics/cannabis_licenses/resolve/main/all/data.json';
  let count = 0;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to download consolidated license dataset: ${res.status}`);
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      throw new Error('Unexpected data format from consolidated dataset');
    }
    const skipStates = new Set(['ME', 'MA', 'CO', 'CA']);
    const processedStates = new Set<string>();
    for (const lic of data) {
      try {
        const stateCode: string = lic.premise_state?.toUpperCase() 
                                || lic.state_code?.toUpperCase() 
                                || "";
        if (!stateCode || skipStates.has(stateCode)) {
          continue;
        }
        const licenseNumber: string = lic.license_number || "";
        let licenseType: string = lic.license_type || "";
        if (lic.license_designation) {
          const designation = String(lic.license_designation);
          if (designation && licenseType.toLowerCase().indexOf(designation.toLowerCase()) === -1) {
            licenseType = `${licenseType} (${designation})`;
          }
        }
        const status: string = lic.license_status || "";
        const entityName: string = lic.business_legal_name || lic.business_name || "";
        const dbaName: string = lic.business_dba_name || lic.business_dba || "";
        const locationName = dbaName && dbaName.toLowerCase() !== entityName.toLowerCase() ? dbaName : undefined;
        const city: string = lic.premise_city || "";
        const addressLine1: string = lic.premise_street_address || "";
        const postalCode: string = lic.premise_zip_code || "";
        const country: string = "US";
        const latitude = lic.premise_latitude;
        const longitude = lic.premise_longitude;
        const issuedAt = lic.issue_date ? new Date(lic.issue_date) : undefined;
        const expiresAt = lic.expiration_date ? new Date(lic.expiration_date) : undefined;
        let sourceSystem: string;
        if (lic.licensing_authority_id) {
          // e.g., stateCode="IL", licensing_authority_id="CC" -> "IL_CC"
          sourceSystem = `${stateCode}_${String(lic.licensing_authority_id)}`;
        } else {
          sourceSystem = stateCode;
        }
        const sourceUrl: string = 'https://huggingface.co/datasets/cannlytics/cannabis_licenses';
        const licenseInput: LicenseInput = {
          stateCode,
          licenseNumber,
          licenseType,
          status,
          entityName,
          locationName,
          addressLine1: addressLine1 || undefined,
          city,
          postalCode: postalCode || undefined,
          country,
          latitude: latitude !== undefined ? Number(latitude) : undefined,
          longitude: longitude !== undefined ? Number(longitude) : undefined,
          issuedAt,
          expiresAt,
          sourceSystem,
          sourceUrl,
          rawData: lic
        };
        await upsertLicenseRecord(licenseInput);
        count++;
        processedStates.add(stateCode);
      } catch (err: any) {
        console.error("Error upserting license from consolidated dataset:", err);
        // continue to next record
      }
    }
    console.log(`Remaining states: Imported ${count} licenses across ${processedStates.size} states`);
  } catch (err: any) {
    console.error("Error ingesting remaining states:", err);
  }
  return count;
}
