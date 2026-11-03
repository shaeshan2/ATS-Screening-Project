import { StageBadge } from "@/components/stage-badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  demoApplicants,
  type ApplicantPreview,
} from "@/lib/demo-data";

const applicationDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function formatApplicationDate(isoDate: string): string {
  return applicationDate.format(new Date(`${isoDate}T00:00:00Z`));
}

export function RecentApplicants({
  applicants,
}: {
  applicants: readonly ApplicantPreview[];
}) {
  return (
    <section
      aria-labelledby="recent-applicants-heading"
      className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200"
    >
      <div className="border-b border-slate-200 px-4 py-3">
        <h2
          id="recent-applicants-heading"
          className="text-sm font-semibold text-slate-950"
        >
          Recent applicants
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Newest records in the demonstration set. This is a preview, not a
          saved pipeline.
        </p>
      </div>
      <Table className="min-w-[44rem]">
        <TableHeader className="bg-slate-50">
          <TableRow className="hover:bg-slate-50">
            <TableHead scope="col" className="px-4 text-xs tracking-wide text-slate-500 uppercase">
              Candidate name
            </TableHead>
            <TableHead scope="col" className="text-xs tracking-wide text-slate-500 uppercase">
              Applied position
            </TableHead>
            <TableHead scope="col" className="text-xs tracking-wide text-slate-500 uppercase">
              Application date
            </TableHead>
            <TableHead scope="col" className="px-4 text-xs tracking-wide text-slate-500 uppercase">
              Pipeline stage
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applicants.map((applicant) => (
            <TableRow key={applicant.id}>
              <TableCell className="px-4 whitespace-normal">
                <div className="font-medium text-slate-950">
                  {applicant.name}
                </div>
                <div className="text-xs text-slate-500">{applicant.email}</div>
              </TableCell>
              <TableCell className="text-slate-700">
                {applicant.position}
              </TableCell>
              <TableCell className="text-slate-700">
                <time dateTime={applicant.appliedOn}>
                  {formatApplicationDate(applicant.appliedOn)}
                </time>
              </TableCell>
              <TableCell className="px-4">
                <StageBadge stage={applicant.stage} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableCaption className="mt-0 border-t border-slate-200 px-4 py-3 text-left text-xs text-slate-500">
          Showing {applicants.length} of {demoApplicants.length} fictional
          applicants, newest first. These rows are demonstration data and are
          not saved.
        </TableCaption>
      </Table>
    </section>
  );
}
