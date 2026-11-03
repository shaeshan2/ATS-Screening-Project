export const pipelineStages = [
  "Applied",
  "Screening",
  "In review",
  "Interview",
  "Shortlisted",
] as const;

export type PipelineStage = (typeof pipelineStages)[number];

export const jobStatuses = ["Active", "Closed"] as const;

export type JobStatus = (typeof jobStatuses)[number];

export type DemoJob = {
  id: string;
  title: string;
  status: JobStatus;
};

export type DemoApplicant = {
  id: string;
  name: string;
  email: string;
  jobId: string;
  appliedOn: string;
  stage: PipelineStage;
};

export type DashboardSummary = {
  totalApplicants: number;
  inReview: number;
  shortlisted: number;
  activeJobs: number;
};

export type ApplicantPreview = {
  id: string;
  name: string;
  email: string;
  position: string;
  appliedOn: string;
  stage: PipelineStage;
};

export const demonstrationNotice =
  "Counts and rows are calculated from fictional sample records bundled with this app. Nothing on this page is saved.";

/**
 * Fictional sample jobs. Active jobs on the overview are those with status "Active".
 */
export const demoJobs = [
  { id: "job_product_designer", title: "Product Designer", status: "Active" },
  { id: "job_backend_engineer", title: "Backend Engineer", status: "Active" },
  { id: "job_frontend_engineer", title: "Frontend Engineer", status: "Active" },
  { id: "job_data_analyst", title: "Data Analyst", status: "Active" },
  {
    id: "job_support_lead",
    title: "Customer Support Lead",
    status: "Closed",
  },
] as const satisfies readonly DemoJob[];

/**
 * Fictional applicants. Names and example.com addresses are invented.
 * Dates are ISO calendar dates so the preview can sort newest first.
 */
export const demoApplicants = [
  {
    id: "app_01",
    name: "Maya Ellison",
    email: "maya.ellison@example.com",
    jobId: "job_product_designer",
    appliedOn: "2026-10-28",
    stage: "In review",
  },
  {
    id: "app_02",
    name: "Jordan Hale",
    email: "jordan.hale@example.com",
    jobId: "job_backend_engineer",
    appliedOn: "2026-10-27",
    stage: "Shortlisted",
  },
  {
    id: "app_03",
    name: "Priya Raman",
    email: "priya.raman@example.com",
    jobId: "job_product_designer",
    appliedOn: "2026-10-26",
    stage: "Applied",
  },
  {
    id: "app_04",
    name: "Ellis Okonkwo",
    email: "ellis.okonkwo@example.com",
    jobId: "job_data_analyst",
    appliedOn: "2026-10-24",
    stage: "In review",
  },
  {
    id: "app_05",
    name: "Samira Qureshi",
    email: "samira.qureshi@example.com",
    jobId: "job_frontend_engineer",
    appliedOn: "2026-10-22",
    stage: "Interview",
  },
  {
    id: "app_06",
    name: "Noah Bennett",
    email: "noah.bennett@example.com",
    jobId: "job_backend_engineer",
    appliedOn: "2026-10-21",
    stage: "Screening",
  },
  {
    id: "app_07",
    name: "Lena Voss",
    email: "lena.voss@example.com",
    jobId: "job_support_lead",
    appliedOn: "2026-10-19",
    stage: "Shortlisted",
  },
  {
    id: "app_08",
    name: "Adrian Cho",
    email: "adrian.cho@example.com",
    jobId: "job_data_analyst",
    appliedOn: "2026-10-18",
    stage: "Shortlisted",
  },
  {
    id: "app_09",
    name: "Harper Quinn",
    email: "harper.quinn@example.com",
    jobId: "job_frontend_engineer",
    appliedOn: "2026-10-16",
    stage: "In review",
  },
  {
    id: "app_10",
    name: "Mateo Alvarez",
    email: "mateo.alvarez@example.com",
    jobId: "job_backend_engineer",
    appliedOn: "2026-10-14",
    stage: "Applied",
  },
  {
    id: "app_11",
    name: "Riley Okada",
    email: "riley.okada@example.com",
    jobId: "job_product_designer",
    appliedOn: "2026-10-11",
    stage: "Screening",
  },
  {
    id: "app_12",
    name: "Camille Dubois",
    email: "camille.dubois@example.com",
    jobId: "job_frontend_engineer",
    appliedOn: "2026-10-08",
    stage: "Interview",
  },
] as const satisfies readonly DemoApplicant[];

const jobsById = new Map(demoJobs.map((job) => [job.id, job]));

export const recentApplicantLimit = 8;

export function getDashboardSummary(): DashboardSummary {
  return {
    totalApplicants: demoApplicants.length,
    inReview: demoApplicants.filter((applicant) => applicant.stage === "In review")
      .length,
    shortlisted: demoApplicants.filter(
      (applicant) => applicant.stage === "Shortlisted",
    ).length,
    activeJobs: demoJobs.filter((job) => job.status === "Active").length,
  };
}

export function getRecentApplicants(
  limit = recentApplicantLimit,
): ApplicantPreview[] {
  return demoApplicants
    .slice()
    .sort((a, b) => b.appliedOn.localeCompare(a.appliedOn))
    .slice(0, limit)
    .map((applicant) => ({
      id: applicant.id,
      name: applicant.name,
      email: applicant.email,
      position: jobsById.get(applicant.jobId)?.title ?? "Unknown role",
      appliedOn: applicant.appliedOn,
      stage: applicant.stage,
    }));
}
