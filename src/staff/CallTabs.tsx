import { Chip, OutcomePill } from "./Analysis";
import { curvePoints, gradeLabel, mmss, quoteAt, sentimentByIdx, stateScore, zeroY } from "../lib/analysis";
import type { CallDetail } from "../lib/staffApi";

type Props = { d: CallDetail; seek: (t: number) => void; canSeek: boolean };
const toneOf = (state: string) => (stateScore(state) <= -1 ? "red" : stateScore(state) < 0 ? "amber" : stateScore(state) > 0 ? "green" : "slate") as "red" | "amber" | "green" | "slate";

export function OverviewTab({ d }: Pick<Props, "d">) {
  const cv = d.conversation, od = cv.outcome_detail;
  const fact = (k: string, v: string) => <div key={k} className="contents"><dt className="font-semibold">{k}</dt><dd>{v}</dd></div>;
  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr_auto_1fr]">
        {fact("Duration", d.call.duration_s != null ? mmss(d.call.duration_s) : "n/a")}
        {fact("Turns", cv.turn_count != null ? String(cv.turn_count) : String(cv.turns.length))}
        {fact("Language", d.call.language ?? "n/a")}
        {fact("Call grade", gradeLabel(cv.call_grade))}
        {fact("Effort", cv.effort != null ? `${cv.effort.toFixed(1)} attempts per resolved request` : "n/a")}
        {fact("Judge model", od?.model ?? "n/a")}
        {fact("Judge confidence", od?.confidence != null ? `${Math.round(od.confidence * 100)}%` : "n/a")}
        <dt className="font-semibold">Outcome</dt><dd><OutcomePill outcome={d.review.effective?.outcome ?? null} />{od?.escalated ? " handed to a human" : ""}</dd>
      </dl>

      <section aria-labelledby="ov-int">
        <h3 id="ov-int" className="font-bold">What the caller wanted</h3>
        {!(d.review.effective?.intents.length) ? <p className="text-sm">No request was identified.</p> : (
          <p className="mt-1 flex flex-wrap gap-1">{d.review.effective.intents.map((i) => <Chip key={i.name} tone={i.resolved ? "green" : "red"}>{i.name}: {i.resolved ? "resolved" : "unresolved"}</Chip>)}</p>
        )}
      </section>

      <section aria-labelledby="ov-res">
        <h3 id="ov-res" className="font-bold">Was each request resolved?</h3>
        {!od?.intent_results.length ? <p className="text-sm">No requests to check.</p> : (
          <ul className="mt-1 space-y-2">{od.intent_results.map((r) => {
            const q = quoteAt(cv.turns, r.evidence_span_id);
            return (
              <li key={r.name} className="rounded-lg border border-slate-200 p-2 text-sm">
                <strong>{r.name}</strong>: {r.resolved ? "resolved" : "not resolved"}{r.attempts != null && <>, {r.attempts} attempt{r.attempts === 1 ? "" : "s"}</>}
                {q && <blockquote lang={d.call.language ?? undefined} className="mt-1 border-l-4 border-slate-300 pl-2 text-slate-700">{q}</blockquote>}
              </li>);
          })}</ul>
        )}
      </section>

      <section aria-labelledby="ov-rep">
        <h3 id="ov-rep" className="font-bold">Repairs</h3>
        <p className="text-xs text-slate-600">Moments where the caller had to fix or repeat something.</p>
        {!od?.repairs.length ? <p className="text-sm">None.</p> : (
          <ul className="mt-1 space-y-2">{od.repairs.map((r, i) => (
            <li key={i} className="rounded-lg border border-slate-200 p-2 text-sm">
              <Chip tone="amber">{r.type}{r.subtype ? `: ${r.subtype.replace(/_/g, " ")}` : ""}</Chip>
              <blockquote lang={d.call.language ?? undefined} className="mt-1 border-l-4 border-slate-300 pl-2">{r.quote}</blockquote>
              {r.gloss_en && r.gloss_en !== r.quote && <p className="mt-1 text-slate-700">In English: {r.gloss_en}</p>}
            </li>))}</ul>
        )}
      </section>

      <section aria-labelledby="ov-ph">
        <h3 id="ov-ph" className="font-bold">Claimed actions with no matching tool call</h3>
        <p className="text-sm">{od?.phantom_actions == null ? "Can't tell: this call has no tool trace, because it is a recording." : od.phantom_actions.length ? `${od.phantom_actions.length} found.` : "None found."}</p>
      </section>

      <section aria-labelledby="ov-auto">
        <h3 id="ov-auto" className="font-bold">Automatic assessment</h3>
        <p className="text-sm">{od?.reason || "No assessment yet."}</p>
      </section>
    </div>
  );
}

