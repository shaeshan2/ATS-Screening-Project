"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  applicantListHref,
  maxSearchLength,
  type ApplicantFilters,
  type ApplicantSort,
} from "@/lib/applicant-filters";
import { pipelineStages, type JobStatus } from "@/lib/demo-data";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

type JobOption = {
  id: string;
  slug: string;
  title: string;
  status: JobStatus;
};

const fieldClassName =
  "h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-900 outline-none focus-visible:border-teal-700 focus-visible:ring-2 focus-visible:ring-teal-700/30";

export function ApplicantListControls({
  filters,
  jobs,
}: {
  filters: ApplicantFilters;
  jobs: readonly JobOption[];
}) {
  const router = useRouter();
  const [trackedQuery, setTrackedQuery] = useState(filters.q);
  const [query, setQuery] = useState(filters.q);
  if (trackedQuery !== filters.q) {
    setTrackedQuery(filters.q);
    setQuery(filters.q);
  }
  const filtersActive =
    filters.q.length > 0 ||
    filters.stage !== "all" ||
    filters.job !== "all" ||
    filters.sort !== "newest";
  const knownJob = jobs.some((job) => job.slug === filters.job);

  useEffect(() => {
    const nextQuery = query.trim().slice(0, maxSearchLength);
    if (nextQuery === filters.q) return;

    const nextFilters = {
      q: nextQuery,
      stage: filters.stage,
      job: filters.job,
      sort: filters.sort,
      page: 1,
    } as const;
    const timeout = window.setTimeout(() => {
      router.push(applicantListHref(nextFilters));
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [filters.job, filters.q, filters.sort, filters.stage, query, router]);

  function visit(
    next: Partial<Pick<ApplicantFilters, "job" | "stage" | "sort" | "q">>,
  ) {
    router.push(
      applicantListHref({
        ...filters,
        ...next,
        q: (next.q ?? query).trim().slice(0, maxSearchLength),
        page: 1,
      }),
    );
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    visit({ q: query });
  }

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label
            htmlFor="applicant-search"
            className="text-xs font-medium text-slate-700"
          >
            Search applicants
          </label>
          <Input
            id="applicant-search"
            name="q"
            type="search"
            value={query}
            maxLength={maxSearchLength}
            autoComplete="off"
            placeholder="Name, email, or position"
            onChange={(event) => setQuery(event.target.value)}
            className={fieldClassName}
          />
        </div>
        <Button type="submit" className="sm:mb-px">
          Search
        </Button>
        {filtersActive ? (
          <Link
            href="/applicants"
            className="inline-flex h-8 items-center rounded-md px-2 text-sm font-medium text-slate-700 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:outline-none"
          >
            Clear filters
          </Link>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="applicant-job" className="text-xs font-medium text-slate-700">
            Job
          </label>
          <select
            id="applicant-job"
            name="job"
            value={filters.job}
            className={fieldClassName}
            onChange={(event) => visit({ job: event.target.value })}
          >
            <option value="all">All jobs</option>
            {!knownJob && filters.job !== "all" ? (
              <option value={filters.job}>{filters.job}</option>
            ) : null}
            {jobs.map((job) => (
              <option key={job.id} value={job.slug}>
                {job.status === "Closed" ? `${job.title} (Closed)` : job.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="applicant-stage"
            className="text-xs font-medium text-slate-700"
          >
            Stage
          </label>
          <select
            id="applicant-stage"
            name="stage"
            value={filters.stage}
            className={fieldClassName}
            onChange={(event) =>
              visit({ stage: event.target.value as ApplicantFilters["stage"] })
            }
          >
            <option value="all">All stages</option>
            {pipelineStages.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="applicant-sort" className="text-xs font-medium text-slate-700">
            Sort
          </label>
          <select
            id="applicant-sort"
            name="sort"
            value={filters.sort}
            className={fieldClassName}
            onChange={(event) =>
              visit({ sort: event.target.value as ApplicantSort })
            }
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name_asc">Name A–Z</option>
            <option value="name_desc">Name Z–A</option>
          </select>
        </div>
      </div>
    </form>
  );
}
