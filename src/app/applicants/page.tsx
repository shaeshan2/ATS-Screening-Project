import type { Metadata } from "next";
import { Suspense } from "react";
import { ApplicantResults } from "@/components/applicant-results";
import { ApplicantsErrorBoundary } from "@/components/applicants-error";
import { ApplicantsLoading } from "@/components/applicants-loading";

export const metadata: Metadata = {
  title: "Applicants",
  description:
    "Search, filter, and review fictional applications stored in the demo database.",
};

export default function ApplicantsPage(props: PageProps<"/applicants">) {
  return (
    <ApplicantsErrorBoundary>
      <Suspense fallback={<ApplicantsLoading />}>
        <ApplicantResults searchParams={props.searchParams} />
      </Suspense>
    </ApplicantsErrorBoundary>
  );
}
