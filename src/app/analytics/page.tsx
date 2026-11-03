import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Hiring analytics are planned for a later milestone.",
};

export default function AnalyticsPage() {
  return (
    <PlaceholderPage
      heading="Analytics is coming in a later milestone"
      body="Pipeline reporting and hiring metrics are not part of this milestone. This page does not calculate or store analytics."
    />
  );
}
