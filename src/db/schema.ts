import { jobStatuses, pipelineStages } from "@/lib/demo-data";
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Job and stage values match src/lib/demo-data.ts so the current badges stay valid.
 * "In review" keeps its space. Do not rename these without updating StageBadge.
 */
export const jobStatusEnum = pgEnum("job_status", jobStatuses);
export const applicationStageEnum = pgEnum("application_stage", pipelineStages);

function timestampColumns() {
  return {
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  };
}

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  department: text("department"),
  location: text("location"),
  description: text("description"),
  requiredSkills: text("required_skills").array().notNull().default([]),
  status: jobStatusEnum("status").notNull(),
  ...timestampColumns(),
});

export const candidates = pgTable("candidates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  location: text("location"),
  currentTitle: text("current_title"),
  skills: text("skills").array().notNull().default([]),
  ...timestampColumns(),
});

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "restrict" }),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "restrict" }),
    stage: applicationStageEnum("stage").notNull(),
    appliedAt: timestamp("applied_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("applications_candidate_id_job_id_unique").on(
      table.candidateId,
      table.jobId,
    ),
    index("applications_job_id_idx").on(table.jobId),
    index("applications_candidate_id_idx").on(table.candidateId),
    index("applications_stage_idx").on(table.stage),
    index("applications_applied_at_idx").on(table.appliedAt),
  ],
);

export const applicationNotes = pgTable(
  "application_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    authorName: text("author_name").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("application_notes_application_id_created_at_idx").on(
      table.applicationId,
      table.createdAt,
    ),
  ],
);

export const applicationEvents = pgTable(
  "application_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    fromStage: applicationStageEnum("from_stage"),
    toStage: applicationStageEnum("to_stage").notNull(),
    actorName: text("actor_name"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("application_events_application_id_created_at_idx").on(
      table.applicationId,
      table.createdAt,
    ),
  ],
);

export type Job = typeof jobs.$inferSelect;
export type JobInsert = typeof jobs.$inferInsert;
export type Candidate = typeof candidates.$inferSelect;
export type CandidateInsert = typeof candidates.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type ApplicationInsert = typeof applications.$inferInsert;
export type ApplicationNote = typeof applicationNotes.$inferSelect;
export type ApplicationNoteInsert = typeof applicationNotes.$inferInsert;
export type ApplicationEvent = typeof applicationEvents.$inferSelect;
export type ApplicationEventInsert = typeof applicationEvents.$inferInsert;
