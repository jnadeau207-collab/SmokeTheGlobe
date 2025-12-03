import algoliasearch from 'algoliasearch/lite';
import { useState } from 'react';

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '',
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || '',
);

export default function SearchAlgolia() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    if (!query) {
      setResults([]);
      return;
    }

    const index = searchClient.initIndex('cartfax_dispensaries');
    const res = await index.search(query);

    setResults(res.hits);
  }

  return (
    <div className="bg-emerald-400 p-3 rounded shadow">
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search dispensaries..."
          className="flex-1 p-2 border rounded"
        />
        <button className="px-3 py-2 bg-sky-500 text-white rounded">
          Search
        </button>
      </form>

      <ul className="space-y-2">
        {results.map((hit) => (
          <li key={hit.objectID} className="p-3 border rounded">
            <div className="font-semibold">{hit.name}</div>
            <div className="text-sm text-gray-500">
              {hit.city}, {hit.state}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
