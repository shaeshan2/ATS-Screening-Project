# Screenline

Screenline is an applicant tracking workspace for one recruiter who needs to see a large inbound pipeline without losing track of stage, role, or the next human decision.

The target user is an in-house recruiter or recruiting coordinator handling hundreds of applications across a handful of jobs. Applications arrive faster than they can be compared in a spreadsheet. Stage, role, and recency get split across tabs, so it is easy to miss who is waiting in review and who is already shortlisted.

The product brief is in [docs/product-brief.md](docs/product-brief.md). The table design is in [docs/data-model.md](docs/data-model.md).

## Current features

- A responsive workspace shell with Overview, Applicants, Jobs, and Analytics.
- An overview that reads pipeline counts and the eight newest applications from PostgreSQL.
- Counts for all applications, applications in review, shortlisted applications, and active jobs.
- A recent-applications table with candidate, position, date, and stage.
- Fictional demo records stored in PostgreSQL, labeled as demonstration data in the interface.
- An applicant list that searches, filters, sorts, and pages through the stored applications. The list is read from PostgreSQL on the server.
- A read-only application page for each stored application, including the candidate, job, notes, and stage history. The seeded database has no notes or events.
- Placeholder pages for Jobs and Analytics. Those routes do not load or change records.

These are not implemented: authentication, creating or editing records, job management, adding notes or stage history, analytics, CSV import, ranking, and automated stage changes.

## Stack and architecture

- Next.js 16 App Router, React 19, and TypeScript in strict mode.
- Tailwind CSS and shadcn/ui for the interface.
- PostgreSQL on Neon, accessed with Drizzle ORM and the Neon HTTP driver.
- Cache Components and partial prefetching stay enabled. The overview is a partial prerender: the shell and demonstration notice are static, and the database reads run on the server inside `<Suspense>` so the counts are not frozen at build time.

Runtime requests use the pooled `DATABASE_URL` from `src/db/client.ts`. That module is imported only by server code and command-line scripts. The browser does not receive a database connection. Dashboard reads live in `src/db/queries/dashboard.ts`. Migrations use the direct `DATABASE_URL_UNPOOLED` connection through `drizzle.config.ts`.

| Piece | Location |
| --- | --- |
| Schema | `src/db/schema.ts` |
| Migration | `drizzle/0000_kind_bill_hollister.sql` |
| Seed | `scripts/seed.ts` |
| Connection check | `scripts/db-check.ts` |
| Data verification | `scripts/db-verify.ts` |
| Overview page | `src/app/page.tsx` |
| Applicant list | `src/app/applicants/page.tsx` |
| Applicant queries | `src/db/queries/applicants.ts` |
| Application detail | `src/app/applicants/[id]/page.tsx` |

## Local installation

Use Node.js and npm.

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`, then apply the schema and load the demo records:

```bash
npm run db:migrate
npm run db:seed
npm run db:verify
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `.env.example` to `.env.local`. Leave the real values out of git. `.env.local` is ignored.

```bash
DATABASE_URL=""
DATABASE_URL_UNPOOLED=""
```

- `DATABASE_URL` is the pooled Neon connection. The Next.js server, `npm run db:check`, `npm run db:seed`, and `npm run db:verify` use it.
- `DATABASE_URL_UNPOOLED` is the direct Neon connection. `npm run db:generate` and `npm run db:migrate` use it.

Neither variable is prefixed with `NEXT_PUBLIC_`. Do not put credentials in source, issues, or documentation.

## Database setup

`npm run db:generate` writes a new SQL migration from `src/db/schema.ts` into `./drizzle`. The current schema already has a migration, so a fresh checkout only needs `npm run db:migrate`.

`npm run db:migrate` applies the SQL in `./drizzle` with the unpooled connection.

`npm run db:seed` inserts the fictional demo set. On an empty database it inserts 5 jobs, 300 candidates, and 300 applications. It does not insert notes or events. Running it again inserts only rows that are still missing. It does not truncate, delete, or overwrite existing names, stages, or dates.

## Verification

```bash
npm run db:check
npm run db:verify
npm run lint
npx tsc --noEmit
npm run build
```

