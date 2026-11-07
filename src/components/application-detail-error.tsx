"use client";

import { Button } from "@/components/ui/button";
import { catchError, type ErrorInfo } from "next/error";
import Link from "next/link";

function ApplicationDetailErrorFallback(_props: object, { retry }: ErrorInfo) {
  return (
    <section
      role="alert"
      className="rounded-xl border border-slate-200 bg-white px-6 py-10"
    >
      <h2 className="text-base font-semibold text-slate-950">
        The application could not be loaded
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        Screenline could not read this application from the demo database.
        The record stays hidden until the query succeeds.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Button type="button" onClick={() => retry()}>
          Try again
        </Button>
        <Link
          href="/applicants"
          className="text-sm font-medium text-slate-900 underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:outline-none"
        >
          Back to applicants
        </Link>
      </div>
    </section>
  );
}

export const ApplicationDetailErrorBoundary = catchError(
  ApplicationDetailErrorFallback,
);
