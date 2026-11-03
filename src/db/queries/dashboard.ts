import { db } from "@/db/client";
import { applications, candidates, jobs } from "@/db/schema";
import {
  recentApplicantLimit,
  type ApplicantPreview,
  type DashboardSummary,
  type PipelineStage,
} from "@/lib/demo-data";
import { count, desc, eq, sql } from "drizzle-orm";
import { unstable_rethrow } from "next/navigation";

/**
 * Read-only overview queries. They are not wrapped in "use cache", so a request
 * reads the current database instead of a build-time snapshot.
 */
const recentApplicationLimit = recentApplicantLimit;

function asCount(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error("The overview could not be loaded from the database.");
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
  if (isPrerenderSignal(error)) {
    throw error;
  }

  const raw = error instanceof Error ? error.message : "";
  const sanitized = raw
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted]")
    .replace(/\b[\w.-]+\.neon\.tech\b\S*/gi, "[redacted-host]");

  if (
    sanitized.includes("://") ||
    sanitized.includes("@") ||
    /password|DATABASE_URL/i.test(sanitized)
  ) {
    console.error("Overview query failed. Connection details were omitted.");
  } else if (sanitized.trim().length > 0) {
    console.error(`Overview query failed: ${sanitized.trim()}`);
  } else {
    console.error("Overview query failed.");
  }

  return new Error("The overview could not be loaded from the database.");
}

function utcDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    const [applicationCounts, activeJobCounts] = await Promise.all([
      db
        .select({
          totalApplicants: count(),
          inReview: sql<number>`count(*) filter (where ${applications.stage} = 'In review')`,
          shortlisted: sql<number>`count(*) filter (where ${applications.stage} = 'Shortlisted')`,
        })
        .from(applications),
      db
        .select({ activeJobs: count() })
        .from(jobs)
        .where(eq(jobs.status, "Active")),
    ]);

    const applicationsRow = applicationCounts[0];
    const jobsRow = activeJobCounts[0];
    if (!applicationsRow || !jobsRow) {
      throw new Error("The overview could not be loaded from the database.");
    }

    return {
      totalApplicants: asCount(applicationsRow.totalApplicants),
      inReview: asCount(applicationsRow.inReview),
      shortlisted: asCount(applicationsRow.shortlisted),
      activeJobs: asCount(jobsRow.activeJobs),
    };
  } catch (error) {
    throw databaseError(error);
  }
}

export async function getRecentApplicants(
  limit = recentApplicationLimit,
): Promise<ApplicantPreview[]> {
  try {
    const rows = await db
      .select({
        id: applications.id,
        name: candidates.name,
        email: candidates.email,
        position: jobs.title,
        appliedAt: applications.appliedAt,
        stage: applications.stage,
      })
      .from(applications)
      .innerJoin(candidates, eq(applications.candidateId, candidates.id))
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .orderBy(desc(applications.appliedAt), desc(applications.id))
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      position: row.position,
      appliedOn: utcDate(row.appliedAt),
      stage: row.stage satisfies PipelineStage,
    }));
  } catch (error) {
    throw databaseError(error);
  }
}
