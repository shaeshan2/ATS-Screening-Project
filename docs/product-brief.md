# Screenline product brief

Screenline is an applicant tracking workspace for a recruiter who needs to move through a large inbound pipeline without losing track of stage, role, or the next human decision.

## Target user and primary problem

The target user is an in-house recruiter or recruiting coordinator handling hundreds of applications across a handful of open jobs.

The problem is volume and visibility. Applications arrive faster than they can be compared in a spreadsheet. Stage, role, and recency get split across tabs, so it is easy to miss who is waiting in review and who is already shortlisted. Screenline should give that recruiter one dense, readable workspace: see the pipeline, open a candidate, and decide what happens next.

## Core recruiter workflow

1. Open the workspace and read the current pipeline: how many applications are in the set, how many are in review, how many are shortlisted, and how many jobs are active.
2. Scan recent applications by candidate, position, date, and stage, then move into the full applicant list.
3. Open one application and read the job-relevant evidence for that person.
4. Choose the next pipeline stage. Screenline may later suggest an order, but the recruiter confirms every change.
5. Check the related job so the decision stays tied to an opening, not to a detached list of names.

Milestone 1 covers only the shell and a static overview of step 1, plus a preview of step 2. The overview now reads those counts and recent applications from the demo PostgreSQL database. Applicants, Jobs, and Analytics remain placeholders.

## Prioritized MVP requirements

1. A persistent workspace shell with Overview, Applicants, Jobs, and Analytics, usable on a desktop and still navigable on a phone.
2. An overview of pipeline counts and the newest applications, with every figure traceable to the underlying records.
3. An applicant list that can be scanned quickly and filtered by role and stage, plus a single-applicant view.
4. A job list that shows which openings are active and which applications belong to them.
5. Explainable ordering of candidates. Any rank must state the job-relevant reasons behind it. Protected demographic attributes are not inputs.
6. Durable storage so a recruiter’s updates remain after a refresh.

Items 3 through 6 are later milestones. The workspace shell is in place, and the overview reads pipeline counts and recent applications from PostgreSQL.

## Explicit assumptions

- The first releases serve one recruiter in one workspace. Authentication and multiple organizations are out of scope until the product needs them.
- A pipeline stage is a label the recruiter assigns. It is not an automated hire or reject decision.
- Overview counts mean: all stored applications; applications whose stage is “In review”; applications whose stage is “Shortlisted”; jobs whose status is “Active”.
- People shown in the interface are fictional demonstration records with `@example.com` email addresses. The interface must say so. The overview reads those records from the demo PostgreSQL database.
- Desktop is the primary layout. Narrow screens still need working navigation and a readable table, including horizontal scrolling where a dense table would otherwise collapse.
- Later ranking, if built, may use job-relevant signals such as stated skills, experience, and role match. It must not use protected demographic attributes, and each suggestion must be explainable.
- The recruiter remains the decision maker. The product does not advance, reject, or contact a candidate on its own.

## Planned technology choices

- Next.js App Router and React for the interface.
- TypeScript in strict mode.
- Tailwind CSS for layout and visual styling.
- shadcn/ui for controls such as cards, badges, tables, and buttons.
- PostgreSQL with Drizzle stores the fictional overview records. Creating and updating records is a later phase.

## Features intentionally excluded from the first iteration

- API routes and authentication.
- CSV or resume import.
- Candidate ranking, scoring, or automated stage changes.
- Creating, editing, deleting, or filtering applicants and jobs.
- Analytics beyond the four overview counts.
- Scheduling, email, offers, comments, and notifications.
- Controls that look operational but do not perform an action.

## Success criteria for the final application

- A recruiter can see pipeline volume, open an applicant, and tell which job and stage that application is in.
- The interface stays readable with hundreds of applications: compact tables, consistent stage indicators, and navigation that does not depend on hunting through menus.
- Any ordering or recommendation can be explained in job-relevant terms and does not use protected demographic attributes.
- Stage and status change only when the recruiter takes that action.
- Data presented as saved is actually stored. Sample data stays labeled as demonstration data until persistence exists.
- The application typechecks, lints, and builds.
