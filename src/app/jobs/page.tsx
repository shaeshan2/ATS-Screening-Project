import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = {
  title: "Jobs",
  description: "Job management is planned for a later milestone.",
};

export default function JobsPage() {
  return (
    <PlaceholderPage
      heading="Job management is coming in a later milestone"
      body="Creating and maintaining job openings is not part of this milestone. This page does not load or save jobs."
    />
  );
}
