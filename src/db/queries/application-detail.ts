import { db } from "@/db/client";
import {
  applicationEvents,
  applicationNotes,
  applications,
  candidates,
  jobs,
} from "@/db/schema";
import { isApplicationId } from "@/lib/application-id";
import type { PipelineStage } from "@/lib/demo-data";
import { desc, eq } from "drizzle-orm";
import { unstable_rethrow } from "next/navigation";

export type ApplicationDetail = {
  id: string;
  stage: PipelineStage;
  appliedAt: Date;
  updatedAt: Date;
  candidateName: string;
  candidateEmail: string;
  candidateTitle: string | null;
  candidateLocation: string | null;
  candidateSkills: string[];
  jobTitle: string;
  jobDepartment: string | null;
  jobLocation: string | null;
  jobDescription: string | null;
  jobRequiredSkills: string[];
};

export type ApplicationNoteItem = {
  id: string;
  authorName: string;
  body: string;
  createdAt: Date;
};

export type ApplicationEventItem = {
  id: string;
  fromStage: PipelineStage | null;
  toStage: PipelineStage;
  actorName: string | null;
  createdAt: Date;
};

function isPrerenderSignal(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const record = error as {
    name?: unknown;
    digest?: unknown;
    message?: unknown;
    cause?: unknown;
  };
  if (record.name === "AbortError") return true;
  if (typeof record.digest === "string") return true;
  if (
    typeof record.message === "string" &&
    record.message.includes("During prerendering")
  ) {
    return true;
  }
  return isPrerenderSignal(record.cause);
}

function databaseError(error: unknown): Error {
  unstable_rethrow(error);
  if (isPrerenderSignal(error)) throw error;

  const raw = error instanceof Error ? error.message : "";
  const sanitized = raw
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted]")
    .replace(/\b[\w.-]+\.neon\.tech\b\S*/gi, "[redacted-host]");

  if (
    sanitized.includes("://") ||
    sanitized.includes("@") ||
    /password|DATABASE_URL/i.test(sanitized)
  ) {
    console.error("Application detail query failed. Connection details were omitted.");
  } else if (sanitized.trim().length > 0) {
    console.error(`Application detail query failed: ${sanitized.trim()}`);
  } else {
    console.error("Application detail query failed.");
  }

  return new Error("The application could not be loaded.");
}

export async function getApplicationDetail(
  applicationId: string,
): Promise<ApplicationDetail | null> {
  if (!isApplicationId(applicationId)) return null;

  try {
    const rows = await db
      .select({
        id: applications.id,
        stage: applications.stage,
        appliedAt: applications.appliedAt,
        updatedAt: applications.updatedAt,
        candidateName: candidates.name,
        candidateEmail: candidates.email,
        candidateTitle: candidates.currentTitle,
        candidateLocation: candidates.location,
        candidateSkills: candidates.skills,
        jobTitle: jobs.title,
        jobDepartment: jobs.department,
        jobLocation: jobs.location,
        jobDescription: jobs.description,
        jobRequiredSkills: jobs.requiredSkills,
      })
      .from(applications)
      .innerJoin(candidates, eq(applications.candidateId, candidates.id))
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(eq(applications.id, applicationId))
      .limit(1);

    return rows[0] ?? null;
  } catch (error) {
    throw databaseError(error);
  }
}

export async function getApplicationNotes(
  applicationId: string,
): Promise<ApplicationNoteItem[]> {
  if (!isApplicationId(applicationId)) return [];

  try {
    return await db
      .select({
        id: applicationNotes.id,
        authorName: applicationNotes.authorName,
        body: applicationNotes.body,
        createdAt: applicationNotes.createdAt,
      })
      .from(applicationNotes)
      .where(eq(applicationNotes.applicationId, applicationId))
      .orderBy(desc(applicationNotes.createdAt), desc(applicationNotes.id));
  } catch (error) {
    throw databaseError(error);
  }
}

export async function getApplicationEvents(
  applicationId: string,
): Promise<ApplicationEventItem[]> {
  if (!isApplicationId(applicationId)) return [];

  try {
    return await db
      .select({
        id: applicationEvents.id,
        fromStage: applicationEvents.fromStage,
        toStage: applicationEvents.toStage,
        actorName: applicationEvents.actorName,
        createdAt: applicationEvents.createdAt,
      })
      .from(applicationEvents)
      .where(eq(applicationEvents.applicationId, applicationId))
      .orderBy(desc(applicationEvents.createdAt), desc(applicationEvents.id));
  } catch (error) {
    throw databaseError(error);
  }
}
