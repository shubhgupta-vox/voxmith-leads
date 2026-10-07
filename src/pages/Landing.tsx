import { LinkButton } from "../components/ui";
import { LIMITS, TURNAROUND_FALLBACK } from "../lib/config";

const Bar = ({ w }: { w: string }) => <div className="h-2 rounded bg-slate-200" style={{ width: w }} />;

export default function Landing() {
  return (
    <div className="fade-in space-y-12">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          Upload up to {LIMITS.maxFiles} of your recorded calls. Get a reviewed analysis PDF {TURNAROUND_FALLBACK}.
        </h1>
        <p className="text-lg text-slate-700">Find out how your voice agent really handles customers: what they ask for, where calls go wrong, and what to fix first.</p>
        <LinkButton to="/start">Start your analysis</LinkButton>
      </section>

      <section aria-labelledby="get" className="grid gap-6 sm:grid-cols-2">
        <div>
          <h2 id="get" className="text-xl font-semibold">What you get</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
            <li>A PDF summary: calls analysed, resolution rate, top intents, escalations and sentiment.</li>
            <li>The top problems we found, with a page per call.</li>
            <li>Every analysis is checked by a person at VoxMith before it is sent to you.</li>
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-semibold">What we do with your audio</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
            <li>We only start analysing after you confirm your email.</li>
            <li>Calls are transcribed and analysed by automated tools, then reviewed by our team.</li>
            <li>We keep your recordings so our team can review the analysis. You can ask us to delete everything at any time.</li>
            <li>You can delete your data at any time from your status page.</li>
          </ul>
        </div>
      </section>

      <section aria-labelledby="sample" className="space-y-3">
        <h2 id="sample" className="text-xl font-semibold">Sample report</h2>
        <div className="rounded-xl border border-dashed border-slate-400 bg-slate-50 p-5" role="img" aria-label="Illustrative layout of the summary page. Placeholder, not real data.">
          <p className="mb-4 inline-block rounded bg-amber-100 px-2 py-1 text-sm font-medium text-amber-900">Placeholder layout, not real data</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {["Calls analysed", "Resolution rate", "Escalations"].map((t) => (
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

      <section className="rounded-xl bg-slate-50 p-6 text-center">
        <p className="mb-3 text-lg font-semibold">Takes about five minutes.</p>
        <LinkButton to="/start">Start your analysis</LinkButton>
      </section>
    </div>
  );
}
