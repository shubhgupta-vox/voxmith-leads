import { useState } from "react";
import { Button, ErrorNote } from "../components/ui";
import { type GhSeriesPoint, chartSummary, csvFilename, dayLabel, shortId, showing, toBars } from "../lib/groundhogLogic";
import { type GroundhogInstall, type GroundhogParams, type Tool, staffApi } from "../lib/staffApi";
import { fmtDate } from "./Queue";
import { useLoad } from "./Staff";

const PAGE_SIZE = 50;

function Tile({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-3"><p className="text-sm text-slate-600">{label}</p><p className="text-2xl font-bold">{value.toLocaleString()}</p></div>;
}

function Chart({ title, series, k, noun }: { title: string; series: GhSeriesPoint[]; k: "runs" | "new_people"; noun: string }) {
  const W = 600, H = 100;
  const bars = toBars(series, k, W, H);
  const summary = chartSummary(series, k, noun);
  return (
    <figure className="relative rounded-lg border border-slate-200 bg-white p-3">
      <figcaption className="text-sm font-semibold">{title} <span className="font-normal text-slate-600">(last 30 days)</span></figcaption>
      <p className="text-sm text-slate-600">{summary}</p>
      <svg viewBox={`0 0 ${W} ${H + 4}`} className="mt-2 h-28 w-full" role="img" aria-label={`${title}. ${summary}`} preserveAspectRatio="none">
        <line x1="0" x2={W} y1={H + 1} y2={H + 1} stroke="#cbd5e1" />
        {bars.map((b) => <rect key={b.day} x={b.x} y={b.y} width={b.w} height={b.h} className="fill-brand"><title>{`${dayLabel(b.day)}: ${b.value}`}</title></rect>)}
      </svg>
      <div className="flex justify-between text-xs text-slate-600" aria-hidden="true"><span>{series.length ? dayLabel(series[0].day) : ""}</span><span>{series.length ? dayLabel(series[series.length - 1].day) : ""}</span></div>
      <table className="sr-only"><caption>{title}, last 30 days</caption>
        <thead><tr><th scope="col">Day</th><th scope="col">{noun}</th></tr></thead>
        <tbody>{series.map((p) => <tr key={p.day}><th scope="row">{dayLabel(p.day)}</th><td>{p[k]}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}

const TOOL: Record<Tool, { name: string; metric: string; value: (r: GroundhogInstall) => string }> = {
  groundhog: { name: "Groundhog", metric: "Top-repeat count", value: (r) => String(r.top_count ?? "") },
  burn: { name: "Burn", metric: "Resolution rate", value: (r) => (r.resolution_rate == null ? "-" : `${r.resolution_rate}%${r.sessions_judged != null ? ` of ${r.sessions_judged}` : ""}`) },
};

/** Staff view of one free-tool skill's pings (/staff/groundhog, /staff/burn). */
export default function ToolInstalls({ tool }: { tool: Tool }) {
  const t = TOOL[tool];
  const summary = useLoad(() => staffApi.toolSummary(tool), [tool]);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<NonNullable<GroundhogParams["sort"]>>("last_seen");
  const [page, setPage] = useState(1);
  const [csvErr, setCsvErr] = useState<string | null>(null);
  const list = useLoad(() => staffApi.toolInstalls(tool, { q: q.trim(), sort, order: "desc", page, page_size: PAGE_SIZE }), [tool, q, sort, page]);
  const total = list.data?.total ?? 0;
  const toggle = async (id: string, hidden: boolean) => {
    try { await staffApi.setHidden(id, hidden); void list.reload(); } catch (e) { setCsvErr(e instanceof Error ? e.message : "Couldn't change it. Please try again."); }
  };

  const download = async () => {
    setCsvErr(null);
    try {
      const url = URL.createObjectURL(await staffApi.toolCsv(tool, { q: q.trim(), sort, order: "desc" }));
      const a = document.createElement("a");
      a.href = url; a.download = csvFilename(new Date(), tool); a.click();
      URL.revokeObjectURL(url);
    } catch (e) { setCsvErr(e instanceof Error ? e.message : "Download failed. Please try again."); }
  };

  const s = summary.data;
  return (
    <>
      <h1 className="text-2xl font-bold">{t.name}</h1>
      <p className="mt-1 text-sm text-slate-600">Emails come from the skill and are not verified. Treat counts as approximate.</p>

      {summary.error && <div className="mt-4"><ErrorNote>{summary.error}</ErrorNote><Button className="mt-2" variant="secondary" onClick={() => void summary.reload()}>Try again</Button></div>}
      {!s && !summary.error && <p className="mt-4" role="status">Loading...</p>}
      {s && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Tile label="People" value={s.people} /><Tile label="Runs" value={s.runs} />
            <Tile label="Runs this week" value={s.runs_7d} /><Tile label="New people this week" value={s.new_people_7d} />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Chart title="Runs per day" series={s.series} k="runs" noun="runs" />
            <Chart title="New people per day" series={s.series} k="new_people" noun="new people" />
          </div>
        </>
      )}

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <label className="text-sm">Search
          <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Email, install id or version" className="mt-1 block min-h-11 w-64 max-w-full rounded-lg border border-slate-400 px-3" />
        </label>
        <label className="text-sm">Sort by
          <select className="mt-1 block min-h-11 rounded-lg border border-slate-400 px-2" value={sort} onChange={(e) => { setSort(e.target.value as typeof sort); setPage(1); }}>
            <option value="last_seen">Last run</option><option value="runs">Runs</option><option value="first_seen">First run</option>
          </select>
        </label>
        <Button variant="secondary" className="sm:ml-auto" onClick={() => void download()}>Download CSV</Button>
      </div>
      {csvErr && <div className="mt-2"><ErrorNote>{csvErr}</ErrorNote></div>}

      {list.error && <div className="mt-4"><ErrorNote>{list.error}</ErrorNote><Button className="mt-2" variant="secondary" onClick={() => void list.reload()}>Try again</Button></div>}
      {!list.data && !list.error && <p className="mt-4" role="status">Loading...</p>}
      {list.data && !list.data.items.length && <p className="mt-4">{q.trim() ? "No one matches that search." : `No one has used ${t.name} yet.`}</p>}
      {list.data && list.data.items.length > 0 && (
        <>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <caption className="sr-only">{t.name} installs</caption>
              <thead><tr className="border-b border-slate-300">
                {["Account", "Runs", t.metric, "Skill version", "Scope used", "First run", "Last run", ...(tool === "burn" ? ["Leaderboard"] : [])].map((h) => <th key={h} scope="col" className="px-2 py-2 font-semibold">{h}</th>)}
              </tr></thead>
              <tbody>
                {list.data.items.map((r) => (
                  <tr key={r.install_id} className="border-b border-slate-200">
                    <th scope="row" className="px-2 py-3 font-medium break-all">{r.account_email ?? <span className="text-slate-600">no account</span>} <span className="font-mono text-xs font-normal text-slate-600">{shortId(r.install_id)}</span></th>
                    <td className="px-2 py-3">{r.run_count}</td><td className="px-2 py-3">{t.value(r)}</td><td className="px-2 py-3">{r.skill_version}</td><td className="px-2 py-3">{r.scope}</td>
                    <td className="px-2 py-3">{fmtDate(r.first_seen)}</td><td className="px-2 py-3">{fmtDate(r.last_seen)}</td>
                  {tool === "burn" && (
                      <td className="px-2 py-3">
                        <span className="mr-2">{r.hidden ? "Hidden" : r.listed ? (r.score != null ? `Score ${r.score}` : "Listed, < 20 sessions") : "Not listed"}</span>
                        <Button variant="secondary" className="!min-h-8 !px-2 !py-0.5 text-xs" onClick={() => void toggle(r.install_id, !r.hidden)}>{r.hidden ? "Show" : "Hide"}</Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button variant="secondary" disabled={page * PAGE_SIZE >= total} onClick={() => setPage(page + 1)}>Next</Button>
            <span role="status">{showing(page, PAGE_SIZE, total, list.data.items.length)}</span>
          </div>
        </>
      )}
    </>
  );
}
