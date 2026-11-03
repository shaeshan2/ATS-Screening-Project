"use client";

import { Badge } from "@/components/ui/badge";
import type { PipelineStage } from "@/lib/demo-data";

const stageClassName: Record<PipelineStage, string> = {
  Applied: "border-slate-200 bg-slate-100 text-slate-700",
  Screening: "border-sky-200 bg-sky-50 text-sky-800",
  "In review": "border-amber-200 bg-amber-50 text-amber-900",
  Interview: "border-indigo-200 bg-indigo-50 text-indigo-800",
  Shortlisted: "border-teal-200 bg-teal-50 text-teal-800",
};

export function StageBadge({ stage }: { stage: PipelineStage }) {
  return (
    <Badge variant="outline" className={stageClassName[stage]}>
      {stage}
    </Badge>
  );
}
