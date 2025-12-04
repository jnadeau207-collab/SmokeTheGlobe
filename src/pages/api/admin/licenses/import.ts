import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import formidable from 'formidable';
import { parse } from 'csv-parse/sync';
import { upsertLicenseRecord, LicenseInput } from '../../../../lib/licensing';

// Disable default body parser to handle file upload
export const config = {
  api: { bodyParser: false }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Auth check (admin session or cron token)
  const session = await getServerSession(req, res, authOptions);
  const cronToken = process.env.CRON_SECRET;
  if (!session) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !cronToken || authHeader !== `Bearer ${cronToken}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  } else if (session.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Parse the incoming form data (expecting a CSV file upload and a state code field)
  const form = formidable({ multiples: false });
  try {
    const [fields, files] = await new Promise<[{ [key: string]: any }, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });
    const stateCode = (fields.state || fields.stateCode || "").toString().toUpperCase();
    if (!stateCode || !files.file) {
      return res.status(400).json({ error: 'Missing state code or file in request' });
    }
    const file = files.file;
    // Read file content (assuming text CSV)
    const fileContent: string = file.filepath 
      ? require('fs').readFileSync(file.filepath, 'utf8') 
      : file.toString();
    const records = parse(fileContent, { columns: true, skip_empty_lines: true });
    let count = 0;
    for (const record of records) {
      try {
        let licenseInput: LicenseInput;
        switch (stateCode) {
          case 'ME': {
            // Map fields as Maine dataset
            const licenseNumber: string = record["LICENSE"]?.trim() || record["License"]?.trim() || "";
            const category: string = record["LICENSE_CATEGORY"]?.trim() || "";
            const type: string = record["LICENSE_TYPE"]?.trim() || "";
            let licenseType = type && category && type.toLowerCase() !== category.toLowerCase()
              ? `${category} â€“ ${type}` : (category || type || "");
            const status: string = record["LICENSE_STATUS"]?.trim() || record["Status"]?.trim() || "";
            const entityName: string = record["LICENSE_NAME"]?.trim() || record["Licensee"]?.trim() || record["LICENSEE_NAME"]?.trim() || "";
            const dbaName: string = record["DBA"]?.trim() || "";
            const city: string = record["LICENSE_CITY"]?.trim() || record["City"]?.trim() || "";
            let issuedAt: Date | undefined;
            let expiresAt: Date | undefined;
            if (record["ISSUE_DATE"]) issuedAt = new Date(record["ISSUE_DATE"]);
            if (record["EXPIRATION_DATE"]) expiresAt = new Date(record["EXPIRATION_DATE"]);
            licenseInput = {
              stateCode: "ME",
              licenseNumber,
              licenseType,
              status,
              entityName: dbaName ? `${entityName} (DBA: ${dbaName})` : entityName,
              city,
              issuedAt,
              expiresAt,
              sourceSystem: "ME_OCP",
              rawData: record
            };
            break;
          }
          case 'MA': {
            // Map fields as Massachusetts dataset
            const licenseNumber: string = record["License Number"]?.trim() 
                                       || record["License #"]?.trim() 
                                       || record["License"]?.trim() 
                                       || "";
            let licenseType: string = record["License Type"]?.trim() || record["License Category"]?.trim() || "";
            const designation: string = record["License Designation"]?.trim() || record["Designation"]?.trim() || "";
            if (designation && licenseType.toLowerCase().indexOf(designation.toLowerCase()) === -1) {
              licenseType = `${designation} ${licenseType}`.trim();
            }
            const status: string = record["License Status"]?.trim() || record["Status"]?.trim() || "";
            const entityName: string = record["Licensee Name"]?.trim() || record["Entity Name"]?.trim() || record["Name"]?.trim() || "";
            const dbaName: string = record["Doing Business As"]?.trim() || record["DBA"]?.trim() || record["Trade Name"]?.trim() || "";
            const city: string = record["City"]?.trim() || record["Town"]?.trim() || "";
            const issuedAt = record["Issue Date"] ? new Date(record["Issue Date"]) : undefined;
            licenseInput = {
              stateCode: "MA",
              licenseNumber,
              licenseType,
              status,
              entityName,
              locationName: dbaName || undefined,
              city,
              issuedAt,
              sourceSystem: "MA_CCC",
              rawData: record
            };
            break;
          }
          default: {
            // Generic mapping for other states/provinces
            const keys = Object.keys(record).map(k => k.toLowerCase());
            const licenseNumberField = keys.find(k => k.includes('license') && !k.includes('type') && !k.includes('status') && !k.includes('issue'));
            const licenseTypeField = keys.find(k => k.includes('type'));
            const statusField = keys.find(k => k.includes('status'));
            const nameField = keys.find(k => k.includes('name') && !k.includes('city') && !k.includes('county') && !k.includes('doing business') && !k.includes('dba'));
            const dbaField = keys.find(k => k.includes('doing business') || k.includes('dba') || k.includes('trade name'));
            const cityField = keys.find(k => k === 'city' || k.includes('municipality') || k.includes('town'));
            const addressField = keys.find(k => k.includes('address'));
            const postalField = keys.find(k => k.includes('postal') || k.includes('zip'));
            const issueField = keys.find(k => k.includes('issue'));
            const expireField = keys.find(k => k.includes('expir'));
            const licenseNumber = licenseNumberField ? record[licenseNumberField] : "";
            const licenseType = licenseTypeField ? record[licenseTypeField] : "";
            const status = statusField ? record[statusField] : "";
            const entityName = nameField ? record[nameField] : "";
            const dbaName = dbaField ? record[dbaField] : "";
            const city = cityField ? record[cityField] : "";
            const addressLine1 = addressField ? record[addressField] : "";
            const postalCode = postalField ? record[postalField] : "";
            const issuedAt = issueField && record[issueField] ? new Date(record[issueField]) : undefined;
            const expiresAt = expireField && record[expireField] ? new Date(record[expireField]) : undefined;
            licenseInput = {
              stateCode,
              licenseNumber,
              licenseType,
              status,
              entityName,
              locationName: dbaName || undefined,
              addressLine1: addressLine1 || undefined,
              city,
              postalCode: postalCode || undefined,
              issuedAt,
              expiresAt,
              sourceSystem: stateCode,
              rawData: record
            };
            break;
          }
        }
        // Use a generic source URL note for file uploads (file imports are manual)
        licenseInput.sourceUrl = "admin-upload";
        await upsertLicenseRecord(licenseInput);
        count++;
      } catch (err) {
        console.error(`Error importing record from uploaded file for ${stateCode}:`, err);
      }
    }
    console.log(`File import (${stateCode}): Processed ${count} records`);
    return res.status(200).json({ ok: true, imported: count });
  } catch (err: any) {
    console.error('File import failed:', err);
    return res.status(500).json({ error: err.message || 'Import failed' });
  }
}
