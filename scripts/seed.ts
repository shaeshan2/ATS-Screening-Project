import { faker } from "@faker-js/faker";
import { count, eq, inArray } from "drizzle-orm";
import { config } from "dotenv";
import { demoApplicants, demoJobs, pipelineStages } from "../src/lib/demo-data";
import {
  applications,
  candidates,
  jobs,
  type ApplicationInsert,
  type CandidateInsert,
  type JobInsert,
} from "../src/db/schema";
import type { JobStatus, PipelineStage } from "../src/lib/demo-data";

const fakerSeed = 20260701;
const generatedCandidateCount = 288;
const applicationsPerJob = 60;
const applicationsPerStage = 60;
const insertBatchSize = 50;
const windowStart = Date.parse("2026-07-01T00:00:00.000Z");
const windowEnd = Date.parse("2026-11-01T23:59:59.999Z");

type DemoJobId = (typeof demoJobs)[number]["id"];

type JobProfile = {
  slug: string;
  department: string;
  location: string;
  description: string;
  requiredSkills: readonly string[];
  titles: readonly string[];
};

const jobProfiles = {
  job_product_designer: {
    slug: "product-designer",
    department: "Design",
    location: "Remote",
    description:
      "Shape product flows, interface patterns, and design critiques for the hiring workspace.",
    requiredSkills: [
      "Figma",
      "user research",
      "prototyping",
      "design systems",
      "accessibility",
    ],
    titles: ["Product Designer", "UX Designer", "Interaction Designer"],
  },
  job_backend_engineer: {
    slug: "backend-engineer",
    department: "Engineering",
    location: "Chicago, IL",
    description:
      "Build and maintain the services that store applications, jobs, and recruiter activity.",
    requiredSkills: [
      "TypeScript",
      "Node.js",
      "PostgreSQL",
      "Python",
      "SQL",
      "API design",
    ],
    titles: ["Backend Engineer", "Software Engineer", "API Engineer"],
  },
  job_frontend_engineer: {
    slug: "frontend-engineer",
    department: "Engineering",
    location: "Remote",
    description:
      "Build the recruiter workspace for reviewing applications and pipeline stages.",
    requiredSkills: [
      "TypeScript",
      "React",
      "CSS",
      "accessibility",
      "testing",
      "Node.js",
    ],
    titles: ["Frontend Engineer", "UI Engineer", "Web Engineer"],
  },
  job_data_analyst: {
    slug: "data-analyst",
    department: "Analytics",
    location: "Austin, TX",
    description:
      "Analyze hiring-funnel data and explain pipeline counts to the recruiting team.",
    requiredSkills: [
      "SQL",
      "Python",
      "PostgreSQL",
      "statistics",
      "data visualization",
    ],
    titles: ["Data Analyst", "Analytics Associate", "Reporting Analyst"],
  },
  job_support_lead: {
    slug: "customer-support-lead",
    department: "Support",
    location: "Denver, CO",
    description:
      "Lead the support queue, coach specialists, and keep customer issues moving.",
    requiredSkills: [
      "customer support",
      "incident triage",
      "written communication",
      "coaching",
      "SQL",
    ],
    titles: ["Support Lead", "Customer Support Specialist", "Support Coach"],
  },
} as const satisfies Record<DemoJobId, JobProfile>;

type PlannedCandidate = {
  name: string;
  email: string;
  location: string;
  currentTitle: string;
  skills: string[];
  slug: string;
  stage: PipelineStage;
  appliedAt: Date;
};

function fail(message: string): never {
  console.error(`Database seed failed: ${message}`);
  process.exit(1);
}

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

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: readonly T[], seed: number): T[] {
  const copy = [...items];
  const random = mulberry32(seed);
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = copy[index];
    const swapped = copy[swapIndex];
    if (current === undefined || swapped === undefined) {
      throw new Error("Seed shuffle failed.");
    }
    copy[index] = swapped;
    copy[swapIndex] = current;
  }
  return copy;
}

