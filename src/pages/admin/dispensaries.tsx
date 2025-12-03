import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

type Disp = {
  id: number;
  name: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  slug?: string;
};

export default function AdminDispensaries() {
  const { data: session } = useSession();
  const [items, setItems] = useState<Disp[]>([]);
  const [editing, setEditing] = useState<Disp | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchList();
  }, []);

  async function fetchList() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/dispensaries');
      const data = await res.json();

      if (Array.isArray(data)) {
        setItems(data);
      } else {
        console.error(
          'Unexpected response from /api/admin/dispensaries:',
          data,
        );
        setItems([]);
      }
    } catch (err) {
      console.error('Failed to fetch dispensaries', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  function empty() {
    return {
      id: 0,
      name: '',
      city: '',
      state: '',
      latitude: 0,
      longitude: 0,
      slug: '',
    };
  }

  function edit(item?: Disp) {
    setEditing(item ? item : empty());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function save() {
    if (!editing) return;
    const method = editing.id ? 'PUT' : 'POST';
    const res = await fetch('/api/admin/dispensaries', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    }).then((r) => r.json());
    setEditing(null);
    fetchList();
  }

  async function remove(id: number) {
    if (!confirm('Delete dispensary?')) return;
    await fetch(`/api/admin/dispensaries?id=${id}`, { method: 'DELETE' });
    fetchList();
  }

  if (!session)
    return <div className="p-6">Sign in as admin to manage dispensaries.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Dispensaries</h1>
      <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <h2 className="font-semibold mb-2">
          {editing?.id ? 'Edit' : 'Add new'} dispensary
        </h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex flex-col gap-1">
            <label className="text-slate-300">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              placeholder="Ex: Green Valley Dispensary"
              value={editing?.name || ''}
              onChange={(e) =>
                setEditing({ ...editing!, name: e.target.value })
              }
              className="p-2 rounded-md bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-slate-300">
              Slug <span className="text-red-400">*</span>
            </label>
            <input
              placeholder="green-valley-dispensary"
              value={editing?.slug || ''}
              onChange={(e) =>
                setEditing({ ...editing!, slug: e.target.value })
              }
              className="p-2 rounded-md bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500"
            />
            <p className="text-[10px] text-slate-500">
              URL-safe unique ID, used in links (no spaces, lowercase, dashes).
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-slate-300">City</label>
            <input
              placeholder="Denver"
              value={editing?.city || ''}
              onChange={(e) =>
                setEditing({ ...editing!, city: e.target.value })
              }
              className="p-2 rounded-md bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-slate-300">
              State <span className="text-red-400">*</span>
            </label>
            <input
              placeholder="CO"
              value={editing?.state || ''}
              onChange={(e) =>
                setEditing({ ...editing!, state: e.target.value })
              }
              className="p-2 rounded-md bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-slate-300 text-xs">
              Latitude (optional)
            </label>
            <input
              placeholder="39.7392"
              type="number"
              value={editing?.latitude ?? ''}
              onChange={(e) =>
                setEditing({
                  ...editing!,
                  latitude: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="p-2 rounded-md bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-slate-300 text-xs">
              Longitude (optional)
            </label>
            <input
              placeholder="-104.9903"
              type="number"
              value={editing?.longitude ?? ''}
              onChange={(e) =>
                setEditing({
                  ...editing!,
                  longitude: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                })
              }
              className="p-2 rounded-md bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="mt-3">
          <button
            onClick={save}
            className="px-3 py-1 bg-sky-600 text-white rounded"
          >
            Save
          </button>
          <button
            onClick={() => setEditing(null)}
            className="ml-2 px-3 py-1 border rounded"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        {loading && <div>Loading...</div>}
        {items.map((it) => (
          <div
            key={it.id}
            className="bg-slate-900/70 border border-slate-800 p-3 rounded-lg flex justify-between items-center"
          >
            <div>
              <div className="font-semibold">{it.name}</div>
              <div className="text-sm text-gray-500">
                {it.city}, {it.state}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => edit(it)}
                className="px-2 py-1 border rounded"
              >
                Edit
              </button>
              <button
                onClick={() => remove(it.id)}
                className="px-2 py-1 border rounded text-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