- `db:check` runs `SELECT 1` and prints whether the pooled connection works. It does not print the connection string.
- `db:verify` is read-only. It prints table counts, the application count for each stage, and a pass/fail line for each check. It expects the clean demo: 5 jobs, 300 candidates, 300 applications, 60 applications per stage, 60 applications per demo job, unique emails, unique candidate/job pairs, no orphaned foreign keys, `@example.com` addresses, empty notes and events, and 8 recent rows joined to a candidate and a job. It does not print names, email addresses, or credentials. If the database has extra rows, the counts are reported and the clean-demo checks fail. Nothing is deleted.

## Design decisions and tradeoffs

- The overview counts application rows. In the clean seed each candidate has one application, so the applicant count and the application count match. A later model where one person applies to several jobs would make those numbers diverge.
- Stage and status strings come from `src/lib/demo-data.ts` and are stored as PostgreSQL enums. The badges and the database use the same spellings, including `In review`.
- A candidate email is unique. A candidate can be stored once per job through the unique `(candidate_id, job_id)` constraint. The seed currently creates one application per candidate.
- Deleting a candidate or a job is restricted while an application still points at it. Deleting an application would cascade to its notes and events. The app does not expose delete actions.
- `updated_at` changes when Drizzle updates a row. There is no database trigger, so a raw SQL update does not move `updated_at` unless the statement sets it.
- Skills are text arrays. A separate skills table can wait until skills are searched or ranked.
- The Neon HTTP driver does not run multi-statement transactions. The seed plans the full set first, then inserts missing rows in batches with conflict-safe inserts. A failed batch can leave a partial set; running the seed again finishes the missing rows without changing rows already stored.
- Dashboard queries are not wrapped in `"use cache"`. During static generation Next.js aborts the in-flight read, the prerender signal is rethrown, and the loading state stays in the static shell. A request then reads the current database. A failed request shows a fixed error and does not fall back to the old sample arrays.
- The server client is not bound to the Drizzle schema object. Query modules import the tables they need. Migrations stay in `./drizzle` and are not edited by the seed.

## Demo workspace assumptions

- There is one fictional workspace and no signed-in user.
- Every person is invented. Email addresses use `@example.com`.
- The five jobs are Product Designer, Backend Engineer, Frontend Engineer, and Data Analyst, all Active, plus Customer Support Lead, which is Closed.
- The seed keeps the original 12 demonstration applicants and adds 288 generated people with Faker seed `20260701`.
- Generated application dates fall from 1 July 2026 through 1 November 2026. The original 12 dates are in October 2026.
- Applications are spread evenly: 60 for each job and 60 for each stage (`Applied`, `Screening`, `In review`, `Interview`, `Shortlisted`).
- Notes and events exist in the schema and are empty.
- Ranking, if it is added later, may use job-relevant signals such as skills and role match. It must not use protected demographic attributes, and a recruiter must be able to see why a suggestion was made.
- The recruiter remains the decision maker. The product does not advance, reject, or contact a candidate on its own.

## Limitations and later milestones

- Jobs and Analytics are labeled placeholders.
- Application detail pages are read-only. There is no way to create, edit, or delete an application, note, or job.
- There is no authentication, organization model, CSV or resume import, or analytics beyond the four overview counts.
- Notes, stage history, scheduling, email, and offers are not collected or shown.
- The seed will not repair a row that was edited after insert, and it will not remove rows it did not create.
- `npm run db:verify` describes the clean seeded database. It is not a migration tool.

## How AI tools were used

Cursor’s coding agent implemented the milestones from written prompts: the workspace shell, the Drizzle schema and migration setup, the fictional seed, the overview queries, and this verification script. Generated code was read against the milestone instructions and `AGENTS.md` before it was kept.

The checks used on the resulting code were `npm run db:check`, two runs of `npm run db:seed` to confirm the second run did not add rows, `npm run db:verify`, `npm run lint`, `npx tsc --noEmit`, and `npm run build`. The overview was also opened in a browser against a production build to confirm the streamed counts, the recent rows, the placeholder routes, and that the page did not contain a connection string. Credentials stayed in `.env.local` and were not printed by the scripts or the interface.
