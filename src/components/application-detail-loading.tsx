export function ApplicationDetailLoading() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4">
      <p className="text-sm text-slate-500">Loading application…</p>
      <div className="h-8 w-56 animate-pulse rounded-md bg-white ring-1 ring-slate-200" />
      <div className="h-32 animate-pulse rounded-xl bg-white ring-1 ring-slate-200" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-40 animate-pulse rounded-xl bg-white ring-1 ring-slate-200" />
        <div className="h-40 animate-pulse rounded-xl bg-white ring-1 ring-slate-200" />
      </div>
    </div>
  );
}