function roundRobin<T extends string>(
  quotas: ReadonlyMap<T, number>,
  total: number,
): T[] {
  const keys = [...quotas.keys()];
  const remaining = new Map(quotas);
  const result: T[] = [];

  while (result.length < total) {
    let progressed = false;
    for (const key of keys) {
      const left = remaining.get(key) ?? 0;
      if (left <= 0) {
        continue;
      }
      result.push(key);
      remaining.set(key, left - 1);
      progressed = true;
      if (result.length === total) {
        break;
      }
    }
    if (!progressed) {
      break;
    }
  }

  return result;
}

function chunks<T>(items: readonly T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

function utcNoon(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00.000Z`);
}

function profileForDemoJob(demoJobId: string): JobProfile & { demoId: DemoJobId } {
  if (!isDemoJobId(demoJobId)) {
    throw new Error("A demo applicant references an unknown job.");
  }
  return { demoId: demoJobId, ...jobProfiles[demoJobId] };
}

function isDemoJobId(value: string): value is DemoJobId {
  return Object.prototype.hasOwnProperty.call(jobProfiles, value);
}

function buildSeedPlan(): {
  jobs: (JobProfile & {
    title: string;
    status: JobStatus;
  })[];
  candidates: PlannedCandidate[];
} {
  const plannedJobs = demoJobs.map((job) => {
    const profile = profileForDemoJob(job.id);
    return {
      ...profile,
      title: job.title,
      status: job.status,
    };
  });

  const slugByDemoId = new Map(
    plannedJobs.map((job) => [job.demoId, job.slug] as const),
  );
  const profileBySlug = new Map(plannedJobs.map((job) => [job.slug, job] as const));

  const demoCandidates: PlannedCandidate[] = demoApplicants.map((applicant) => {
    const slug = slugByDemoId.get(applicant.jobId);
    const profile = slug ? profileBySlug.get(slug) : undefined;
    if (!slug || !profile) {
      throw new Error("A demo applicant references an unknown job.");
    }
    if (!applicant.email.endsWith("@example.com")) {
      throw new Error("A demo applicant email is not on example.com.");
    }
    return {
      name: applicant.name,
      email: applicant.email,
      location: profile.location,
      currentTitle: profile.titles[0] ?? applicant.name,
      skills: [...profile.requiredSkills.slice(0, 4)],
      slug,
      stage: applicant.stage,
      appliedAt: utcNoon(applicant.appliedOn),
    };
  });

  const jobQuotas = new Map(plannedJobs.map((job) => [job.slug, applicationsPerJob]));
  const stageQuotas = new Map(
    pipelineStages.map((stage) => [stage, applicationsPerStage]),
  );

  for (const candidate of demoCandidates) {
    jobQuotas.set(candidate.slug, (jobQuotas.get(candidate.slug) ?? 0) - 1);
    stageQuotas.set(candidate.stage, (stageQuotas.get(candidate.stage) ?? 0) - 1);
  }

  const jobSlots = roundRobin(jobQuotas, generatedCandidateCount);
  const stageSlots = shuffle(
    roundRobin(stageQuotas, generatedCandidateCount),
    fakerSeed,
  );

  if (
    jobSlots.length !== generatedCandidateCount ||
    stageSlots.length !== generatedCandidateCount
  ) {
    throw new Error("Generated application quotas do not add up to 288.");
  }

  faker.seed(fakerSeed);
  const generatedCandidates: PlannedCandidate[] = jobSlots.map((slug, index) => {
    const profile = profileBySlug.get(slug);
    const stage = stageSlots[index];
    if (!profile || !stage) {
      throw new Error("Generated candidate is missing a job or stage.");
    }

    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const appliedAt = faker.date.between({
      from: new Date(windowStart),
      to: new Date(windowEnd),
    });
    const email = `seed.candidate.${String(index + 1).padStart(4, "0")}@example.com`;

    if (!email.endsWith("@example.com") || appliedAt.getTime() < windowStart || appliedAt.getTime() > windowEnd) {
      throw new Error("Generated candidate data fell outside the seed rules.");
    }

    return {
      name: `${firstName} ${lastName}`,
      email,
      location: faker.location.city(),
      currentTitle: faker.helpers.arrayElement([...profile.titles]),
      skills: faker.helpers.arrayElements([...profile.requiredSkills], 3),
      slug,
      stage,
      appliedAt,
    };
  });

  const candidates = [...demoCandidates, ...generatedCandidates];
  const emails = new Set<string>();
  const pairs = new Set<string>();
  const jobCounts = new Map<string, number>();
  const stageCounts = new Map<PipelineStage, number>();

  for (const candidate of candidates) {
    if (emails.has(candidate.email)) {
      throw new Error("Seed plan produced a duplicate email address.");
    }
    emails.add(candidate.email);
    const pair = `${candidate.email}|${candidate.slug}`;
    if (pairs.has(pair)) {
      throw new Error("Seed plan produced a duplicate application.");
    }
    pairs.add(pair);
    jobCounts.set(candidate.slug, (jobCounts.get(candidate.slug) ?? 0) + 1);
    stageCounts.set(candidate.stage, (stageCounts.get(candidate.stage) ?? 0) + 1);
  }

  if (candidates.length !== demoApplicants.length + generatedCandidateCount) {
    throw new Error("Seed plan does not contain 300 candidates.");
  }

  for (const job of plannedJobs) {
    if (jobCounts.get(job.slug) !== applicationsPerJob) {
      throw new Error("Seed plan does not distribute applications across every job.");
    }
  }

  for (const stage of pipelineStages) {
    if (stageCounts.get(stage) !== applicationsPerStage) {
      throw new Error("Seed plan does not distribute applications across every stage.");
    }
  }

  return { jobs: plannedJobs, candidates };
}

async function insertMissing<T>(
  rows: readonly T[],
  insertBatch: (batch: T[]) => Promise<void>,
): Promise<number> {
  if (rows.length === 0) {
    return 0;
  }

  for (const batch of chunks(rows, insertBatchSize)) {
    await insertBatch(batch);
  }

  return rows.length;
}

function asCount(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error("Database count query returned an unexpected value.");
  }
  return parsed;
}

async function main(): Promise<void> {
  const loaded = config({ path: ".env.local", quiet: true });
  if (loaded.error && !process.env.DATABASE_URL?.trim()) {
    fail(".env.local could not be loaded and DATABASE_URL is not set.");
  }

  const plan = buildSeedPlan();
  const { db } = await import("../src/db/client");
  const slugs = plan.jobs.map((job) => job.slug);
  const emails = plan.candidates.map((candidate) => candidate.email);

  const existingJobs = await db
    .select({ id: jobs.id, slug: jobs.slug })
    .from(jobs)
    .where(inArray(jobs.slug, slugs));
  const existingJobSlugs = new Set(existingJobs.map((job) => job.slug));
  const missingJobs: JobInsert[] = plan.jobs
    .filter((job) => !existingJobSlugs.has(job.slug))
    .map((job) => ({
      slug: job.slug,
      title: job.title,
      department: job.department,
      location: job.location,
      description: job.description,
      requiredSkills: [...job.requiredSkills],
      status: job.status,
    }));

  const insertedJobs = await insertMissing(missingJobs, async (batch) => {
    await db.insert(jobs).values(batch).onConflictDoNothing({ target: jobs.slug });
  });

  const storedJobs = await db
    .select({ id: jobs.id, slug: jobs.slug })
    .from(jobs)
    .where(inArray(jobs.slug, slugs));
  const jobIdBySlug = new Map(storedJobs.map((job) => [job.slug, job.id]));
  if (jobIdBySlug.size !== slugs.length) {
    fail("One or more seed jobs could not be found by slug after insert.");
  }

  const existingCandidates = await db
    .select({ id: candidates.id, email: candidates.email })
    .from(candidates)
    .where(inArray(candidates.email, emails));
  const existingEmails = new Set(existingCandidates.map((candidate) => candidate.email));
  const missingCandidates: CandidateInsert[] = plan.candidates
    .filter((candidate) => !existingEmails.has(candidate.email))
    .map((candidate) => ({
      name: candidate.name,
      email: candidate.email,
      location: candidate.location,
      currentTitle: candidate.currentTitle,
      skills: candidate.skills,
    }));

  const insertedCandidates = await insertMissing(
    missingCandidates,
    async (batch) => {
      await db
        .insert(candidates)
        .values(batch)
        .onConflictDoNothing({ target: candidates.email });
    },
  );

  const storedCandidates = await db
    .select({ id: candidates.id, email: candidates.email })
    .from(candidates)
    .where(inArray(candidates.email, emails));
  const candidateIdByEmail = new Map(
    storedCandidates.map((candidate) => [candidate.email, candidate.id]),
  );
  if (candidateIdByEmail.size !== emails.length) {
    fail("One or more seed candidates could not be found by email after insert.");
  }

  const candidateIds = [...candidateIdByEmail.values()];
  const existingApplications = await db
    .select({
      candidateId: applications.candidateId,
      jobId: applications.jobId,
    })
    .from(applications)
    .where(inArray(applications.candidateId, candidateIds));
  const existingPairs = new Set(
    existingApplications.map(
      (application) => `${application.candidateId}|${application.jobId}`,
    ),
  );

  const missingApplications: ApplicationInsert[] = [];
  for (const candidate of plan.candidates) {
    const candidateId = candidateIdByEmail.get(candidate.email);
    const jobId = jobIdBySlug.get(candidate.slug);
    if (!candidateId || !jobId) {
      fail("A seed application is missing its candidate or job.");
    }
    const pair = `${candidateId}|${jobId}`;
    if (existingPairs.has(pair)) {
      continue;
    }
    existingPairs.add(pair);
    missingApplications.push({
      candidateId,
      jobId,
      stage: candidate.stage,
      appliedAt: candidate.appliedAt,
    });
  }

  const insertedApplications = await insertMissing(
    missingApplications,
    async (batch) => {
      await db
        .insert(applications)
        .values(batch)
        .onConflictDoNothing({
          target: [applications.candidateId, applications.jobId],
        });
    },
  );

  const [jobTotal] = await db.select({ value: count() }).from(jobs);
  const [candidateTotal] = await db.select({ value: count() }).from(candidates);
  const [applicationTotal] = await db.select({ value: count() }).from(applications);
  const [seedCandidateTotal] = await db
    .select({ value: count() })
    .from(candidates)
    .where(inArray(candidates.email, emails));
  const [seedApplicationTotal] = await db
    .select({ value: count() })
    .from(applications)
    .innerJoin(candidates, eq(applications.candidateId, candidates.id))
    .where(inArray(candidates.email, emails));
  const stageRows = await db
    .select({ stage: applications.stage, value: count() })
    .from(applications)
    .groupBy(applications.stage);

  const stageTotals = new Map(
    stageRows.map((row) => [row.stage, asCount(row.value)]),
  );
  const jobsTotal = asCount(jobTotal?.value);
  const candidatesTotal = asCount(candidateTotal?.value);
  const applicationsTotal = asCount(applicationTotal?.value);
  const seedCandidatesPresent = asCount(seedCandidateTotal?.value);
  const seedApplicationsPresent = asCount(seedApplicationTotal?.value);
  const hasExtraRows =
    jobsTotal !== slugs.length ||
    candidatesTotal !== emails.length ||
    applicationsTotal !== seedApplicationsPresent;

  console.log(`Inserted jobs: ${insertedJobs}`);
  console.log(`Inserted candidates: ${insertedCandidates}`);
  console.log(`Inserted applications: ${insertedApplications}`);
  console.log(
    `Jobs total: ${jobsTotal} (seed jobs present: ${jobIdBySlug.size})`,
  );
  console.log(
    `Candidates total: ${candidatesTotal} (seed candidates present: ${seedCandidatesPresent})`,
  );
  console.log(
    `Applications total: ${applicationsTotal} (applications for seed candidates: ${seedApplicationsPresent})`,
  );
  console.log("Pipeline stages:");
  for (const stage of pipelineStages) {
    console.log(`  ${stage}: ${stageTotals.get(stage) ?? 0}`);
  }
  console.log("application_notes and application_events were not seeded.");
  if (hasExtraRows) {
    console.log(
      "Totals include records that this seed does not own. Existing rows were not overwritten.",
    );
  }
}

main().catch((error: unknown) => {
  fail(sanitizeDatabaseError(error));
});
