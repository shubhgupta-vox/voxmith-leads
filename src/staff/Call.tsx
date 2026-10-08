import { type ReactNode, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, ErrorNote, inputCls, primary } from "../components/ui";
import { ApiError } from "../lib/api";
import { type CallDetail, staffApi } from "../lib/staffApi";
import {
  FIELD_LABEL, MAX_INTENTS, OUTCOME_LABEL, REASON_LABEL, SENTIMENTS, type FieldName, type Fields,
  buildCorrection, changedFields, fmtValue, neighbour, reviewableIds, saveBlocker, shortcutFor,
} from "../lib/staffLogic";
import { OverviewTab, SentimentTab, TranscriptTab, ViolationsTab } from "./CallTabs";
import { fmtDate } from "./Queue";
import { useLoad, useMe } from "./Staff";

const msg = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
const TABS = ["Overview", "Transcript", "Sentiment", "Violations"] as const;
const HELP: [string, string][] = [
  ["j / k", "Next / previous call of this lead"], ["Space", "Play / pause the audio"], ["[  ]", "Back / forward 5 seconds"],
  ["1 2 3 4", "Set outcome: resolved, handed off, dropped, no request"], ["e", "Toggle 'handed to a human'"],
  ["r", "Mark this call reviewed"], ["?", "Show / hide this help"],
];

