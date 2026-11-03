import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = {
  title: "Applicants",
  description: "Applicant management is planned for a later milestone.",
};

export default function ApplicantsPage() {
  return (
    <PlaceholderPage
      heading="Applicant management is coming in a later milestone"
      body="Reviewing, filtering, and updating individual applications is not part of this milestone. This page does not load or save applicant records."
    />
  );
}
