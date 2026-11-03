"use client";

import { Button } from "@/components/ui/button";
import { catchError, type ErrorInfo } from "next/error";

function OverviewErrorFallback(_props: object, { retry }: ErrorInfo) {
  return (
    <section
      role="alert"
      className="rounded-xl border border-slate-200 bg-white px-6 py-10"
    >
      <h2 className="text-base font-semibold text-slate-950">
        The overview could not be loaded
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        Screenline could not read the demo database. Counts and recent
        applications stay hidden until the query succeeds. Sample records are
        not substituted.
      </p>
      <Button type="button" className="mt-4" onClick={() => retry()}>
        Try again
      </Button>
    </section>
  );
}

export const OverviewErrorBoundary = catchError(OverviewErrorFallback);
