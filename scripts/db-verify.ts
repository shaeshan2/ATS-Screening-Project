import { count, desc, eq, isNull, sql } from "drizzle-orm";
import { config } from "dotenv";
import {
  applicationEvents,
  applicationNotes,
  applications,
  candidates,
  jobs,
} from "../src/db/schema";
import {
  pipelineStages,
  recentApplicantLimit,
  type JobStatus,
  type PipelineStage,
} from "../src/lib/demo-data";

/**
 * Clean-demo expectations from scripts/seed.ts. Verification only reads.
 * Extra rows are reported and left in place.
 */
const expectedJobCount = 5;
const expectedCandidateCount = 300;
const expectedApplicationCount = 300;
const expectedApplicationsPerStage = 60;
const expectedApplicationsPerJob = 60;

const expectedJobs = [
  { slug: "product-designer", title: "Product Designer", status: "Active" },
  { slug: "backend-engineer", title: "Backend Engineer", status: "Active" },
  {
    slug: "frontend-engineer",
    title: "Frontend Engineer",
    status: "Active",
  },
  { slug: "data-analyst", title: "Data Analyst", status: "Active" },
  {
    slug: "customer-support-lead",
    title: "Customer Support Lead",
    status: "Closed",
  },
] as const satisfies readonly {
  slug: string;
  title: string;
  status: JobStatus;
}[];

type Check = {
  label: string;
  passed: boolean;
  detail: string;
};

function sanitizeDatabaseError(error: unknown): string {
  const raw = error instanceof Error ? error.message : "Unknown database error";
  const sanitized = raw
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted]")
    .replace(/\b[A-Za-z0-9._%+-]*:[^@\s/]+@[A-Za-z0-9.-]+/g, "[redacted]")
    .replace(/\b[\w.-]+\.neon\.tech\b\S*/gi, "[redacted-host]")
    .replace(
      /(password|pwd|secret|token|database_url)\s*[=:]\s*\S+/gi,
      "$1=[redacted]",
    );

  if (
    /postgres(?:ql)?:\/\//i.test(sanitized) ||
    sanitized.includes("://") ||
    sanitized.includes("@")
  ) {
    return "The database request failed. Connection details were omitted.";
  }

  const trimmed = sanitized.trim();
  return trimmed.length > 0
    ? trimmed
    : "The database request failed. Connection details were omitted.";
}

function fail(message: string): never {
  console.error(`Database verification failed: ${message}`);
  process.exit(1);
}

function asCount(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error("A verification query did not return a count.");
  }
  return parsed;
}

function check(label: string, passed: boolean, detail: string): Check {
  return { label, passed, detail };
}

function isExampleEmail(email: string): boolean {
  return /^[^\s@]+@example\.com$/i.test(email);
}

function recentRowsAreOrdered(
  rows: readonly { appliedAt: Date; id: string }[],
): boolean {
  for (let index = 1; index < rows.length; index += 1) {
    const previous = rows[index - 1];
    const current = rows[index];
    if (!previous || !current) return false;
    const timeDelta = current.appliedAt.getTime() - previous.appliedAt.getTime();
    if (timeDelta > 0) return false;
    if (timeDelta === 0 && current.id.toLowerCase() > previous.id.toLowerCase()) {
      return false;
    }
  }
  return true;
}

