# Screenline data model

This document describes the PostgreSQL schema in `src/db/schema.ts`. The tables are defined with Drizzle ORM. `npm run db:seed` inserts fictional jobs, candidates, and applications. It does not insert notes or events. The overview reads these tables through `src/db/queries/dashboard.ts`. An application detail page reads one application with its candidate, job, notes, and events. The seed leaves notes and events empty. `src/lib/demo-data.ts` still supplies the seed records and the stage labels.

## Tables

### jobs

An opening a recruiter is hiring for.

| Column | Type | Rules |
| --- | --- | --- |
| id | uuid | Primary key. Defaults to `gen_random_uuid()`. |
| slug | text | Required and unique. Stable key for a job URL. |
| title | text | Required. |
| department | text | Optional. |
| location | text | Optional. |
| description | text | Optional. |
| required_skills | text[] | Required. Defaults to an empty array. |
| status | job_status | Required. Exactly `Active` or `Closed`. |
| created_at | timestamptz | Required. Defaults to the current time. |
| updated_at | timestamptz | Required. Defaults to the current time. |

### candidates

A person who can apply to one or more jobs. Email identifies one candidate row.

| Column | Type | Rules |
| --- | --- | --- |
| id | uuid | Primary key. Defaults to `gen_random_uuid()`. |
| name | text | Required. |
| email | text | Required and unique. |
| location | text | Optional. |
| current_title | text | Optional. |
| skills | text[] | Required. Defaults to an empty array. |
| created_at | timestamptz | Required. Defaults to the current time. |
| updated_at | timestamptz | Required. Defaults to the current time. |

### applications

One candidate's application to one job. This is the pipeline record the overview counts.

| Column | Type | Rules |
| --- | --- | --- |
| id | uuid | Primary key. Defaults to `gen_random_uuid()`. |
| candidate_id | uuid | Required. References `candidates.id`. |
| job_id | uuid | Required. References `jobs.id`. |
| stage | application_stage | Required. |
| applied_at | timestamptz | Required. Defaults to the current time and can be set explicitly. |
| updated_at | timestamptz | Required. Defaults to the current time. |

`application_stage` is exactly `Applied`, `Screening`, `In review`, `Interview`, or `Shortlisted`. The space in `In review` matches `StageBadge`.

### application_notes

A recruiter note attached to one application. Notes do not change the stage.

| Column | Type | Rules |
| --- | --- | --- |
| id | uuid | Primary key. Defaults to `gen_random_uuid()`. |
| application_id | uuid | Required. References `applications.id`. |
| author_name | text | Required. |
| body | text | Required. |
| created_at | timestamptz | Required. Defaults to the current time. |

### application_events

An append-only record of a stage change. The first event for an application can leave `from_stage` empty.

| Column | Type | Rules |
| --- | --- | --- |
| id | uuid | Primary key. Defaults to `gen_random_uuid()`. |
| application_id | uuid | Required. References `applications.id`. |
| from_stage | application_stage | Optional. |
| to_stage | application_stage | Required. |
| actor_name | text | Optional. The recruiter who recorded the change. |
| created_at | timestamptz | Required. Defaults to the current time. |

## Relationships

```text
candidates 1───* applications *───1 jobs
applications 1───* application_notes
applications 1───* application_events
```

A candidate and a job can each have many applications. A candidate can apply to a job only once. Notes and events belong to a single application.

## Constraints and indexes

- `jobs.slug` and `candidates.email` are unique.
- `applications` has a unique constraint on `(candidate_id, job_id)`.
- `applications` is indexed on `job_id`, `candidate_id`, `stage`, and `applied_at`. Those support the overview counts and the recent-applications sort.
- `application_notes` and `application_events` are indexed on `(application_id, created_at)` so a timeline for one application can be read in order.
- Deleting a candidate or a job is restricted while an application still references it. Applications are not removed as a side effect of deleting a person or an opening.
- Deleting an application deletes its notes and events.

## Decisions

- Status and stage strings are the arrays already exported from `src/lib/demo-data.ts`. The schema does not invent a second spelling.
- Timestamps are `timestamptz` and map to JavaScript `Date`. That keeps Neon, the app server, and later seeds on one clock.
- `updated_at` is refreshed by Drizzle when a row is updated through the ORM (`$onUpdate`). There is no database trigger. A raw SQL update will not move `updated_at` unless the statement sets it.
- Skills stay as text arrays. A separate skills table is not needed until skills are shared, searched, or ranked.
- `actor_name` is stored as text. There is no users or authentication table in this iteration.
- The runtime client in `src/db/client.ts` still uses the pooled `DATABASE_URL` and is not bound to this schema yet. `drizzle.config.ts` uses `DATABASE_URL_UNPOOLED` for `db:generate` and `db:migrate`. Migration SQL is written to `./drizzle`. The seed script does not change those files.
- The schema does not store protected demographic attributes, scores, or an automated rank.
