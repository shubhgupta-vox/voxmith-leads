import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, ErrorNote } from "../components/ui";
import { ApiError } from "../lib/api";
import { fileLabel } from "../lib/stages";
import { type CallDetail, type LeadCallRow, type LeadDetail, staffApi } from "../lib/staffApi";
import { gradeLabel, worstMood } from "../lib/analysis";
import { reportBlocker } from "../lib/staffLogic";
import Analysis, { Chip, OutcomePill } from "./Analysis";
import { STATUS_LABEL, fmtDate } from "./Queue";
import { useLoad } from "./Staff";

const msg = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong. Please try again.");

function ReportPanel({ lead, reload }: { lead: LeadDetail; reload: () => Promise<void> }) {
  const [preview, setPreview] = useState<{ url: string; ready: boolean } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"send" | "hand" | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const blocker = reportBlocker(lead.calls);
  const delivered = !!lead.delivered_at;
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);

  async function run(what: string, fn: () => Promise<{ ok: boolean; text: string }>) {
    setBusy(what); setNote(null); setConfirm(null);
    try { setNote(await fn()); await reload(); } catch (e) { setNote({ ok: false, text: msg(e) }); }
    setBusy(null);
  }
  const load = () => run("preview", async () => { setPreview(await staffApi.report(lead.id)); return { ok: true, text: "Preview refreshed from the signed-off values." }; });
  const send = () => run("send", async () => {
    const r = await staffApi.send(lead.id, delivered);
    return r.sent ? { ok: true, text: "Report emailed to the lead." } : { ok: false, text: `Not sent. ${r.reason} Preview and download the PDF, send it yourself, then use "Mark as sent by hand".` };
  });
  const hand = () => run("hand", async () => { await staffApi.delivered(lead.id); return { ok: true, text: "Recorded as sent by hand." }; });

  return (
    <section aria-labelledby="rep" className="mt-8">
      <h2 id="rep" className="text-xl font-bold">Report</h2>
      {delivered && <p className="mt-1">Delivered {fmtDate(lead.delivered_at)}.</p>}
      {blocker && <p className="mt-1 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm" role="status">Sending is disabled: {blocker} Sign off every analysed call first.</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => void load()} disabled={!!busy}>{busy === "preview" ? "Building preview..." : preview ? "Refresh preview" : "Preview PDF"}</Button>
        <Button onClick={() => setConfirm("send")} disabled={!!blocker || !!busy}>{delivered ? "Send again" : "Send report"}</Button>
        {!delivered && <Button variant="secondary" onClick={() => setConfirm("hand")} disabled={!!blocker || !!busy}>Mark as sent by hand</Button>}
      </div>
      {confirm && (
        <div role="alertdialog" aria-label="Confirm" className="mt-3 rounded-lg border border-slate-300 bg-slate-50 p-3">
          <p>{confirm === "send" ? `Email the PDF report to ${lead.email}?` : "Record that you already sent the PDF to the lead yourself? The lead will show as delivered."}</p>
          <div className="mt-2 flex gap-2">
            <Button onClick={() => void (confirm === "send" ? send() : hand())}>Yes, {confirm === "send" ? "send it" : "mark it"}</Button>
            <Button variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button>
          </div>
        </div>
      )}
      {note && (note.ok ? <p role="status" className="mt-3 rounded-lg border border-green-300 bg-green-50 p-3 text-sm">{note.text}</p> : <div className="mt-3"><ErrorNote>{note.text}</ErrorNote></div>)}
      {preview && (
        <div className="mt-4">
          <p className="text-sm" role="status">{preview.ready ? "Report is complete: every call is signed off." : "Preview only: not ready to send yet (some calls are not signed off or still processing)."}
            {" "}<a className="text-brand underline" href={preview.url} target="_blank" rel="noreferrer">Open in a new tab</a>{" "}
            <a className="text-brand underline" href={preview.url} download={`voxmith-analysis-${lead.id.slice(0, 8)}.pdf`}>Download</a>
          </p>
          <iframe title="Report PDF preview" src={preview.url} className="mt-2 h-[70vh] w-full rounded-lg border border-slate-300" />
        </div>
      )}
    </section>
  );
}

