import { describe, expect, it } from "vitest";
import {
  applicantListHref,
  defaultApplicantFilters,
  escapeLikePattern,
  maxApplicantPage,
  maxSearchLength,
  parseApplicantFilters,
} from "./applicant-filters";

describe("parseApplicantFilters", () => {
  it("uses safe defaults when parameters are missing", () => {
    expect(parseApplicantFilters(undefined)).toEqual(defaultApplicantFilters);
    expect(parseApplicantFilters({})).toEqual(defaultApplicantFilters);
    expect(parseApplicantFilters(new URLSearchParams())).toEqual(
      defaultApplicantFilters,
    );
  });

  it("falls back when the stage is not one of the five pipeline stages", () => {
    expect(parseApplicantFilters({ stage: "Hired" }).stage).toBe("all");
    expect(parseApplicantFilters({ stage: "applied_at desc" }).stage).toBe(
      "all",
    );
    expect(parseApplicantFilters({ stage: "In review" }).stage).toBe(
      "In review",
    );
  });

  it("falls back when the sort is not on the allowlist", () => {
    expect(parseApplicantFilters({ sort: "email desc" }).sort).toBe("newest");
    expect(parseApplicantFilters({ sort: "applied_at" }).sort).toBe("newest");
    expect(parseApplicantFilters({ sort: "name_asc" }).sort).toBe("name_asc");
  });

  it("falls back when the page number is negative or zero", () => {
    expect(parseApplicantFilters({ page: "-4" }).page).toBe(1);
    expect(parseApplicantFilters({ page: -2 }).page).toBe(1);
    expect(parseApplicantFilters({ page: "0" }).page).toBe(1);
  });

  it("falls back when the page number is excessively large", () => {
    expect(parseApplicantFilters({ page: "999999999999999999" }).page).toBe(1);
    expect(parseApplicantFilters({ page: String(maxApplicantPage + 1) }).page).toBe(
      1,
    );
    expect(parseApplicantFilters({ page: "12" }).page).toBe(12);
  });

  it("treats an empty search as no search", () => {
    expect(parseApplicantFilters({ q: "" }).q).toBe("");
    expect(parseApplicantFilters({ q: "   " }).q).toBe("");
  });

  it("trims surrounding whitespace from the search", () => {
    expect(parseApplicantFilters({ q: "  Maya Ellison  " }).q).toBe(
      "Maya Ellison",
    );
  });

  it("limits the search to 80 characters", () => {
    const parsed = parseApplicantFilters({ q: `  ${"a".repeat(90)}  ` });
    expect(parsed.q).toHaveLength(maxSearchLength);
    expect(parsed.q).toBe("a".repeat(maxSearchLength));
  });

  it("keeps percent and underscore as literal search characters", () => {
    const query = "100%_match!";
    expect(parseApplicantFilters({ q: `  ${query}  ` }).q).toBe(query);
    expect(escapeLikePattern(query)).toBe("100!%!_match!!");
    expect(escapeLikePattern("%_%")).toBe("!%!_!%");
  });
});

describe("applicantListHref", () => {
  it("omits default parameters", () => {
    expect(applicantListHref(defaultApplicantFilters)).toBe("/applicants");
  });

  it("keeps search, job, stage, and sort, and drops page 1", () => {
    expect(
      applicantListHref({
        q: "Maya",
        stage: "In review",
        job: "backend-engineer",
        sort: "name_asc",
        page: 1,
      }),
    ).toBe(
      "/applicants?q=Maya&stage=In+review&job=backend-engineer&sort=name_asc",
    );
  });

  it("preserves the active filters when moving to another page", () => {
    expect(
      applicantListHref({
        q: "Maya",
        stage: "In review",
        job: "backend-engineer",
        sort: "oldest",
        page: 2,
      }),
    ).toBe(
      "/applicants?q=Maya&stage=In+review&job=backend-engineer&sort=oldest&page=2",
    );
  });
});
