import { ApplicantListControls } from "@/components/applicant-list-controls";
import { StageBadge } from "@/components/stage-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getApplicantList,
  getJobFilterOptions,
} from "@/db/queries/applicants";
import {
  applicantListHref,
  parseApplicantFilters,
  type ApplicantFilters,
} from "@/lib/applicant-filters";
import { demonstrationNotice } from "@/lib/demo-data";
import { redirect } from "next/navigation";
import Link from "next/link";

const applicationDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function formatApplicationDate(isoDate: string): string {
  return applicationDate.format(new Date(`${isoDate}T00:00:00Z`));
}

function filtersAreActive(filters: ApplicantFilters): boolean {
  return (
    filters.q.length > 0 ||
    filters.stage !== "all" ||
    filters.job !== "all" ||
    filters.sort !== "newest"
  );
}

export async function ApplicantResults({
  searchParams,
}: {
  searchParams: PageProps<"/applicants">["searchParams"];
}) {
  const requested = parseApplicantFilters(await searchParams);
  const [list, jobs] = await Promise.all([
    getApplicantList(requested),
    getJobFilterOptions(),
  ]);

  if (list.page !== requested.page) {
    redirect(applicantListHref(list.filters));
  }

  const { applicants, total, page, pageSize, totalPages, filters } = list;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = total === 0 ? 0 : rangeStart + applicants.length - 1;
  const previousHref =
    page > 1 ? applicantListHref({ ...filters, page: page - 1 }) : null;
  const nextHref =
    page < totalPages ? applicantListHref({ ...filters, page: page + 1 }) : null;

  return (
    <section aria-labelledby="applicant-list-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="applicant-list-heading"
          className="text-lg font-semibold tracking-tight text-slate-950"
        >
          Applications
        </h2>
        <p className="text-sm text-slate-500">
          {total} {total === 1 ? "application" : "applications"}
        </p>
      </div>
      <p className="text-sm leading-6 text-slate-600">{demonstrationNotice}</p>
      <ApplicantListControls filters={filters} jobs={jobs} />

      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
        {applicants.length === 0 ? (
          <div className="px-6 py-12">
            <h3 className="text-sm font-semibold text-slate-950">
              {filtersAreActive(filters)
                ? "No applications match these filters"
                : "No applications are stored yet"}
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              {filtersAreActive(filters)
                ? "Try another name, email, job, or stage."
                : "The demo database does not have any application rows."}
            </p>
            {filtersAreActive(filters) ? (
              <Link
                href="/applicants"
                className="mt-4 inline-flex rounded-md text-sm font-medium text-slate-900 underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:outline-none"
              >
                Clear filters
              </Link>
            ) : null}
          </div>
        ) : (
          <Table className="min-w-[52rem]">
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-slate-50">
                <TableHead
                  scope="col"
                  className="px-4 text-xs tracking-wide text-slate-500 uppercase"
                >
                  Candidate name
                </TableHead>
                <TableHead
                  scope="col"
                  className="text-xs tracking-wide text-slate-500 uppercase"
                >
                  Candidate email
                </TableHead>
                <TableHead
                  scope="col"
                  className="text-xs tracking-wide text-slate-500 uppercase"
                >
                  Applied position
                </TableHead>
                <TableHead
                  scope="col"
                  className="text-xs tracking-wide text-slate-500 uppercase"
                >
                  Application date
                </TableHead>
                <TableHead
                  scope="col"
                  className="px-4 text-xs tracking-wide text-slate-500 uppercase"
                >
                  Recruiting stage
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applicants.map((applicant) => (
                <TableRow key={applicant.id}>
                  <TableCell className="px-4 whitespace-normal">
                    <Link
                      href={`/applicants/${applicant.id}`}
                      className="rounded-sm font-medium text-slate-950 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:outline-none"
                    >
                      {applicant.name}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-normal text-slate-600">
                    {applicant.email}
                  </TableCell>
                  <TableCell className="text-slate-700">
                    {applicant.jobTitle}
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
          </Table>
        )}

        {total > 0 ? (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Showing {rangeStart}–{rangeEnd} of {total}{" "}
              {total === 1 ? "application" : "applications"}
            </p>
            <nav aria-label="Pagination" className="flex items-center gap-3">
              {previousHref ? (
                <Link
                  href={previousHref}
                  className="rounded-md px-2 py-1 text-sm font-medium text-slate-900 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:outline-none"
                >
                  Previous
                </Link>
              ) : (
                <span aria-disabled="true" className="px-2 py-1 text-sm text-slate-400">
                  Previous
                </span>
              )}
              <p className="text-sm text-slate-700">
                Page {page} of {totalPages}
              </p>
              {nextHref ? (
                <Link
                  href={nextHref}
                  className="rounded-md px-2 py-1 text-sm font-medium text-slate-900 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:outline-none"
                >
                  Next
                </Link>
              ) : (
                <span aria-disabled="true" className="px-2 py-1 text-sm text-slate-400">
                  Next
                </span>
              )}
            </nav>
          </div>
        ) : null}
      </div>
    </section>
  );
}
