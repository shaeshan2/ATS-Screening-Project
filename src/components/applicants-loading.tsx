export function ApplicantsLoading() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4">
      <p className="text-sm text-slate-500">Loading applicants…</p>
      <div className="h-28 animate-pulse rounded-xl bg-white ring-1 ring-slate-200" />
      <div className="h-96 animate-pulse rounded-xl bg-white ring-1 ring-slate-200" />
    </div>
  );
}
