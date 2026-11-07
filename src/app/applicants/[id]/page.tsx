import type { Metadata } from "next";
import { Suspense } from "react";
import { ApplicationDetail } from "@/components/application-detail";
import { ApplicationDetailErrorBoundary } from "@/components/application-detail-error";
import { ApplicationDetailLoading } from "@/components/application-detail-loading";

export const metadata: Metadata = {
  title: "Application",
  description:
    "Read-only application detail from the demo PostgreSQL database.",
};

export default function ApplicationDetailPage(
  props: PageProps<"/applicants/[id]">,
) {
  return (
    <ApplicationDetailErrorBoundary>
      <Suspense fallback={<ApplicationDetailLoading />}>
        <ApplicationDetail params={props.params} />
      </Suspense>
    </ApplicationDetailErrorBoundary>
  );
}
