import { db } from "@/db/client";
import { applications, candidates, jobs } from "@/db/schema";
import {
  applicantPageSize,
  escapeLikePattern,
  parseApplicantFilters,
  type ApplicantFilters,
  type ApplicantSort,
} from "@/lib/applicant-filters";
import type { JobStatus, PipelineStage } from "@/lib/demo-data";
import { and, asc, count, desc, eq, sql, type SQL } from "drizzle-orm";
import { unstable_rethrow } from "next/navigation";

export type ApplicantListItem = {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  jobSlug: string;
  stage: PipelineStage;
  appliedOn: string;
};

export type ApplicantListResult = {
  applicants: ApplicantListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filters: ApplicantFilters;
};

export type JobFilterOption = {
  id: string;
  slug: string;
  title: string;
  status: JobStatus;
};

function asCount(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error("The applicant list could not be loaded.");
  }
  return parsed;
}

function isPrerenderSignal(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const record = error as {
    name?: unknown;
    digest?: unknown;
    message?: unknown;
    cause?: unknown;
  };
  if (record.name === "AbortError") return true;
  if (typeof record.digest === "string") return true;
  if (
    typeof record.message === "string" &&
    record.message.includes("During prerendering")
  ) {
    return true;
  }
  return isPrerenderSignal(record.cause);
}

function databaseError(error: unknown): Error {
  unstable_rethrow(error);
  if (isPrerenderSignal(error)) throw error;

  const raw = error instanceof Error ? error.message : "";
  const sanitized = raw
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted]")
    .replace(/\b[\w.-]+\.neon\.tech\b\S*/gi, "[redacted-host]");

  if (
    sanitized.includes("://") ||
    sanitized.includes("@") ||
    /password|DATABASE_URL/i.test(sanitized)
  ) {
    console.error("Applicant query failed. Connection details were omitted.");
  } else if (sanitized.trim().length > 0) {
    console.error(`Applicant query failed: ${sanitized.trim()}`);
  } else {
    console.error("Applicant query failed.");
  }

  return new Error("The applicant list could not be loaded.");
}

function utcDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/**
 * Sort columns are chosen from this allowlist. The request value is never
 * interpolated into SQL.
 */
function orderBySort(sort: ApplicantSort) {
  switch (sort) {
    case "oldest":
      return [asc(applications.appliedAt), asc(applications.id)] as const;
    case "name_asc":
      return [asc(candidates.name), asc(applications.id)] as const;
    case "name_desc":
      return [desc(candidates.name), desc(applications.id)] as const;
    case "newest":
      return [desc(applications.appliedAt), desc(applications.id)] as const;
  }
}

function searchCondition(query: string): SQL {
  const pattern = `%${escapeLikePattern(query)}%`;
  return sql`(
    ${candidates.name} ilike ${pattern} escape '!'
    or ${candidates.email} ilike ${pattern} escape '!'
    or ${jobs.title} ilike ${pattern} escape '!'
  )`;
}

function filterConditions(filters: ApplicantFilters): SQL | undefined {
  const conditions: SQL[] = [];

  if (filters.q.length > 0) conditions.push(searchCondition(filters.q));
  if (filters.stage !== "all") {
    conditions.push(eq(applications.stage, filters.stage));
  }
  if (filters.job !== "all") conditions.push(eq(jobs.slug, filters.job));

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function joinedApplications() {
  return db
    .select({
      id: applications.id,
      name: candidates.name,
      email: candidates.email,
      jobTitle: jobs.title,
      jobSlug: jobs.slug,
      stage: applications.stage,
      appliedAt: applications.appliedAt,
    })
    .from(applications)
    .innerJoin(candidates, eq(applications.candidateId, candidates.id))
    .innerJoin(jobs, eq(applications.jobId, jobs.id));
}

function applicationCount() {
  return db
    .select({ total: count() })
    .from(applications)
    .innerJoin(candidates, eq(applications.candidateId, candidates.id))
    .innerJoin(jobs, eq(applications.jobId, jobs.id));
}

export async function getApplicantList(
  filters: ApplicantFilters,
): Promise<ApplicantListResult> {
  const safe = parseApplicantFilters(filters);

  try {
    const where = filterConditions(safe);
    const countQuery = applicationCount();
    const countRows = await (where ? countQuery.where(where) : countQuery);
    const total = asCount(countRows[0]?.total);
    const totalPages = total === 0 ? 0 : Math.ceil(total / applicantPageSize);
    const page = totalPages === 0 ? 1 : Math.min(safe.page, totalPages);
    const offset = (page - 1) * applicantPageSize;
    const ordering = orderBySort(safe.sort);
    const listQuery = joinedApplications();
    const rows = await (where ? listQuery.where(where) : listQuery)
      .orderBy(...ordering)
      .limit(applicantPageSize)
      .offset(offset);

    return {
      applicants: rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        jobTitle: row.jobTitle,
        jobSlug: row.jobSlug,
        stage: row.stage,
        appliedOn: utcDate(row.appliedAt),
      })),
      total,
      page,
      pageSize: applicantPageSize,
      totalPages,
      filters: { ...safe, page },
    };
  } catch (error) {
    throw databaseError(error);
  }
}

export async function getJobFilterOptions(): Promise<JobFilterOption[]> {
  try {
    return await db
      .select({
        id: jobs.id,
        slug: jobs.slug,
        title: jobs.title,
        status: jobs.status,
      })
      .from(jobs)
      .orderBy(asc(jobs.title), asc(jobs.slug));
  } catch (error) {
    throw databaseError(error);
  }
}
