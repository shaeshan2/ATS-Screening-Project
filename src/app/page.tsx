import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardLoading } from "@/components/dashboard-loading";
import { OverviewData } from "@/components/overview-data";
import { OverviewErrorBoundary } from "@/components/overview-error";
import { demonstrationNotice } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: {
    absolute: "Overview · Screenline",
  },
  description:
    "Overview of fictional applications and jobs stored in the demo PostgreSQL database.",
};

export default function OverviewPage() {
  return (
    <>
      <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
        <span className="font-medium text-slate-900">Demonstration data. </span>
        {demonstrationNotice}
      </p>
      <OverviewErrorBoundary>
        <Suspense fallback={<DashboardLoading />}>
          <OverviewData />
        </Suspense>
      </OverviewErrorBoundary>
    </>
  );
}
