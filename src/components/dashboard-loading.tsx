export function DashboardLoading() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-6">
      <p className="text-sm text-slate-500">Loading overview…</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {["applicants", "review", "shortlisted", "jobs"].map((key) => (
          <div
            key={key}
            className="h-24 animate-pulse rounded-xl bg-white ring-1 ring-slate-200"
          />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-xl bg-white ring-1 ring-slate-200" />
    </div>
  );
}
