import { PrismaClient } from '@prisma/client';`r`nimport { PrismaPg } from '@prisma/adapter-pg';
import slugify from 'slugify';

/**
 * LicenseInput represents a cannabis license record to integrate into the system.
 * Required fields include:
 * - stateCode: Two-letter state or province code (e.g., "ME", "CA", "ON").
 * - licenseNumber: The license identifier (unique within the state/province).
 * - licenseType: Category of the license (e.g., "Retailer", "Cultivator", "Testing Facility").
 * - status: Current status of the license (e.g., "Active", "Suspended", "Expired").
 * - entityName: Official name of the licensee (business or individual).
 * Optional fields include:
 * - issuedAt, expiresAt: Issue/expiration dates (JavaScript Date objects).
 * - sourceUrl: URL of the data source.
 * - sourceSystem: Identifier for the issuing authority or source system (e.g., "ME_OCP", "MA_CCC").
 * - locationName: A trade name/DBA if different from the entityName.
 * - addressLine1, addressLine2, city, postalCode, country: Address details for the licensed premises.
 * - latitude, longitude: Coordinates of the licensed premises (if available).
 * - rawData: A JSON object containing the raw source data (for auditing and fields not explicitly modeled).
 */
export interface LicenseInput {
  stateCode: string;
  licenseNumber: string;
  licenseType: string;
  status: string;
  entityName: string;
  issuedAt?: Date;
  expiresAt?: Date;
  sourceUrl?: string;
  sourceSystem?: string;
  locationName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  rawData?: any;
}

// Instantiate a single Prisma client for database operations.
export const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/**
 * Inserts or updates a cannabis license record in the database and links it to a Location or Lab.
 * 
 * This function will:
 *  - Find or create a StateLicense entry based on stateCode + licenseNumber.
 *  - Update the license data if it already exists (e.g., change status or dates).
 *  - Determine if the license is for a testing Lab or a business Location, and upsert the corresponding record.
 *  - Create a new Location or Lab with appropriate type, slug, and address info if none exists.
 *  - Link the Location/Lab to the StateLicense via stateLicenseId.
 *  - Log any errors encountered (including the license number and state code) without throwing, to continue processing subsequent records.
 * 
 * @param data - A LicenseInput object containing license details to integrate.
 */
export async function upsertLicenseRecord(data: LicenseInput): Promise<void> {
  try {
    // Step 1: Upsert the StateLicense record (find by stateCode + licenseNumber).
    const existing = await prisma.stateLicense.findFirst({
      where: { stateCode: data.stateCode, licenseNumber: data.licenseNumber }
    });
    // Prepare the data for creation or update (include all fields provided in input).
    const licenseData: any = {
      stateCode: data.stateCode,
      licenseNumber: data.licenseNumber,
      licenseType: data.licenseType,
      status: data.status,
      entityName: data.entityName
    };
    if (data.issuedAt)    licenseData.issuedAt    = data.issuedAt;
    if (data.expiresAt)   licenseData.expiresAt   = data.expiresAt;
    if (data.sourceUrl)   licenseData.sourceUrl   = data.sourceUrl;
    if (data.sourceSystem) licenseData.sourceSystem = data.sourceSystem;
    if (data.rawData)     licenseData.rawData     = data.rawData;
    // Create a new license if not found, otherwise update the existing one.
    let licenseRecord;
    if (!existing) {
      licenseRecord = await prisma.stateLicense.create({ data: licenseData });
    } else {
      licenseRecord = await prisma.stateLicense.update({
        where: { id: existing.id },
        data: licenseData
      });
    }

    // Step 2: Determine license type and link to appropriate model (Lab or Location).
    const licenseTypeLower = data.licenseType.toLowerCase();
    const isLabLicense = licenseTypeLower.includes('lab') || licenseTypeLower.includes('test');
    if (isLabLicense) {
      // For laboratory licenses, upsert a Lab entry.
      const labName = data.locationName || data.entityName;
      // Try to find an existing Lab by stateLicenseId or by matching name & stateCode.
      let labRecord = await prisma.lab.findFirst({
        where: { stateLicenseId: licenseRecord.id }
      });
      if (!labRecord) {
        labRecord = await prisma.lab.findFirst({
          where: {
            name: { equals: labName, mode: 'insensitive' },
            stateCode: data.stateCode
          }
        });
      }
      if (labRecord) {
        // If found and not linked, update it to link this license.
        if (!labRecord.stateLicenseId) {
          await prisma.lab.update({
            where: { id: labRecord.id },
            data: { stateLicenseId: licenseRecord.id }
          });
        }
        // (If labRecord is already linked to a license, we leave it as is.)
      } else {
        // Create a new Lab record for this license.
        await prisma.lab.create({
          data: {
            name: labName,
            slug: slugify(labName, { lower: true }),
            stateCode: data.stateCode,
            city: data.city || undefined,
            stateLicenseId: licenseRecord.id
            // Note: Other Lab fields (website, accreditation) are not provided here.
          }
        });
      }
    } else {
      // For non-lab licenses, upsert a Location entry.
      const locationName = data.locationName || data.entityName;
      // Derive LocationType from licenseType string.
      let locType: string;
      if (licenseTypeLower.includes('cultiv')) {
        locType = 'CULTIVATION';
      } else if (licenseTypeLower.includes('manufact')) {
        locType = 'MANUFACTURING';
      } else if (licenseTypeLower.includes('retail') || licenseTypeLower.includes('dispens')) {
        locType = 'DISPENSARY';
      } else {
        locType = 'OTHER';
      }
      // Check for an existing Location linked to this license.
      let locationRecord = await prisma.location.findFirst({
        where: { stateLicenseId: licenseRecord.id }
      });
      if (locationRecord) {
        // Optionally, update the location if new data (e.g., name or address) has changed.
        // (Not strictly required by the plan; this can be implemented later if needed.)
        // Example:
        // if (locationRecord.name !== locationName) { ...update name/slug... }
      } else {
        // Create a new Location for this license.
        await prisma.location.create({
          data: {
            name: locationName,
            slug: slugify(locationName, { lower: true }),
            type: locType as any,       // cast to match Prisma enum (LocationType)
            addressLine1: data.addressLine1 || undefined,
            addressLine2: data.addressLine2 || undefined,
            city:        data.city        || undefined,
            state:       data.stateCode,  // use stateCode for location's state field
            postalCode:  data.postalCode  || undefined,
            country:     data.country     || undefined,
            latitude:    data.latitude    || undefined,
            longitude:   data.longitude   || undefined,
            stateLicenseId: licenseRecord.id
          }
        });
      }
    }
  } catch (e: any) {
    console.error(`Failed to upsert license ${data.licenseNumber} (${data.stateCode}):`, e);
    // Swallow the exception to continue processing other records.
  }
}

