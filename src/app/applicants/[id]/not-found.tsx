import Link from "next/link";

export default function ApplicationNotFound() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white px-6 py-10">
      <h2 className="text-base font-semibold text-slate-950">
        Application not found
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        This address does not match an application in the demo database.
      </p>
      <Link
        href="/applicants"
        className="mt-4 inline-flex rounded-sm text-sm font-medium text-slate-900 underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:outline-none"
      >
        Back to applicants
      </Link>
    </section>
  );
}
