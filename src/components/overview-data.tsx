import { RecentApplicants } from "@/components/recent-applicants";
import { SummaryCards } from "@/components/summary-cards";
import {
  getDashboardSummary,
  getRecentApplicants,
} from "@/db/queries/dashboard";

export async function OverviewData() {
  const [summary, recentApplicants] = await Promise.all([
    getDashboardSummary(),
    getRecentApplicants(),
  ]);

  return (
    <>
      <SummaryCards summary={summary} />
      <RecentApplicants
        applicants={recentApplicants}
        totalApplications={summary.totalApplicants}
      />
    </>
  );
}