async function main(): Promise<void> {
  const loaded = config({ path: ".env.local", quiet: true });
  if (loaded.error && !process.env.DATABASE_URL?.trim()) {
    fail(".env.local could not be loaded and DATABASE_URL is not set.");
  }

  const { db } = await import("../src/db/client");

  const [
    jobCountRow,
    candidateCountRow,
    applicationCountRow,
    noteCountRow,
    eventCountRow,
    stageRows,
    jobRows,
    applicationsByJob,
    duplicateEmailRow,
    caseInsensitiveEmailRow,
    duplicatePairRow,
    missingCandidateRow,
    missingJobRow,
    orphanNoteRow,
    orphanEventRow,
    nonExampleEmailRow,
    recentRows,
  ] = await Promise.all([
    db.select({ total: count() }).from(jobs),
    db.select({ total: count() }).from(candidates),
    db.select({ total: count() }).from(applications),
    db.select({ total: count() }).from(applicationNotes),
    db.select({ total: count() }).from(applicationEvents),
    db
      .select({ stage: applications.stage, total: count() })
      .from(applications)
      .groupBy(applications.stage),
    db
      .select({ slug: jobs.slug, title: jobs.title, status: jobs.status })
      .from(jobs),
    db
      .select({ slug: jobs.slug, total: count() })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .groupBy(jobs.slug),
    db
      .select({ groups: sql<number>`count(*)::int` })
      .from(
        db
          .select({ email: candidates.email })
          .from(candidates)
          .groupBy(candidates.email)
          .having(sql`count(*) > 1`)
          .as("duplicate_emails"),
      ),
    db.execute<{ total: number | string }>(sql`
      select count(*)::int as total
      from (
        select lower(email) as normalized_email
        from ${candidates}
        group by lower(email)
        having count(*) > 1
      ) duplicated
    `),
    db
      .select({ groups: sql<number>`count(*)::int` })
      .from(
        db
          .select({
            candidateId: applications.candidateId,
            jobId: applications.jobId,
          })
          .from(applications)
          .groupBy(applications.candidateId, applications.jobId)
          .having(sql`count(*) > 1`)
          .as("duplicate_pairs"),
      ),
    db
      .select({ total: count() })
      .from(applications)
      .leftJoin(candidates, eq(applications.candidateId, candidates.id))
      .where(isNull(candidates.id)),
    db
      .select({ total: count() })
      .from(applications)
      .leftJoin(jobs, eq(applications.jobId, jobs.id))
      .where(isNull(jobs.id)),
    db
      .select({ total: count() })
      .from(applicationNotes)
      .leftJoin(applications, eq(applicationNotes.applicationId, applications.id))
      .where(isNull(applications.id)),
    db
      .select({ total: count() })
      .from(applicationEvents)
      .leftJoin(
        applications,
        eq(applicationEvents.applicationId, applications.id),
      )
      .where(isNull(applications.id)),
    db
      .select({ total: count() })
      .from(candidates)
      .where(sql`${candidates.email} !~* ${"^[^[:space:]@]+@example\\.com$"}`),
    db
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
      .limit(recentApplicantLimit),
  ]);

  const jobCount = asCount(jobCountRow[0]?.total);
  const candidateCount = asCount(candidateCountRow[0]?.total);
  const applicationCount = asCount(applicationCountRow[0]?.total);
  const noteCount = asCount(noteCountRow[0]?.total);
  const eventCount = asCount(eventCountRow[0]?.total);
  const duplicateEmailGroups = asCount(duplicateEmailRow[0]?.groups);
  const caseInsensitiveEmailGroups = asCount(
    caseInsensitiveEmailRow.rows[0]?.total,
  );
  const duplicatePairGroups = asCount(duplicatePairRow[0]?.groups);
  const missingCandidates = asCount(missingCandidateRow[0]?.total);
  const missingJobs = asCount(missingJobRow[0]?.total);
  const orphanNotes = asCount(orphanNoteRow[0]?.total);
  const orphanEvents = asCount(orphanEventRow[0]?.total);
  const nonExampleEmails = asCount(nonExampleEmailRow[0]?.total);

  const stageCounts = new Map<PipelineStage, number>();
  for (const stage of pipelineStages) stageCounts.set(stage, 0);
  for (const row of stageRows) {
    stageCounts.set(row.stage, asCount(row.total));
  }
  const stageTotal = [...stageCounts.values()].reduce(
    (sum, value) => sum + value,
    0,
  );

  const applicationsForSlug = new Map(
    applicationsByJob.map((row) => [row.slug, asCount(row.total)]),
  );
  const jobMismatches: string[] = [];
  const seenSlugs = new Set<string>();
  for (const expected of expectedJobs) {
    const matches = jobRows.filter((row) => row.slug === expected.slug);
    if (matches.length !== 1) {
      jobMismatches.push(`${expected.slug} appears ${matches.length} times`);
      continue;
    }
    const row = matches[0];
    if (!row) continue;
    seenSlugs.add(row.slug);
    if (row.title !== expected.title) {
      jobMismatches.push(`${expected.slug} title does not match the demo job`);
    }
    if (row.status !== expected.status) {
      jobMismatches.push(
        `${expected.slug} status is ${row.status}, expected ${expected.status}`,
      );
    }
  }
  const unexpectedSlugs = jobRows
    .filter((row) => !seenSlugs.has(row.slug))
    .map((row) => row.slug);
  if (unexpectedSlugs.length > 0) {
    jobMismatches.push(`unexpected job slugs: ${unexpectedSlugs.join(", ")}`);
  }

  const stageMismatches = pipelineStages.filter(
    (stage) => stageCounts.get(stage) !== expectedApplicationsPerStage,
  );
  const jobVolumeMismatches = expectedJobs.filter(
    (job) => applicationsForSlug.get(job.slug) !== expectedApplicationsPerJob,
  );

  const incompleteRecent = recentRows.filter((row) => {
    return !(
      row.name.trim().length > 0 &&
      row.position.trim().length > 0 &&
      isExampleEmail(row.email) &&
      pipelineStages.includes(row.stage) &&
      row.appliedAt instanceof Date &&
      !Number.isNaN(row.appliedAt.getTime())
    );
  }).length;
  const expectedRecentCount = Math.min(
    recentApplicantLimit,
    applicationCount,
  );

  const checks: Check[] = [
    check(
      "Clean demo has 5 jobs",
      jobCount === expectedJobCount,
      `found ${jobCount}`,
    ),
    check(
      "Clean demo has 300 candidates",
      candidateCount === expectedCandidateCount,
      `found ${candidateCount}`,
    ),
    check(
      "Clean demo has 300 applications",
      applicationCount === expectedApplicationCount,
      `found ${applicationCount}`,
    ),
    check(
      "Demo jobs match slug, title, and status",
      jobMismatches.length === 0,
      jobMismatches.length === 0
        ? "5 demo jobs matched"
        : jobMismatches.join("; "),
    ),
    check(
      "Each stage has 60 applications",
      stageMismatches.length === 0 && stageTotal === applicationCount,
      stageMismatches.length === 0
        ? "stage counts match the seed"
        : stageMismatches
            .map((stage) => `${stage}: ${stageCounts.get(stage) ?? 0}`)
            .join("; "),
    ),
    check(
      "Each demo job has 60 applications",
      jobVolumeMismatches.length === 0,
      jobVolumeMismatches.length === 0
        ? "job volumes match the seed"
        : jobVolumeMismatches
            .map(
              (job) =>
                `${job.slug}: ${applicationsForSlug.get(job.slug) ?? 0}`,
            )
            .join("; "),
    ),
    check(
      "No duplicate candidate emails",
      duplicateEmailGroups === 0,
      `${duplicateEmailGroups} duplicated email groups`,
    ),
    check(
      "No case-insensitive duplicate emails",
      caseInsensitiveEmailGroups === 0,
      `${caseInsensitiveEmailGroups} duplicated email groups`,
    ),
    check(
      "No duplicate candidate/job application pairs",
      duplicatePairGroups === 0,
      `${duplicatePairGroups} duplicated pairs`,
    ),
    check(
      "No applications missing a candidate",
      missingCandidates === 0,
      `${missingCandidates} orphaned candidate references`,
    ),
    check(
      "No applications missing a job",
      missingJobs === 0,
      `${missingJobs} orphaned job references`,
    ),
    check(
      "No notes missing an application",
      orphanNotes === 0,
      `${orphanNotes} orphaned note references`,
    ),
    check(
      "No events missing an application",
      orphanEvents === 0,
      `${orphanEvents} orphaned event references`,
    ),
    check(
      "Candidate emails use example.com",
      nonExampleEmails === 0,
      `${nonExampleEmails} emails outside example.com`,
    ),
    check(
      "Notes and events are empty",
      noteCount === 0 && eventCount === 0,
      `${noteCount} notes, ${eventCount} events`,
    ),
    check(
      "Recent applications join to a candidate and a job",
      recentRows.length === expectedRecentCount &&
        expectedRecentCount === recentApplicantLimit &&
        incompleteRecent === 0,
      `${recentRows.length} rows, ${incompleteRecent} missing a name, example.com email, job title, stage, or date`,
    ),
    check(
      "Recent applications are ordered by date, then id",
      recentRowsAreOrdered(recentRows),
      recentRows.length === 0
        ? "no recent rows to order"
        : "appliedAt descending, id descending",
    ),
  ];

  console.log("Screenline database verification");
  console.log("Records");
  console.log(`  jobs: ${jobCount}`);
  console.log(`  candidates: ${candidateCount}`);
  console.log(`  applications: ${applicationCount}`);
  console.log(`  application notes: ${noteCount}`);
  console.log(`  application events: ${eventCount}`);
  console.log("Applications by stage");
  for (const stage of pipelineStages) {
    console.log(`  ${stage}: ${stageCounts.get(stage) ?? 0}`);
  }
  console.log("Checks");
  for (const item of checks) {
    console.log(`  ${item.passed ? "PASS" : "FAIL"}  ${item.label} (${item.detail})`);
  }

  const failed = checks.filter((item) => !item.passed).length;
  if (failed > 0) {
    console.error(`Result: FAIL (${failed} ${failed === 1 ? "check" : "checks"})`);
    process.exit(1);
  }

  console.log("Result: PASS");
}

main().catch((error: unknown) => {
  fail(sanitizeDatabaseError(error));
});