// Per-call details are fetched once per page visit and shared (the table chips need outcome, grade, mood).
const detailCache = new Map<string, Promise<CallDetail>>();
const detailOf = (cid: string) => {
  let p = detailCache.get(cid);
  if (!p) { p = staffApi.call(cid); p.catch(() => detailCache.delete(cid)); detailCache.set(cid, p); }
  return p;
};

function CallRow({ c }: { c: LeadCallRow }) {
  const cid = c.conversation_id && c.stage === "analysed" ? c.conversation_id : null;
  const [d, setD] = useState<CallDetail | null>(null);
  useEffect(() => { if (cid) detailOf(cid).then(setD, () => undefined); }, [cid]);
  const cd = d?.conversation;
  const judged = c.outcome_judged;
  const worst = worstMood(cd?.sentiment?.turns);
  return (
    <tr className="border-b border-slate-200">
      <th scope="row" className="px-2 py-3 font-medium break-all">
        {cid ? <Link className="text-brand underline" to={`/staff/calls/${cid}`}>{c.filename}</Link> : c.filename}
      </th>
      <td className="px-2 py-3">{fileLabel(c.stage as never, true)}{c.reason ? `: ${c.reason}` : ""}</td>
      <td className="px-2 py-3">{!cid ? "" : !judged ? <Chip tone="amber">Analysing</Chip> : <OutcomePill outcome={d?.review.effective?.outcome ?? null} />}</td>
      <td className="px-2 py-3">{cd ? gradeLabel(cd.call_grade) : ""}</td>
      <td className="px-2 py-3">{cd?.effort != null ? cd.effort.toFixed(1) : cd ? "n/a" : ""}</td>
      <td className="px-2 py-3">{(d?.review.effective?.intents ?? []).map((i) => <span key={i.name} className="mr-1 inline-block"><Chip tone={i.resolved ? "green" : "red"}>{i.name}: {i.resolved ? "resolved" : "unresolved"}</Chip></span>)}</td>
      <td className="px-2 py-3">{cd ? (worst ? <Chip tone="red">{worst}</Chip> : "none") : ""}</td>
      <td className="px-2 py-3">{c.reviewed_at ? `Yes, ${c.reviewed_by ?? ""}` : "No"}</td>
    </tr>
  );
}

export default function Lead() {
  const { id = "" } = useParams();
  useState(() => detailCache.clear()); // fresh on every visit: corrections made on a call page must show here
  const { data: lead, error, reload } = useLoad(() => staffApi.lead(id), [id]);
  if (error) return <><ErrorNote>{error}</ErrorNote><p className="mt-3"><Link className="underline" to="/staff">Back to the queue</Link></p></>;
  if (!lead) return <p role="status">Loading lead...</p>;
  return (
    <>
      <p className="text-sm"><Link className="text-brand underline" to="/staff">All leads</Link></p>
      <h1 className="mt-1 text-2xl font-bold">{lead.company}</h1>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="font-semibold">Contact</dt><dd>{lead.name}, <span className="break-all">{lead.email}</span></dd>
        <dt className="font-semibold">Status</dt><dd>{STATUS_LABEL[lead.status] ?? lead.status}</dd>
        <dt className="font-semibold">Created</dt><dd>{fmtDate(lead.created_at)}</dd>
        <dt className="font-semibold">Audio kept</dt><dd>{lead.keep_consent ? "Yes: the lead agreed we may keep the recordings." : "No: the lead declined, so audio is deleted after analysis."}</dd>
        <dt className="font-semibold">About their agent</dt><dd>{lead.agent_description || "Not given."}</dd>
      </dl>
      <Analysis leadId={lead.id} version={lead.calls.map((c) => c.reviewed_at).join()} />
      <h2 className="mt-8 text-xl font-bold">Calls</h2>
      {!lead.calls.length ? <p className="mt-2">No calls uploaded.</p> : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <caption className="sr-only">Calls of this lead, with outcome, grade, effort, requests and worst mood</caption>
            <thead><tr className="border-b border-slate-300">{["File", "Stage", "Outcome", "Grade", "Effort", "Requests", "Worst mood", "Reviewed"].map((h) => <th key={h} scope="col" className="px-2 py-2 font-semibold">{h}</th>)}</tr></thead>
            <tbody>
              {lead.calls.map((c) => <CallRow key={c.file_id} c={c} />)}
            </tbody>
          </table>
        </div>
      )}
      <ReportPanel lead={lead} reload={reload} />
    </>
  );
}
