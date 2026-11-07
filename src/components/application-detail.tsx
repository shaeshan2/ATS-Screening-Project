import { StageBadge } from "@/components/stage-badge";
import {
  getApplicationDetail,
  getApplicationEvents,
  getApplicationNotes,
  type ApplicationEventItem,
} from "@/db/queries/application-detail";
import { isApplicationId } from "@/lib/application-id";
import { notFound } from "next/navigation";
import Link from "next/link";

const calendarDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const recordedAt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});

function formatCalendarDate(value: Date): string {
  return calendarDate.format(value);
}

function formatRecordedAt(value: Date): string {
  return recordedAt.format(value);
}

function eventSummary(event: ApplicationEventItem): string {
  const change = event.fromStage
    ? `${event.fromStage} to ${event.toStage}`
    : `Stage recorded as ${event.toStage}`;
  return event.actorName ? `${change} by ${event.actorName}` : change;
}

function SkillList({
  skills,
  emptyLabel,
}: {
  skills: readonly string[];
  emptyLabel: string;
}) {
  if (skills.length === 0) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>;
  }

  return (
    <ul className="flex flex-wrap gap-1.5">
      {skills.map((skill, index) => (
        <li
          key={`${skill}-${index}`}
          className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 ring-1 ring-slate-200"
        >
          {skill}
        </li>
      ))}
    </ul>
  );
}

export async function ApplicationDetail({
  params,
}: {
  params: PageProps<"/applicants/[id]">["params"];
}) {
  const { id } = await params;
  if (!isApplicationId(id)) notFound();

  const [detail, notes, events] = await Promise.all([
    getApplicationDetail(id),
    getApplicationNotes(id),
    getApplicationEvents(id),
  ]);
  if (!detail) notFound();

  const positionDetails = [detail.jobDepartment, detail.jobLocation].filter(
    (value): value is string => Boolean(value && value.trim().length > 0),
  );

  return (
    <article className="flex flex-col gap-4">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <li>
            <Link
              href="/applicants"
              className="rounded-sm font-medium text-slate-700 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:outline-none"
            >
              Applicants
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-slate-950">
            {detail.candidateName}
          </li>
        </ol>
      </nav>

      <p>
        <Link
          href="/applicants"
          className="rounded-sm text-sm font-medium text-slate-700 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:outline-none"
        >
          Back to applicants
        </Link>
      </p>

      <header className="rounded-xl bg-white px-4 py-4 ring-1 ring-slate-200 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              {detail.candidateName}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {detail.candidateTitle?.trim() || "Current title not recorded"}
            </p>
            <p className="mt-1 text-sm text-slate-600">{detail.candidateEmail}</p>
          </div>
          <StageBadge stage={detail.stage} />
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <section
          aria-labelledby="application-details-heading"
          className="rounded-xl bg-white px-4 py-4 ring-1 ring-slate-200 sm:px-5"
        >
          <h3
            id="application-details-heading"
            className="text-sm font-semibold text-slate-950"
          >
            Application details
          </h3>
          <dl className="mt-3 grid gap-3 text-sm">
            <div>
              <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                Applied position
              </dt>
              <dd className="mt-1 text-slate-800">{detail.jobTitle}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                Application date
              </dt>
              <dd className="mt-1 text-slate-800">
                <time dateTime={detail.appliedAt.toISOString()}>
                  {formatCalendarDate(detail.appliedAt)}
                </time>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                Last updated
              </dt>
              <dd className="mt-1 text-slate-800">
                <time dateTime={detail.updatedAt.toISOString()}>
                  {formatRecordedAt(detail.updatedAt)}
                </time>
              </dd>
            </div>
            {positionDetails.length > 0 ? (
              <div>
                <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                  Department and location
                </dt>
                <dd className="mt-1 text-slate-800">
                  {positionDetails.join(" · ")}
                </dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section
          aria-labelledby="candidate-information-heading"
          className="rounded-xl bg-white px-4 py-4 ring-1 ring-slate-200 sm:px-5"
        >
          <h3
            id="candidate-information-heading"
            className="text-sm font-semibold text-slate-950"
          >
            Candidate information
          </h3>
          <dl className="mt-3 grid gap-3 text-sm">
            <div>
              <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                Current title
              </dt>
              <dd className="mt-1 text-slate-800">
                {detail.candidateTitle?.trim() || "Not recorded"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                Location
              </dt>
              <dd className="mt-1 text-slate-800">
                {detail.candidateLocation?.trim() || "Not recorded"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                Skills
              </dt>
              <dd className="mt-1">
                <SkillList
                  skills={detail.candidateSkills}
                  emptyLabel="No skills listed."
                />
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <section
        aria-labelledby="job-information-heading"
        className="rounded-xl bg-white px-4 py-4 ring-1 ring-slate-200 sm:px-5"
      >
        <h3
          id="job-information-heading"
          className="text-sm font-semibold text-slate-950"
        >
          Job information
        </h3>
        <h4 className="mt-3 text-sm font-medium text-slate-950">
          {detail.jobTitle}
        </h4>
        {detail.jobDescription?.trim() ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
            {detail.jobDescription}
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-500">
            No job description is stored.
          </p>
        )}
        <h4 className="mt-4 text-xs font-medium tracking-wide text-slate-500 uppercase">
          Required skills
        </h4>
        <div className="mt-2">
          <SkillList
            skills={detail.jobRequiredSkills}
            emptyLabel="No required skills listed."
          />
        </div>
      </section>

      <section
        aria-labelledby="recruiter-notes-heading"
        className="rounded-xl bg-white px-4 py-4 ring-1 ring-slate-200 sm:px-5"
      >
        <h3
          id="recruiter-notes-heading"
          className="text-sm font-semibold text-slate-950"
        >
          Recruiter notes
        </h3>
        {notes.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No notes have been recorded for this application.
          </p>
        ) : (
          <ol className="mt-3 divide-y divide-slate-200">
            {notes.map((note) => (
              <li key={note.id} className="py-3 first:pt-0 last:pb-0">
                <p className="text-sm font-medium text-slate-950">
                  {note.authorName}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  <time dateTime={note.createdAt.toISOString()}>
                    {formatRecordedAt(note.createdAt)}
                  </time>
                </p>
                <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-slate-700">
                  {note.body}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section
        aria-labelledby="activity-heading"
        className="rounded-xl bg-white px-4 py-4 ring-1 ring-slate-200 sm:px-5"
      >
        <h3 id="activity-heading" className="text-sm font-semibold text-slate-950">
          Activity
        </h3>
        {events.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No stage history has been recorded for this application.
          </p>
        ) : (
          <ol className="mt-3 divide-y divide-slate-200">
            {events.map((event) => (
              <li key={event.id} className="py-3 first:pt-0 last:pb-0">
                <p className="text-sm text-slate-800">{eventSummary(event)}</p>
                <p className="mt-1 text-xs text-slate-500">
                  <time dateTime={event.createdAt.toISOString()}>
                    {formatRecordedAt(event.createdAt)}
                  </time>
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </article>
  );
}
