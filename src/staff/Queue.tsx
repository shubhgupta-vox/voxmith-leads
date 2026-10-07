import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, ErrorNote } from "../components/ui";
import { staffApi } from "../lib/staffApi";
import { useLoad } from "./Staff";

export const STATUS_LABEL: Record<string, string> = { processing: "Processing", in_review: "In review", delivered: "Delivered" };
export const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—");

export default function Queue() {
  const { data, error, reload } = useLoad(() => staffApi.queue(), []);
  const [status, setStatus] = useState("");
  const nav = useNavigate();
  const rows = (data ?? []).filter((r) => !status || r.status === status); // server already sorts newest first
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">Leads</h1>
        <label className="text-sm">Status
          <select className="ml-2 min-h-11 rounded-lg border border-slate-400 px-2" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
      </div>
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote><Button className="mt-2" variant="secondary" onClick={() => void reload()}>Try again</Button></div>}
      {!data && !error && <p className="mt-4" role="status">Loading leads...</p>}
      {data && !rows.length && <p className="mt-4">{data.length ? "No leads with that status." : "No verified leads yet."}</p>}
      {rows.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">Leads, newest first</caption>
            <thead><tr className="border-b border-slate-300">
              {["Company", "Email", "Status", "Calls", "Analysed", "Reviewed", "Created", "Delivered"].map((h) => <th key={h} scope="col" className="px-2 py-2 font-semibold">{h}</th>)}
            </tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} onClick={() => nav(`/staff/leads/${r.id}`)} className="cursor-pointer border-b border-slate-200 hover:bg-slate-50">
                  <th scope="row" className="px-2 py-3 font-medium"><a href={`/staff/leads/${r.id}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); nav(`/staff/leads/${r.id}`); }} className="text-brand underline">{r.company}</a></th>
                  <td className="px-2 py-3 break-all">{r.email}</td>
                  <td className="px-2 py-3">{STATUS_LABEL[r.status] ?? r.status}</td>
                  <td className="px-2 py-3">{r.calls}</td>
                  <td className="px-2 py-3">{r.analysed}</td>
                  <td className="px-2 py-3">{r.reviewed} / {r.analysed}</td>
                  <td className="px-2 py-3">{fmtDate(r.created_at)}</td>
                  <td className="px-2 py-3">{fmtDate(r.delivered_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