export function TranscriptTab({ d, seek, canSeek }: Props) {
  const sent = sentimentByIdx(d.conversation.sentiment?.turns);
  const lang = d.call.language;
  const firstNeg = d.conversation.sentiment?.firstNegativeTurn;
  if (!d.conversation.turns.length) return <p>There is no transcript for this call.</p>;
  return (
    <ol className="space-y-2">
      {d.conversation.turns.map((t) => {
        const s = t.role === "user" ? sent.get(t.idx) : undefined;
        return (
          <li key={t.idx}>
            <button type="button" onClick={() => seek(t.offset_sec)} disabled={!canSeek} className={`block w-full rounded-lg p-2 text-left ${t.role === "user" ? "bg-slate-100" : "bg-blue-50"} ${firstNeg === t.idx ? "ring-2 ring-red-400" : ""}`}>
              <span className="text-xs font-semibold text-slate-700">{t.role === "user" ? "Caller" : "Agent"} <span className="font-normal">{mmss(t.offset_sec)}, turn {t.idx}</span></span>
              <span lang={lang ?? undefined} className="block whitespace-pre-wrap">{t.text}</span>
              {(s || t.intents?.length || firstNeg === t.idx) ? (
                <span className="mt-1 flex flex-wrap gap-1">
                  {s && <Chip tone={toneOf(s.state)}>mood: {s.state}</Chip>}
                  {firstNeg === t.idx && <Chip tone="red">first negative moment</Chip>}
                  {t.intents?.map((i) => <Chip key={i.intent_id}>request: {i.name}</Chip>)}
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

const W = 600, H = 170;
export function SentimentTab({ d }: { d: CallDetail }) {
  const s = d.conversation.sentiment;
  const turns = s?.turns ?? [];
  if (!s || !turns.length) return <p>No caller turns were scored for this call.</p>;
  const pts = curvePoints(turns, W, H), z = zeroY(H);
  const mark = pts.find((p) => p.t.idx === s.firstNegativeTurn);
  return (
    <div className="space-y-3">
      <p className="text-sm">
        {s.firstNegativeTurn != null ? <>First negative moment: <strong>{s.firstNegativeState}</strong> at turn {s.firstNegativeTurn}; {s.recovered ? "the caller recovered afterwards." : "the caller did not recover afterwards."}</> : "The caller never showed a negative mood."}
        {" "}Moods seen: {s.statesDetected.join(", ") || "none"}.
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg border border-slate-200" role="img" aria-label={`Caller mood over ${pts.length} turns: ${pts.map((p) => `turn ${p.t.idx} ${p.t.state}`).join(", ")}`}>
        <text x="6" y="12" fontSize="10" fill="#475569">better</text>
        <text x="6" y={H - 4} fontSize="10" fill="#475569">worse</text>
        <line x1="0" x2={W} y1={z} y2={z} stroke="#94a3b8" strokeDasharray="4 3" />
        <text x={W - 6} y={z - 3} fontSize="10" fill="#475569" textAnchor="end">neutral</text>
        {mark && <><line x1={mark.x} x2={mark.x} y1="0" y2={H} stroke="#dc2626" strokeDasharray="3 3" /><text x={mark.x + 4} y="24" fontSize="10" fill="#b91c1c">first negative</text></>}
        <polyline fill="none" stroke="#0f766e" strokeWidth="2" points={pts.map((p) => `${p.x},${p.y}`).join(" ")} />
        {pts.map((p) => <circle key={p.t.idx} cx={p.x} cy={p.y} r="4" fill={stateScore(p.t.state) < 0 ? "#dc2626" : "#0f766e"}><title>{`Turn ${p.t.idx}: ${p.t.state}`}</title></circle>)}
      </svg>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[26rem] text-left text-sm">
          <caption className="sr-only">Mood of each caller turn</caption>
          <thead><tr className="border-b border-slate-300">{["Turn", "Mood", "Quote", "Intensity", "Confidence"].map((h) => <th key={h} scope="col" className="px-2 py-2 font-semibold">{h}</th>)}</tr></thead>
          <tbody>{turns.map((t) => (
            <tr key={t.idx} className="border-b border-slate-200 align-top">
              <th scope="row" className="px-2 py-2">{t.idx}</th>
              <td className="px-2 py-2"><Chip tone={toneOf(t.state)}>{t.state}</Chip>{t.secondary ? <span className="ml-1 text-xs">+ {t.secondary}</span> : null}</td>
              <td lang={d.call.language ?? undefined} className="px-2 py-2">{t.quote}</td>
              <td className="px-2 py-2">{t.intensity ?? "n/a"}</td>
              <td className="px-2 py-2">{t.confidence != null ? `${Math.round(t.confidence * 100)}%` : "n/a"}</td>
            </tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}

export function ViolationsTab({ d }: { d: CallDetail }) {
  if (!d.violations_checked) return <p>Not run on {d.call.language === "hi" ? "Hindi" : "non-English"} calls: the rules read English text only, so this call has no violation result.</p>;
  if (!d.violations.length) return <p>Checked: no rule fired on this call.</p>;
  return (
    <ul className="space-y-2">{d.violations.map((v, i) => (
      <li key={i} className="rounded-lg border border-slate-200 p-3 text-sm">
        <strong>{v.title}</strong> <Chip tone="red">{v.family.replace(/_/g, " ")}</Chip>
        <blockquote className="mt-1 border-l-4 border-slate-300 pl-2">{v.sentence}</blockquote>
        {v.agent_complied != null && <p className="mt-1">{v.agent_complied ? "The agent went along with it." : "The agent refused."}{v.judge_reason ? ` ${v.judge_reason}` : ""}</p>}
      </li>))}</ul>
  );
}
