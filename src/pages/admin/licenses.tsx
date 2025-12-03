import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function AdminLicenses() {
  const { data: session } = useSession();
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!session) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-300">
          Sign in as an admin to manage licenses.
        </p>
      </div>
    );
  }

  // Handle CSV form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setImporting(true);
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    try {
      const res = await fetch('/api/admin/licenses/import', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        // Get error message from response
        const errorData = await res.json();
        throw new Error(errorData.error || 'Import failed');
      }
      const result = await res.json();
      // Construct success message with counts
      const { imported, updated, linked } = result;
      setMessage(`Successfully imported ${imported} licenses (${updated} updated). Auto-linked ${linked} licenses to existing entities.`);
    } catch (err: any) {
      console.error('Import error:', err);
      setMessage(`Error: ${err.message}`);
    } finally {
      setImporting(false);
      // Optionally, reset form inputs if needed
      form.reset();
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold mb-1">State licenses</h1>
      <p className="text-sm text-slate-400 mb-4">
        This section allows you to import state license datasets and link them to brands, locations, and labs.
      </p>

      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300 space-y-3">
        <p>
          <span className="font-semibold">Import licenses:</span> Upload a state license CSV file to import license records.
        </p>
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label htmlFor="stateCode" className="text-xs text-slate-400 w-28">
              State Code:
            </label>
            <input 
              id="stateCode" 
              name="stateCode" 
              type="text" 
              required 
              maxLength={2} 
              placeholder="e.g. CO" 
              className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 text-sm placeholder-slate-500"
              disabled={importing}
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label htmlFor="file" className="text-xs text-slate-400 w-28">
              CSV File:
            </label>
            <input 
              id="file" 
              name="file" 
              type="file" 
              accept=".csv,text/csv" 
              required 
              className="flex-1 text-sm text-slate-300 file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700 disabled:opacity-50"
              disabled={importing}
            />
          </div>
          <button 
            type="submit" 
            className="mt-2 px-4 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm disabled:opacity-50"
            disabled={importing}
          >
            {importing ? 'Importing…' : 'Import'}
          </button>
        </form>

        {/* Status message */}
        {message && (
          <p className={`text-sm ${message.startsWith('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
