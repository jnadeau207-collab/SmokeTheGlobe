import Link from 'next/link';
import { useSession } from 'next-auth/react';

const STATES = [
  'ME',
  'NH',
  'VT',
  'MA',
  'RI',
  'CT',
  'NY',
  'NJ',
  'PA',
  'DE',
  'MD',
  'VA',
  'WV',
  'NC',
  'SC',
  'GA',
  'FL',
  'OH',
  'MI',
  'IN',
  'IL',
  'WI',
  'MN',
  'IA',
  'MO',
  'ND',
  'SD',
  'NE',
  'KS',
  'KY',
  'TN',
  'AL',
  'MS',
  'AR',
  'LA',
  'OK',
  'TX',
  'MT',
  'ID',
  'WY',
  'CO',
  'NM',
  'AZ',
  'UT',
  'NV',
  'CA',
  'OR',
  'WA',
  'AK',
  'HI',
];

export default function AdminStatesIndex() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-300">
          Sign in as an admin to view state-level navigation.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">
          CartFax admin · by state
        </h1>
        <p className="text-sm text-slate-400">
          Use this map-style view to drill into operators, labs, and batches for
          a specific state. This keeps large national datasets manageable and
          intuitive.
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-4">
        <div className="text-sm text-slate-300 mb-2">
          Select a state to view its batches and lab results
        </div>

        {/* pseudo-map grid – admin side only, doesn’t need to be perfect geography */}
        <div className="grid grid-cols-8 gap-2 text-xs">
          {STATES.map((code) => (
            <Link
              key={code}
              href={`/admin/states/${code}`}
              className="flex items-center justify-center rounded-md border border-slate-700 bg-slate-950/80 hover:bg-sky-600 hover:text-slate-950 transition-colors py-2"
            >
              {code}
            </Link>
          ))}
        </div>

        <p className="text-[11px] text-slate-500 mt-2">
          This is an admin-only navigation shell. Later we can replace this grid
          with a proper SVG map or a more detailed regional view.
        </p>
      </div>
    </div>
  );
}
