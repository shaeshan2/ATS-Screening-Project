import type { Metadata } from "next";
import { RecentApplicants } from "@/components/recent-applicants";
import { SummaryCards } from "@/components/summary-cards";
import {
  demonstrationNotice,
  getDashboardSummary,
  getRecentApplicants,
} from "@/lib/demo-data";

export const metadata: Metadata = {
  title: {
    absolute: "Overview · Screenline",
  },
  description:
    "Demonstration overview of sample applicants, pipeline stages, and active jobs.",
};

export default function OverviewPage() {
  const summary = getDashboardSummary();
  const recentApplicants = getRecentApplicants();

  return (
    <>
      <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
        <span className="font-medium text-slate-900">Demonstration data. </span>
        {demonstrationNotice}
      </p>
      <SummaryCards summary={summary} />
      <RecentApplicants applicants={recentApplicants} />
    </>
  );
}
