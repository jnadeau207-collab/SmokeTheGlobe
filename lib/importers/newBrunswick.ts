import fetch from 'node-fetch';
import cheerio from 'cheerio';
import { prisma } from '../licensing';
import slugify from 'slugify';

/**
 * Fetches and ingests New Brunswick Cannabis NB store locations.
 * Creates Location entries for each store (and ensures a Brand for Cannabis NB exists).
 */
export async function ingestNewBrunswickStores(): Promise<number> {
  const url = 'https://www.cannabis-nb.com/stores/';
  let count = 0;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch Cannabis NB stores page: ${res.status}`);
    }
    const html = await res.text();
    const $ = cheerio.load(html);
    const storeAnchors = $('a[href*="google"][href*="maps"]');
    if (storeAnchors.length === 0) {
      console.warn('No store addresses found on Cannabis NB page (structure may have changed).');
    }
    // Ensure Cannabis NB brand exists (create if not)
    let brand = await prisma.brand.findFirst({ where: { slug: 'cannabis-nb' } });
    if (!brand) {
      brand = await prisma.brand.create({
        data: { name: 'Cannabis NB', slug: 'cannabis-nb' }
      });
    }
    // Iterate through each store address link
    const anchorElems = storeAnchors.toArray();
    for (const elem of anchorElems) {
      const aTag = $(elem);
      const address = aTag.text().trim();
      if (!address) {
        continue;
      }
      // Find the city name from the same table row (first cell likely contains city)
      let city = "";
      const row = aTag.closest('tr');
      if (row && row.length) {
        const firstCellText = row.find('td').first().text().trim();
        if (firstCellText) {
          city = firstCellText;
        }
      }
      // If city is still not found, try to extract it from the address string
      if (!city) {
        const parts = address.split(',').map(p => p.trim());
        if (parts.length >= 3) {
          // e.g., "... Bathurst, NB E2A 2Y7, Canada"
          city = parts[parts.length - 3] || "";
        }
      }
      // Parse the address into components
      const parts = address.split(',').map(p => p.trim());
      let addressLine1 = "";
      let addressLine2 = "";
      let postalCode = "";
      let country = "";
      if (parts.length === 5) {
        // Format: [street], [suite], [city], [NB X1Y 2Z3], [Canada]
        addressLine1 = parts[0];
        addressLine2 = parts[1];
        postalCode = parts[3].replace(/^NB\s*/, '');
        country = parts[4];
      } else if (parts.length === 4) {
        // Format: [street], [city], [NB X1Y 2Z3], [Canada]
        addressLine1 = parts[0];
        addressLine2 = "";
        postalCode = parts[2].replace(/^NB\s*/, '');
        country = parts[3];
      } else {
        // Unexpected format â€“ put entire address as line1
        addressLine1 = address;
        addressLine2 = "";
        country = "Canada";
      }
      if (!city && parts.length >= 3) {
        // If city was not found earlier, take the third from last part as city
        city = parts[parts.length - 3] || "";
      }
      // Construct a unique location name and slug
      const locationName = city ? `Cannabis NB - ${city}` : "Cannabis NB Store";
      const slug = slugify(locationName, { lower: true });
      try {
        let location = await prisma.location.findFirst({ where: { slug } });
        if (location) {
          // Update existing location's address fields (if changed)
          await prisma.location.update({
            where: { id: location.id },
            data: {
              addressLine1,
              addressLine2: addressLine2 || undefined,
              city,
              state: 'NB',
              postalCode: postalCode || undefined,
              country: country || 'Canada',
              brandId: brand.id
            }
          });
        } else {
          // Create a new location for this store
          await prisma.location.create({
            data: {
              name: locationName,
              slug,
              type: 'DISPENSARY',
              addressLine1,
              addressLine2: addressLine2 || undefined,
              city,
              state: 'NB',
              postalCode: postalCode || undefined,
              country: country || 'Canada',
              brandId: brand.id
            }
          });
        }
        count++;
      } catch (err: any) {
        console.error(`Error upserting NB store ${locationName}:`, err);
        // continue to next store
      }
    }
  } catch (err: any) {
    console.error("Error ingesting New Brunswick stores:", err);
  }
  console.log(`New Brunswick: Imported ${count} store locations`);
  return count;
}