function Help({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-full w-full max-w-md overflow-auto rounded-xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold">Keyboard shortcuts</h2>
        <p className="text-sm text-slate-600">They do nothing while you are typing in a field.</p>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          {HELP.map(([k, d]) => <div key={k} className="contents"><dt><kbd className="rounded border border-slate-400 bg-slate-100 px-1.5 font-mono">{k}</kbd></dt><dd>{d}</dd></div>)}
        </dl>
        <button ref={ref} className={`mt-4 ${primary}`} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function FieldCard({ name, original, current, draft, reason, reasons, disabled, saving, onReason, onSave, onReset, children }: {
  name: FieldName; original: Fields; current: Fields; draft: Fields; reason: string; reasons: string[]; disabled: boolean; saving: boolean;
  onReason: (r: string) => void; onSave: () => void; onReset: () => void; children: ReactNode;
}) {
  const changed = changedFields(current, draft).includes(name);
  const wasCorrected = changedFields(original, current).includes(name);
  const blocker = saveBlocker(name, draft, reason);
  return (
    <fieldset disabled={disabled} className="rounded-lg border border-slate-300 p-3 disabled:opacity-60">
      <legend className="px-1 font-semibold">{FIELD_LABEL[name]}</legend>
      <p className="text-sm text-slate-600">Judge said: <strong>{fmtValue(name, original[name])}</strong>
        {wasCorrected && <> &middot; Currently: <strong className="text-brand-dark">{fmtValue(name, current[name])}</strong> (corrected)</>}
      </p>
      <div className="mt-2">{children}</div>
      {changed && (
        <div className="mt-3 flex flex-wrap items-end gap-2 rounded bg-amber-50 p-2">
          <label className="text-sm">Why are you changing this?
            <select id={`reason-${name}`} className={inputCls} value={reason} onChange={(e) => onReason(e.target.value)}>
              <option value="">Choose a reason...</option>
              {reasons.map((r) => <option key={r} value={r}>{REASON_LABEL[r] ?? r}</option>)}
            </select>
          </label>
          <Button onClick={onSave} disabled={!!blocker || saving} title={blocker ?? undefined}>{saving ? "Saving..." : "Save correction"}</Button>
          <Button variant="secondary" onClick={onReset}>Discard</Button>
        </div>
      )}
    </fieldset>
  );
}

function Review({ d, cid, reload, ids }: { d: CallDetail; cid: string; reload: () => Promise<void>; ids: string[] }) {
  const me = useMe();
  const nav = useNavigate();
  const audio = useRef<HTMLAudioElement>(null);
  const { original, effective, corrections, judged } = d.review;
  const current = effective ?? ({} as Fields);
  const [draft, setDraft] = useState<Fields>(current);
  const [reasons, setReasons] = useState<Partial<Record<FieldName, string>>>({});
  const [saving, setSaving] = useState<FieldName | "review" | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [help, setHelp] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [ask, setAsk] = useState<"outcome" | "full" | null>(null);
  const [rerun, setRerun] = useState(false);
  const effKey = JSON.stringify(current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setDraft(current), [effKey]); // a re-run or save changed the stored values: show them
  const dirty = judged && changedFields(current, draft).length > 0;
  const next = neighbour(ids, cid, 1), prev = neighbour(ids, cid, -1);

  const focusReason = (f: FieldName) => setTimeout(() => document.getElementById(`reason-${f}`)?.focus(), 0);
  async function save(f: FieldName) {
    setSaving(f); setNote(null);
    try {
      await staffApi.correct(cid, buildCorrection(f, draft, reasons[f]!));
      setReasons((r) => ({ ...r, [f]: "" }));
      await reload();
      setNote({ ok: true, text: `${FIELD_LABEL[f]} corrected. The call needs signing off again.` });
    } catch (e) { setNote({ ok: false, text: msg(e) }); }
    setSaving(null);
  }
  async function rejudge(full: boolean) {
    setAsk(null); setRerun(true); setNote(null);
    try {
      await staffApi.rejudge(cid, full); await reload();
      setNote({ ok: true, text: full ? "Re-ran the analysis including the intents. Check the values below." : "Re-ran the analysis. Check the values below." });
    } catch (e) { setNote({ ok: false, text: msg(e) }); }
    setRerun(false);
  }
  async function signOff() {
    if (dirty) return setNote({ ok: false, text: "You have unsaved changes. Save or discard them before signing off." });
    setSaving("review"); setNote(null);
    try {
      await staffApi.reviewed(cid); await reload();
      setNote({ ok: true, text: "Signed off." + (next ? " Press j for the next call." : "") });
    } catch (e) { setNote({ ok: false, text: msg(e) }); }
    setSaving(null);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const s = shortcutFor(e);
      if (!s) return;
      if (help) { if (s.type === "help") setHelp(false); return; }
      e.preventDefault();
      const a = audio.current;
      if (s.type === "help") setHelp(true);
      else if (s.type === "call") { const to = s.by > 0 ? next : prev; if (to) nav(`/staff/calls/${to}`); }
      else if (s.type === "play") { if (a) void (a.paused ? a.play() : a.pause()); }
      else if (s.type === "seek") { if (a) a.currentTime = Math.max(0, a.currentTime + s.by); }
      else if (s.type === "reviewed") void signOff();
      else if (judged && s.type === "outcome") { setDraft((x) => ({ ...x, outcome: s.value })); focusReason("outcome"); }
      else if (judged && s.type === "escalate") { setDraft((x) => ({ ...x, escalated: !x.escalated })); focusReason("escalated"); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  useEffect(() => { if (help) { const f = (e: KeyboardEvent) => e.key === "Escape" && setHelp(false); window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); } }, [help]);

  const card = (name: FieldName, children: ReactNode) => original && effective && (
    <FieldCard name={name} original={original} current={effective} draft={draft} reason={reasons[name] ?? ""} reasons={me.reasons}
      disabled={!judged || saving !== null} saving={saving === name} onReason={(r) => setReasons((x) => ({ ...x, [name]: r }))}
      onSave={() => void save(name)} onReset={() => setDraft((x) => ({ ...x, [name]: effective[name] }))}>{children}</FieldCard>
  );
  const seek = (t: number) => { if (audio.current) audio.current.currentTime = t; };

  return (
    <>
      <p className="text-sm"><Link className="text-brand-dark underline" to={`/staff/leads/${d.lead.id}`}>{d.lead.company}</Link> / {d.call.filename}</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold break-all">{d.call.filename}</h1>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={!prev} onClick={() => prev && nav(`/staff/calls/${prev}`)}>Previous (k)</Button>
          <Button variant="secondary" disabled={!next} onClick={() => next && nav(`/staff/calls/${next}`)}>Next (j)</Button>
          <Button variant="secondary" onClick={() => setHelp(true)} aria-label="Keyboard shortcuts">?</Button>
        </div>
      </div>
      {help && <Help onClose={() => setHelp(false)} />}
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="tr">
          <div className="sticky top-0 z-10 bg-white py-2">
            {d.audio_url
              ? <audio ref={audio} controls preload="metadata" src={d.audio_url} className="w-full" aria-label="Call audio" />
              : <p className="rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm">No audio: this recording was deleted (the lead asked for deletion, or retention ran).</p>}
          </div>
          <h2 id="tr" className="sr-only">Call analysis</h2>
          <div role="tablist" aria-label="Call analysis" className="mt-2 flex flex-wrap gap-1 border-b border-slate-300">
            {TABS.map((t) => (
              <button key={t} type="button" role="tab" id={`tab-${t}`} aria-selected={tab === t} aria-controls="tabpanel" tabIndex={tab === t ? 0 : -1}
                onClick={() => setTab(t)} onKeyDown={(e) => {
                  const i = TABS.indexOf(tab) + (e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0);
                  if (i !== TABS.indexOf(tab) && TABS[i]) { setTab(TABS[i]); setTimeout(() => document.getElementById(`tab-${TABS[i]}`)?.focus(), 0); }
                }}
                className={`min-h-11 rounded-t-lg px-3 font-semibold ${tab === t ? "border-x border-t border-slate-300 bg-white text-brand-dark" : "text-slate-600 hover:bg-slate-50"}`}>{t}</button>
            ))}
          </div>
          <div role="tabpanel" id="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex={0} className="mt-3">
            {tab === "Overview" && <OverviewTab d={d} />}
            {tab === "Transcript" && <TranscriptTab d={d} seek={seek} canSeek={!!d.audio_url} />}
            {tab === "Sentiment" && <SentimentTab d={d} />}
            {tab === "Violations" && <ViolationsTab d={d} />}
          </div>
        </section>

        <section aria-labelledby="jd" className="space-y-4">
          <h2 id="jd" className="text-lg font-bold">Judge output and corrections</h2>
          {!judged && <p role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">Analysing this call. The automatic judge has not finished, so there is nothing to correct or sign off yet. This page checks again every 5 seconds.</p>}
          {d.conversation.outcome_detail && (
            <p className="text-sm"><strong>Judge's reason:</strong> {d.conversation.outcome_detail.reason || "none given"}
              {d.conversation.outcome_detail.confidence != null && <> (confidence {Math.round(d.conversation.outcome_detail.confidence * 100)}%)</>}</p>
          )}
          <div className="rounded-lg border border-slate-300 p-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" disabled={!!rerun || saving !== null} onClick={() => setAsk(ask === "outcome" ? null : "outcome")}>Re-run analysis</Button>
              <Button variant="secondary" disabled={!!rerun || saving !== null} onClick={() => setAsk(ask === "full" ? null : "full")}>Re-run incl. intents (second opinion)</Button>
            </div>
            {ask && (
              <div role="alertdialog" aria-label="Confirm re-run" className="mt-2 text-sm">
                <p>{ask === "full" ? "This asks the judges again what the caller wanted and how the call went." : "This asks the outcome judge again."} It spends a few LLM tokens, and the judge's answer may change. Your saved corrections are kept. Check the result before you sign off.</p>
                <div className="mt-2 flex gap-2"><Button onClick={() => void rejudge(ask === "full")}>Yes, re-run</Button><Button variant="secondary" onClick={() => setAsk(null)}>Cancel</Button></div>
              </div>
            )}
            {rerun && <p role="status" className="mt-2 text-sm">Re-running the judges, this can take a minute...</p>}
          </div>
          {card("outcome", (
            <select aria-label="Outcome" className={inputCls} value={draft.outcome ?? ""} onChange={(e) => setDraft({ ...draft, outcome: e.target.value })}>
              {me.outcomes.map((o) => <option key={o} value={o}>{OUTCOME_LABEL[o] ?? o}</option>)}
            </select>
          ))}
          {card("escalated", (
            <label className="flex min-h-11 items-center gap-2"><input type="checkbox" className="size-5" checked={!!draft.escalated} onChange={(e) => setDraft({ ...draft, escalated: e.target.checked })} /> The call was handed to a human</label>
          ))}
          {card("intents", (
            <div className="space-y-2">
              {(draft.intents ?? []).map((it, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <input aria-label={`Intent ${i + 1} name`} className={`${inputCls} !mt-0 flex-1 basis-40`} maxLength={120} value={it.name}
                    onChange={(e) => setDraft({ ...draft, intents: draft.intents.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                  <label className="flex min-h-11 items-center gap-1 text-sm"><input type="checkbox" className="size-5" checked={it.resolved}
                    onChange={(e) => setDraft({ ...draft, intents: draft.intents.map((x, j) => (j === i ? { ...x, resolved: e.target.checked } : x)) })} /> Resolved</label>
                  <Button variant="secondary" aria-label={`Remove intent ${i + 1}`} onClick={() => setDraft({ ...draft, intents: draft.intents.filter((_, j) => j !== i) })}>Remove</Button>
                </div>
              ))}
              {!draft.intents?.length && <p className="text-sm text-slate-600">No intents.</p>}
              <Button variant="secondary" disabled={(draft.intents?.length ?? 0) >= MAX_INTENTS} onClick={() => setDraft({ ...draft, intents: [...draft.intents, { name: "", resolved: false }] })}>Add intent</Button>
              {(draft.intents?.length ?? 0) >= MAX_INTENTS && <span className="ml-2 text-sm">Maximum {MAX_INTENTS}.</span>}
            </div>
          ))}
          {card("sentiment", (
            <select aria-label="Caller's worst mood" className={inputCls} value={draft.sentiment ?? ""} onChange={(e) => setDraft({ ...draft, sentiment: e.target.value || null })}>
              <option value="">None</option>
              {SENTIMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          ))}

          <div className="rounded-lg border border-slate-300 p-3">
            <p className="text-sm">{d.call.reviewed_at ? <>Signed off by {d.call.reviewed_by} on {fmtDate(d.call.reviewed_at)}.</> : "Not signed off yet."}</p>
            <Button className="mt-2" onClick={() => void signOff()} disabled={!judged || saving !== null}>{saving === "review" ? "Saving..." : d.call.reviewed_at ? "Sign off again (r)" : "Mark reviewed (r)"}</Button>
            {dirty && <p className="mt-2 text-sm text-amber-900">You have unsaved changes.</p>}
          </div>
          {note && (note.ok ? <p role="status" className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm">{note.text}</p> : <ErrorNote>{note.text}</ErrorNote>)}

          <div>
            <h3 className="font-semibold">Correction history</h3>
            {!corrections.length ? <p className="text-sm text-slate-600">No corrections yet: the judge's answer stands.</p> : (
              <ul className="mt-1 space-y-2 text-sm">
                {[...corrections].reverse().map((c) => (
                  <li key={c.id} className="rounded border border-slate-200 p-2">
                    <strong>{FIELD_LABEL[c.field]}</strong>: {fmtValue(c.field, c.original_value)} &rarr; {fmtValue(c.field, c.corrected_value)}
                    <br /><span className="text-slate-600">{c.reviewer_email ?? "unknown"}, {fmtDate(c.created_at)}. {REASON_LABEL[c.reason] ?? c.reason}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

export default function Call() {
  const { cid = "" } = useParams();
  const { data, error, reload } = useLoad(() => staffApi.call(cid), [cid]);
  const waiting = !!data && !data.review.judged;
  useEffect(() => { if (!waiting) return; const t = setInterval(() => void reload(), 5000); return () => clearInterval(t); }, [waiting, reload]);
  const lead = useLoad(() => (data ? staffApi.lead(data.lead.id) : Promise.resolve(null)), [data?.lead.id]);
  if (error) return <><ErrorNote>{error}</ErrorNote><p className="mt-3"><Link className="underline" to="/staff">Back to the queue</Link></p></>;
  if (!data) return <p role="status">Loading call...</p>;
  return <Review key={cid} d={data} cid={cid} reload={reload} ids={reviewableIds(lead.data?.calls ?? [])} />;
}
