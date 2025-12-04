export default function AdminLabResultsPage() {
    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-semibold mb-1">Lab Results</h1>
            <p className="text-sm text-slate-400 mb-4">
                This section will show normalized lab results (COAs) parsed from PDF uploads and linked to batches and labs.
            </p>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
                <p>
                    <span className="font-semibold">Coming soon:</span> COA-derived data tables, potency & safety summaries, and links back to the source documents.
                </p>
            </div>
        </div>
    );
}
