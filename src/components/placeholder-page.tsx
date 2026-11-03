export function PlaceholderPage({
  heading,
  body,
}: {
  heading: string;
  body: string;
}) {
  return (
    <section
      aria-labelledby="milestone-placeholder-heading"
      className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12"
    >
      <h2
        id="milestone-placeholder-heading"
        className="text-base font-semibold text-slate-950"
      >
        {heading}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{body}</p>
    </section>
  );
}
