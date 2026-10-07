import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ErrorNote } from "../components/ui";
import { judgeNote, nOfD, pct } from "../lib/analysis";
import type { Analytics } from "../lib/staffApi";
import { OUTCOME_LABEL } from "../lib/staffLogic";
import { useLoad } from "./Staff";
import { staffApi } from "../lib/staffApi";

const OUTCOME_CLS: Record<string, string> = {
  resolved: "bg-green-100 text-green-900", handed_off: "bg-blue-100 text-blue-900", dropped: "bg-red-100 text-red-900", no_request: "bg-slate-100 text-slate-800",
};
/** Text pill, never colour alone. */
export const OutcomePill = ({ outcome }: { outcome: string | null }) =>
  outcome ? <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${OUTCOME_CLS[outcome] ?? "bg-slate-100"}`}>{OUTCOME_LABEL[outcome] ?? outcome}</span> : <span className="text-xs text-slate-600">Not judged</span>;

export const Chip = ({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "red" | "green" | "amber" }) => {
  const c = { slate: "bg-slate-100 text-slate-800", red: "bg-red-100 text-red-900", green: "bg-green-100 text-green-900", amber: "bg-amber-100 text-amber-900" }[tone];
  return <span className={`inline-block rounded px-1.5 py-0.5 text-xs ${c}`}>{children}</span>;
};

function Tile({ label, value, sub, def, note }: { label: string; value: string; sub?: string; def: string; note?: string | null }) {
  return (
    <div className="rounded-lg border border-slate-300 p-3">
      <h3 className="text-sm font-semibold text-slate-700">{label}</h3>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {sub && <p className="text-sm">{sub}</p>}
      {note && <p className="text-xs text-amber-900">{note}</p>}
      <p className="mt-1 text-xs text-slate-600">{def}</p>
    </div>
  );
}

const Bar = ({ share, label }: { share: number; label: string }) => (
  <div className="h-3 w-full rounded bg-slate-100" role="img" aria-label={label}><div className="h-3 rounded bg-brand" style={{ width: `${Math.round(share * 100)}%` }} /></div>
);

export default function Analysis({ leadId, version }: { leadId: string; version: unknown }) {
  const { data: a, error } = useLoad(() => staffApi.analytics(leadId), [leadId, version]);
  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!a) return <p role="status" className="mt-6">Loading analysis...</p>;
  return <Body a={a} />;
}

function Body({ a }: { a: Analytics }) {
  const { automatic: auto, reviewed: rev } = a;
  const r = auto.rates;
  const fixes = r.repair_rate.by_type.fix, redos = r.repair_rate.by_type.redo;
  const effort = (v: number | null) => (v == null ? "n/a" : `${v.toFixed(1)} attempts`);
  const s = auto.sentiment;
  if (!auto.counts.conversations) return <section aria-labelledby="ov" className="mt-8"><h2 id="ov" className="text-xl font-bold">Analysis overview</h2><p className="mt-2">No calls have been analysed yet.</p></section>;
  return (
    <section aria-labelledby="ov" className="mt-8">
      <h2 id="ov" className="text-xl font-bold">Analysis overview</h2>
      <p className="mt-1 text-sm text-slate-700">
        Rates use {auto.counts.counted} analysed call{auto.counts.counted === 1 ? "" : "s"} with a request (of {auto.counts.conversations}{auto.counts.no_request ? `; ${auto.counts.no_request} had no request` : ""}).
        Resolution, dropped, handoff and effort show the signed-off values{rev.calls_corrected ? ` (${rev.calls_corrected} call${rev.calls_corrected === 1 ? " was" : "s were"} corrected)` : ""}.
        {a.waiting > 0 && ` ${a.waiting} call${a.waiting === 1 ? " is" : "s are"} still being analysed.`}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Resolution rate" value={pct(rev.resolution_rate.value)} sub={nOfD(rev.resolution_rate.num, rev.resolution_rate.den)} def={r.resolution_rate.definition} note={judgeNote(rev.resolution_rate.value, r.resolution_rate.value)} />
        <Tile label="Dropped rate" value={pct(rev.dropped_rate.value)} sub={nOfD(rev.dropped_rate.num, rev.dropped_rate.den)} def={r.dropped_rate.definition} note={judgeNote(rev.dropped_rate.value, r.dropped_rate.value)} />
        <Tile label="Handoff rate" value={pct(rev.handoff_rate.value)} sub={nOfD(rev.handoff_rate.num, rev.handoff_rate.den)} def={r.handoff_rate.definition} note={judgeNote(rev.handoff_rate.value, r.handoff_rate.value)} />
        <Tile label="Repair rate" value={pct(r.repair_rate.value)} sub={`${nOfD(r.repair_rate.num, r.repair_rate.den)}; ${fixes.events} fix, ${redos.events} redo`} def={r.repair_rate.definition} />
        <Tile label="Effort to resolution" value={effort(rev.effort.value)} sub={nOfD(rev.effort.den, rev.effort.den, "resolved requests")} def={r.effort.definition} note={judgeNote(rev.effort.value, r.effort.value, effort)} />
        <Tile label="Frustrated callers" value={pct(r.frustrated_rate.value)} sub={nOfD(r.frustrated_rate.num, r.frustrated_rate.den)} def={r.frustrated_rate.definition} />
        <Tile label="Phantom actions" value={r.phantom_rate.value == null ? "Not measurable" : pct(r.phantom_rate.value)} def={r.phantom_rate.note ?? r.phantom_rate.definition} />
        <Tile label="Handed to a human" value={String(rev.escalations)} sub={`${rev.escalations === 1 ? "call" : "calls"} escalated (signed off)`} def="Calls where a person took over from the agent." />
      </div>
      {(fixes.events > 0 || redos.events > 0) && (
        <p className="mt-2 text-sm text-slate-700">Repairs: fix = caller corrects the agent ({Object.entries(fixes.subtypes).filter(([, n]) => n).map(([k, n]) => `${k.replace(/_/g, " ")} ${n}`).join(", ") || "none"}); redo = caller repeats themselves ({Object.entries(redos.subtypes).filter(([, n]) => n).map(([k, n]) => `${k.replace(/_/g, " ")} ${n}`).join(", ") || "none"}).</p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="min-w-0">
          <h3 className="text-lg font-bold">Top requests</h3>
          {!auto.intents.length ? <p className="mt-1 text-sm">No requests identified.</p> : (
            <div className="mt-1 overflow-x-auto">
              <table className="w-full min-w-[26rem] text-left text-sm">
                <caption className="sr-only">What callers asked for, with how often it was resolved</caption>
                <thead><tr className="border-b border-slate-300">{["Request", "Calls", "Resolved", "Rate", "Avg effort"].map((h) => <th key={h} scope="col" className="px-2 py-2 font-semibold">{h}</th>)}</tr></thead>
                <tbody>{auto.intents.map((i) => (
                  <tr key={i.name} className="border-b border-slate-200">
                    <th scope="row" className="px-2 py-2 font-medium">{i.name}</th>
                    <td className="px-2 py-2">{i.calls}</td><td className="px-2 py-2">{i.resolved}</td>
                    <td className="px-2 py-2">{pct(i.resolved_rate)}</td><td className="px-2 py-2">{i.avg_effort == null ? "n/a" : i.avg_effort.toFixed(1)}</td>
                  </tr>))}</tbody>
              </table>
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-bold">Caller sentiment</h3>
          {!s.scored_conversations ? <p className="mt-1 text-sm">No calls scored yet.</p> : (
            <>
              <p className="mt-1 text-sm">{s.negative_conversations} of {s.scored_conversations} calls had a negative moment
                {s.median_first_negative_turn != null && <>, typically around turn {s.median_first_negative_turn}</>}
                {s.recovered_rate != null && <>; {pct(s.recovered_rate)} recovered afterwards</>}.</p>
              <ul className="mt-2 space-y-1 text-sm">
                {s.distribution.filter((d) => d.conversations > 0).map((d) => (
                  <li key={d.state} className="grid grid-cols-[6.5rem_1fr_4.5rem] items-center gap-2">
                    <span>{d.state}</span><Bar share={d.share} label={`${d.state}: ${d.conversations} of ${s.scored_conversations} calls`} /><span className="text-right">{d.conversations} call{d.conversations === 1 ? "" : "s"}</span>
                  </li>))}
              </ul>
              <p className="mt-1 text-xs text-slate-600">A call counts under every mood it showed, so shares add up to more than 100%.</p>
            </>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-bold">Violations</h3>
        {auto.violations.english_calls === 0
          ? <p className="mt-1 text-sm">Not run on Hindi calls: the {auto.violations.rules_checked} rules read English text only, so there is no violation count for this lead.</p>
          : !auto.violations.fired.length
            ? <p className="mt-1 text-sm">{auto.violations.rules_checked} rules checked on {auto.violations.english_calls} English call{auto.violations.english_calls === 1 ? "" : "s"}: none fired.</p>
            : (
              <ul className="mt-1 list-disc pl-5 text-sm">{auto.violations.fired.map((f) => (
                <li key={f.title}><strong>{f.title}</strong> ({f.family.replace(/_/g, " ")}): {f.attempts} hit{f.attempts === 1 ? "" : "s"} in {f.conversations} call{f.conversations === 1 ? "" : "s"}{f.judged ? `; the agent complied ${f.complied} of ${f.judged} judged` : ""}.</li>))}
              </ul>)}
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-bold">Needs attention</h3>
        {!auto.needs_attention.length ? <p className="mt-1 text-sm">Nothing flagged.</p> : (
          <ul className="mt-1 space-y-2">
            {auto.needs_attention.map((n) => (
              <li key={n.conversation_id} className="rounded-lg border border-slate-200 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2"><OutcomePill outcome={n.outcome} /><strong>{n.intent || "No request"}</strong>
                  <Link className="ml-auto text-brand underline" to={`/staff/calls/${n.conversation_id}`}>Open call</Link></div>
                <p className="mt-1 text-slate-700">{n.reason}</p>
              </li>))}
          </ul>
        )}
      </div>
    </section>
  );
}
