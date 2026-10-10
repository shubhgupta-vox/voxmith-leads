import { LinkButton } from "../components/ui";
import { LIMITS, TURNAROUND_FALLBACK } from "../lib/config";

const Bar = ({ w }: { w: string }) => <div className="h-2 rounded bg-slate-200" style={{ width: w }} />;

export default function Landing() {
  return (
    <div className="fade-in">
      <section className="on-dark relative overflow-hidden bg-ink text-white">
        <img src="/brand/mark-white.png" alt="" aria-hidden="true" width={256} height={232} className="pointer-events-none absolute -right-10 top-1/2 hidden h-72 w-auto -translate-y-1/2 opacity-10 sm:block" />
        <div className="relative mx-auto max-w-3xl space-y-5 px-4 py-14 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-200">Free conversation analysis</p>
          <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
            Upload up to {LIMITS.maxFiles} of your production conversations (calls or transcripts). Get a reviewed analysis PDF {TURNAROUND_FALLBACK}.
          </h1>
          <p className="max-w-xl text-lg text-slate-200">Find out how your agent really handles customers: what they ask for, where conversations go wrong, and what to fix first.</p>
          <LinkButton to="/start">Start your analysis</LinkButton>
        </div>
      </section>

      <div className="mx-auto max-w-3xl space-y-12 px-4 py-10">
        <section aria-labelledby="get">
          <div>
            <h2 id="get" className="text-xl font-semibold">What you get</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
              <li>A PDF summary: conversations analysed, resolution rate, top intents, escalations and sentiment.</li>
              <li>The top problems we found, with a page per conversation.</li>
            </ul>
            <p className="mt-3 text-sm text-slate-700">Analysis is from the conversations you upload only. Live metrics like tool errors, latency and cost need a connection to your agent (we can set that up on the demo).</p>
          </div>
        </section>

        <section aria-labelledby="sample" className="space-y-3">
          <h2 id="sample" className="text-xl font-semibold">Sample report</h2>
          <div className="rounded-xl border border-dashed border-slate-400 bg-slate-50 p-5" role="img" aria-label="Illustrative layout of the summary page. Placeholder, not real data.">
            <p className="mb-4 inline-block rounded bg-amber-100 px-2 py-1 text-sm font-medium text-amber-900">Placeholder layout, not real data</p>
            <div className="grid gap-4 sm:grid-cols-3">
              {["Conversations analysed", "Resolution rate", "Escalations"].map((t) => (
                <div key={t} className="rounded-lg bg-white p-3"><p className="text-sm text-slate-600">{t}</p><p className="text-2xl font-bold text-slate-400">--</p></div>
              ))}
            </div>
            <div className="mt-4 space-y-2 rounded-lg bg-white p-3">
              <p className="text-sm text-slate-600">Top intents</p>
              <Bar w="80%" /><Bar w="55%" /><Bar w="30%" />
            </div>
            <div className="mt-4 rounded-lg bg-white p-3"><p className="text-sm text-slate-600">Top 3 problems</p><div className="mt-2 space-y-2"><Bar w="90%" /><Bar w="70%" /><Bar w="60%" /></div></div>
          </div>
        </section>

        <section className="rounded-xl bg-brand-50 p-6 text-center">
          <p className="mb-3 text-lg font-semibold">Takes about five minutes.</p>
          <LinkButton to="/start">Start your analysis</LinkButton>
        </section>
      </div>
    </div>
  );
}
