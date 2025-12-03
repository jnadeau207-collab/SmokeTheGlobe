import fetch from 'node-fetch';
import { upsertLicenseRecord, LicenseInput } from '../licensing';

/**
 * Ingests California Dept. of Cannabis Control license data via the public API.
 * Only active licenses are imported by default.
 */
export async function ingestCaliforniaLicenses(): Promise<number> {
  const baseUrl = 'https://as-cdt-pub-vip-cannabis-ww-p-002.azurewebsites.net/licenses/filteredSearch';
  const params = new URLSearchParams({ pageSize: '100', searchQuery: '' });
  let page = 1;
  let hasNext = true;
  let count = 0;
  try {
    while (hasNext) {
      params.set('pageNumber', page.toString());
      let success = false;
      let dataPage: any[] = [];
      let metadata: any = {};
      // Retry logic for page fetch
      for (let attempt = 0; attempt < 3 && !success; attempt++) {
        try {
          const res = await fetch(`${baseUrl}?${params.toString()}`);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          const body = await res.json();
          dataPage = body.data || [];
          metadata = body.metadata || {};
          success = true;
        } catch (err) {
          console.warn(`CA: Page ${page} fetch failed (attempt ${attempt + 1}):`, err);
          if (attempt < 2) {
            // Wait 1s before retrying
            await new Promise(res => setTimeout(res, 1000));
          }
        }
      }
      if (!success) {
        console.error(`CA: Failed to fetch page ${page} after 3 attempts, aborting.`);
        break;
      }
      // Process the current page of licenses
      for (const lic of dataPage) {
        try {
          if (!lic.licenseStatus || lic.licenseStatus.toLowerCase() !== 'active') {
            // Skip non-active licenses to focus on current legal operations
            continue;
          }
          const licenseNumber: string = lic.licenseNumber || "";
          let licenseType: string = lic.licenseType || "";
          if (lic.licenseDesignation) {
            const designation = String(lic.licenseDesignation);
            if (designation && licenseType.toLowerCase().indexOf(designation.toLowerCase()) === -1) {
              licenseType = `${licenseType} (${designation})`;
            }
          }
          const status: string = lic.licenseStatus || "";
          const entityName: string = lic.businessName || "";
          // Use business DBA name if available for location name
          const dbaName: string = lic.businessDBA || lic.businessDBAName || lic.business_dba_name || "";
          const locationName = dbaName && dbaName.toLowerCase() !== entityName.toLowerCase() ? dbaName : undefined;
          const addressLine1: string = lic.premiseStreetAddress || "";
          const city: string = lic.premiseCity || "";
          const postalCode: string = lic.premiseZipCode || "";
          const latitude = lic.premiseLatitude;
          const longitude = lic.premiseLongitude;
          const issuedAt = lic.issueDate ? new Date(lic.issueDate) : undefined;
          const expiresAt = lic.expirationDate ? new Date(lic.expirationDate) : undefined;
          const licenseInput: LicenseInput = {
            stateCode: "CA",
            licenseNumber,
            licenseType,
            status,
            entityName,
            locationName,
            addressLine1: addressLine1 || undefined,
            city,
            postalCode: postalCode || undefined,
            country: "US",
            latitude: latitude !== undefined ? Number(latitude) : undefined,
            longitude: longitude !== undefined ? Number(longitude) : undefined,
            issuedAt,
            expiresAt,
            sourceUrl: "https://cannabis.ca.gov/license-search",
            sourceSystem: "CA_DCC",
            rawData: lic
          };
          await upsertLicenseRecord(licenseInput);
          count++;
        } catch (err: any) {
          console.error("Error upserting CA license record:", err);
          // continue processing other licenses
        }
      }
      hasNext = metadata.hasNext === true || metadata.hasNext === "true";
      page++;
      // Brief pause to avoid throttling
      await new Promise(res => setTimeout(res, 100));
    }
  } catch (err: any) {
    console.error("Error ingesting California licenses:", err);
  }
  console.log(`California: Imported ${count} active licenses`);
  return count;
}
