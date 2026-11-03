import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import type { DashboardSummary } from "@/lib/demo-data";

const summaryItems: {
  key: keyof DashboardSummary;
  label: string;
  detail: string;
}[] = [
  {
    key: "totalApplicants",
    label: "Total applicants",
    detail: "Applications stored in the database",
  },
  {
    key: "inReview",
    label: "In review",
    detail: "Pipeline stage is In review",
  },
  {
    key: "shortlisted",
    label: "Shortlisted",
    detail: "Pipeline stage is Shortlisted",
  },
  {
    key: "activeJobs",
    label: "Active jobs",
    detail: "Jobs with status Active",
  },
];

export function SummaryCards({ summary }: { summary: DashboardSummary }) {
  return (
    <section aria-labelledby="pipeline-summary-heading">
      <h2 id="pipeline-summary-heading" className="sr-only">
        Pipeline summary
      </h2>
      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryItems.map((item) => (
          <Card
            key={item.key}
            size="sm"
            className="bg-white shadow-none ring-slate-200"
          >
            <CardHeader>
              <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                {item.label}
              </dt>
              <dd className="text-2xl font-semibold tracking-tight text-slate-950 tabular-nums">
                {summary[item.key]}
              </dd>
            </CardHeader>
            <CardContent>
              <p className="text-xs leading-5 text-slate-500">{item.detail}</p>
            </CardContent>
          </Card>
        ))}
      </dl>
    </section>
  );
}
