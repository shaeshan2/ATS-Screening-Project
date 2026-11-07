import { pipelineStages, type PipelineStage } from "@/lib/demo-data";
import * as z from "zod";

/**
 * URL filters for the applicant list. Values are normalized here so query
 * code never receives arbitrary column names or SQL fragments.
 */
export const applicantPageSize = 25;
export const maxSearchLength = 80;
export const maxJobSlugLength = 80;
/** Pages above this are treated as invalid and fall back to page 1. */
export const maxApplicantPage = 10_000;

export const applicantSorts = [
  "newest",
  "oldest",
  "name_asc",
  "name_desc",
] as const;

export type ApplicantSort = (typeof applicantSorts)[number];
export type ApplicantStageFilter = PipelineStage | "all";

export type ApplicantFilters = {
  q: string;
  stage: ApplicantStageFilter;
  job: string;
  sort: ApplicantSort;
  page: number;
};

export const defaultApplicantFilters: ApplicantFilters = {
  q: "",
  stage: "all",
  job: "all",
  sort: "newest",
  page: 1,
};

const stageFilters = ["all", ...pipelineStages] as [
  "all",
  ...typeof pipelineStages,
];

const jobSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const likeEscape = "!";

/**
 * Escapes LIKE/ILIKE wildcards so a typed % or _ matches that character.
 * The query must use the same escape character: ESCAPE '!'.
 */
export function escapeLikePattern(value: string): string {
  return value
    .replaceAll(likeEscape, `${likeEscape}${likeEscape}`)
    .replaceAll("%", `${likeEscape}%`)
    .replaceAll("_", `${likeEscape}_`);
}

function textValue(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (Array.isArray(value)) {
    const first = value.find((item): item is string => typeof item === "string");
    return first;
  }
  return undefined;
}

function toFilterRecord(input: unknown): Record<string, unknown> {
  if (input instanceof URLSearchParams) {
    return {
      q: input.get("q") ?? undefined,
      stage: input.get("stage") ?? undefined,
      job: input.get("job") ?? undefined,
      sort: input.get("sort") ?? undefined,
      page: input.get("page") ?? undefined,
    };
  }

  if (!input || typeof input !== "object") return {};

  const record = input as Record<string, unknown>;
  return {
    q: record.q,
    stage: record.stage,
    job: record.job,
    sort: record.sort,
    page: record.page,
  };
}

const querySchema = z.preprocess(
  (value) => textValue(value) ?? "",
  z
    .string()
    .trim()
    .transform((value) => value.slice(0, maxSearchLength)),
);

const stageSchema = z.preprocess((value): ApplicantStageFilter => {
  const text = textValue(value)?.trim().toLowerCase();
  if (!text || text === "all") return "all";
  const match = pipelineStages.find((stage) => stage.toLowerCase() === text);
  return match ?? "all";
}, z.enum(stageFilters));

const jobSchema = z.preprocess((value): string => {
  const text = textValue(value)?.trim().toLowerCase() ?? "";
  if (text.length === 0 || text === "all") return "all";
  if (text.length > maxJobSlugLength || !jobSlugPattern.test(text)) return "all";
  return text;
}, z.string().regex(/^(?:all|[a-z0-9]+(?:-[a-z0-9]+)*)$/));

const sortSchema = z.preprocess((value): ApplicantSort => {
  const text = textValue(value)?.trim() ?? "";
  const match = applicantSorts.find((sort) => sort === text);
  return match ?? "newest";
}, z.enum(applicantSorts));

const pageSchema = z.preprocess((value): number => {
  const text = textValue(value)?.trim() ?? "";
  if (!/^[0-9]+$/.test(text)) return 1;
  const page = Number(text);
  if (!Number.isSafeInteger(page) || page < 1 || page > maxApplicantPage) {
    return 1;
  }
  return page;
}, z.number().int().min(1).max(maxApplicantPage));

const applicantFilterSchema = z.object({
  q: querySchema,
  stage: stageSchema,
  job: jobSchema,
  sort: sortSchema,
  page: pageSchema,
});

export function parseApplicantFilters(input: unknown): ApplicantFilters {
  const parsed = applicantFilterSchema.safeParse(toFilterRecord(input));
  if (!parsed.success) return { ...defaultApplicantFilters };
  return parsed.data;
}

/** Shareable applicant-list URL. Default values are omitted, including page 1. */
export function applicantListHref(filters: ApplicantFilters): string {
  const params = new URLSearchParams();
  if (filters.q.length > 0) params.set("q", filters.q);
  if (filters.stage !== "all") params.set("stage", filters.stage);
  if (filters.job !== "all") params.set("job", filters.job);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));
  const query = params.toString();
  return query.length > 0 ? `/applicants?${query}` : "/applicants";
}
