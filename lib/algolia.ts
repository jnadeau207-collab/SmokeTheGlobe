import algoliasearch from 'algoliasearch';

const appId = process.env.ALGOLIA_APP_ID || '';
const adminKey = process.env.ALGOLIA_ADMIN_KEY || '';
const dispIndexName =
  process.env.ALGOLIA_INDEX_DISPENSARIES || 'cartfax_dispensaries';

let client: ReturnType<typeof algoliasearch> | null = null;

if (appId && adminKey) {
  client = algoliasearch(appId, adminKey);
}

export function getDispensaryIndex() {
  if (!client) return null;
  return client.initIndex(dispIndexName);
}

export async function indexDispensary(d: any) {
  const index = getDispensaryIndex();
  if (!index) return;

  await index.saveObject({
    objectID: d.id.toString(),
    name: d.name,
    slug: d.slug,
    city: d.city,
    state: d.state,
    description: d.description,
    _geoloc:
      d.latitude && d.longitude
        ? { lat: d.latitude, lng: d.longitude }
        : undefined,
  });
}
