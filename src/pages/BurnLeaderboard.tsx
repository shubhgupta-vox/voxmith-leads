import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ErrorNote } from "../components/ui";
import { ApiError, type Board, type BoardAgent, type BoardMe, type BoardRow, api } from "../lib/api";
import { CONTACT_EMAIL } from "../data/groundhogCopy";

const FILTERS: [BoardAgent, string][] = [["all", "All"], ["claude", "Claude Code"], ["codex", "Codex"]];
const AGENT: Record<string, string> = { claude: "Claude Code", codex: "Codex", all: "Both" };

/** "2026-11-03" -> "Nov 3, 2026", parsed by hand so the viewer's timezone cannot shift the day. */
export function boardDate(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]} ${d}, ${y}`;
}

const TOKEN = /^[A-Za-z0-9_-]{8,40}$/;

/** "$414.59" from US cents; "-" when the skill didn't send it. */
export function usd(cents: number | null): string {
  if (cents == null) return "-";
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const th = "px-3 py-2.5 font-semibold";
const td = "px-3 py-3";

/** One table for both the top 100 and "Around you"; `mine` highlights the viewer's row. Same numbers as the
 * report's top cards: resolution rate, failed-session cost (and its share of usage), cost per resolved. */
function BoardTable({ rows, caption, mine }: { rows: BoardRow[]; caption: string; mine?: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-slate-50 align-bottom text-slate-600">
          <tr>
            <th scope="col" className={th}>#</th>
            <th scope="col" className={th}>Developer</th>
            <th scope="col" className={`${th} text-right`}>Score</th>
            <th scope="col" className={`${th} hidden text-right sm:table-cell`}>Resolution rate</th>
            <th scope="col" className={`${th} hidden text-right sm:table-cell`}>Spent on failed sessions</th>
            <th scope="col" className={`${th} hidden text-right md:table-cell`}>Cost per resolved</th>
            <th scope="col" className={`${th} hidden text-right lg:table-cell`}>Sessions</th>
            <th scope="col" className={`${th} hidden lg:table-cell`}>Agent</th>
            <th scope="col" className={`${th} hidden lg:table-cell`}>Last run</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const me = mine !== undefined && r.email === mine;
            const share = r.failed_share == null ? null : `${r.failed_share}% of usage`;
            return (
              <tr key={`${r.rank}-${r.email}`} id={me ? "me" : undefined} aria-current={me ? "true" : undefined}
                className={`border-t border-slate-200 ${me ? "bg-brand-50 font-semibold" : ""}`}>
                <td className={`${td} font-mono text-slate-500`}>{r.rank.toLocaleString()}</td>
                <th scope="row" className={`${td} break-all font-medium lg:whitespace-nowrap lg:break-normal`}>
                  {r.email}{me && <span className="ml-2 inline-block whitespace-nowrap rounded bg-brand px-1.5 py-0.5 text-xs font-semibold text-white [word-break:normal]">You</span>}
                  {/* Phones: the whole card in one line under the email. */}
                  <span className="mt-0.5 block text-xs font-normal text-slate-500 [word-break:normal] sm:hidden">
                    {r.resolution_rate}% resolved &middot; {usd(r.failed_cost_cents)} on failed{share ? ` (${share})` : ""} &middot; {usd(r.cost_per_resolved_cents)} per resolved &middot; {r.sessions_judged} sessions
                  </span>
                  <span className="mt-0.5 hidden text-xs font-normal text-slate-500 [word-break:normal] sm:block lg:hidden">
                    {r.sessions_judged.toLocaleString()} sessions{r.agent ? ` · ${AGENT[r.agent] ?? r.agent}` : ""}
                  </span>
                </th>
                <td className={`${td} text-right text-base font-bold`}>{r.score}</td>
                <td className={`${td} hidden text-right sm:table-cell`}>{r.resolution_rate}%</td>
                <td className={`${td} hidden text-right sm:table-cell`}>
                  <span className="block whitespace-nowrap">{usd(r.failed_cost_cents)}</span>
                  {share && <span className="block whitespace-nowrap text-xs font-normal text-slate-500">{share}</span>}
                </td>
                <td className={`${td} hidden whitespace-nowrap text-right md:table-cell`}>{usd(r.cost_per_resolved_cents)}</td>
                <td className={`${td} hidden text-right lg:table-cell`}>{r.sessions_judged.toLocaleString()}</td>
                <td className={`${td} hidden whitespace-nowrap lg:table-cell`}>{r.agent ? AGENT[r.agent] ?? r.agent : "-"}</td>
                <td className={`${td} hidden whitespace-nowrap lg:table-cell`}>{boardDate(r.last_run)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** The sticky "You" bar shown when the page is opened from your private link (?me=). */
function MeBar({ me }: { me: BoardMe }) {
  return (
    <div className="sticky top-2 z-10 rounded-xl bg-ink px-4 py-3 text-white shadow-lg" role="status">
      {me.ranked ? (
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p><span className="text-slate-300">You: </span><span className="text-lg font-bold">#{me.rank.toLocaleString()}</span> <span className="text-slate-300">of {me.of.toLocaleString()}</span></p>
          <p className="text-sm text-slate-200">Better than {me.better_than}% of Burn users &middot; score {me.score}</p>
          {me.rank > 100 && <a href="#around" className="text-sm font-semibold text-brand-200 underline">Around you &darr;</a>}
        </div>
      ) : (
        <p className="text-sm">{me.listed
          ? `Not ranked yet: you have ${me.sessions_judged ?? 0} judged sessions, the board needs ${me.min_sessions}. Keep using your agent and run /burn again.`
          : "Not on the board yet: your result goes public from your next /burn run."}</p>
      )}
    </div>
  );
}

export default function BurnLeaderboard() {
  const [params] = useSearchParams();
  const token = params.get("me") ?? "";
  const [me, setMe] = useState<BoardMe | null>(null);
  const [meError, setMeError] = useState<string | null>(null);
  useEffect(() => {
    if (!TOKEN.test(token)) return;
    let live = true;
    api.burnMe(token).then((m) => { if (live) setMe(m); },
      (e: unknown) => { if (live) setMeError(e instanceof ApiError ? e.message : "Couldn't find your spot. Please try again."); });
    return () => { live = false; };
  }, [token]);
  const mine = me?.ranked ? me.email : undefined;
  const [agent, setAgent] = useState<BoardAgent>("all");
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setBoard(null); setError(null);
    api.burnBoard(agent).then((b) => { if (live) setBoard(b); },
      (e: unknown) => { if (live) setError(e instanceof ApiError ? e.message : "Couldn't load the leaderboard. Please try again."); });
    return () => { live = false; };
  }, [agent]);

  return (
    <div className="fade-in">
      <section className="border-b border-slate-200 bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-5xl space-y-4 px-4 pb-10 pt-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-dark"><Link to="/burn" className="hover:underline">Burn</Link> &middot; leaderboard</p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Whose coding agent burned the least?</h1>
          <p className="max-w-2xl text-slate-700">Fewer failed sessions means less burned. Everyone who runs <Link to="/burn" className="font-semibold text-brand-dark underline">Burn</Link> with at least 20 judged sessions, ranked by a fair score. Self-reported by the Burn skill.</p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
        {me && <MeBar me={me} />}
        {meError && <ErrorNote>{meError}</ErrorNote>}
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Agent">
          {FILTERS.map(([k, label]) => (
            <button key={k} type="button" onClick={() => setAgent(k)} aria-pressed={agent === k}
              className={`min-h-10 rounded-full px-4 text-sm font-semibold ${agent === k ? "bg-ink text-white" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}>
              {label}
            </button>
          ))}
          {board && <span className="ml-auto text-sm text-slate-600" role="status">{board.total_ranked.toLocaleString()} ranked</span>}
        </div>

        {error && <ErrorNote>{error}</ErrorNote>}
        {!board && !error && <p role="status">Loading...</p>}
        {board && board.rows.length === 0 && (
          <p className="rounded-xl border border-slate-200 p-6 text-center text-slate-700">Nobody is ranked here yet. Run <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em]">/burn</code> with 20+ judged sessions to be first.</p>
        )}
        {board && board.rows.length > 0 && <BoardTable rows={board.rows} caption={`Burn leaderboard, top ${board.rows.length}`} mine={mine} />}

        {me?.ranked && agent === "all" && me.rank > (board?.rows.length ?? 100) && (
          <section id="around" aria-labelledby="around-h" className="space-y-3 scroll-mt-20">
            <h2 id="around-h" className="text-lg font-semibold">Around you</h2>
            <BoardTable rows={me.around} caption="The people ranked just above and below you" mine={mine} />
          </section>
        )}

        {!me && board && board.total_ranked > board.rows.length && (
          <p className="text-sm text-slate-600">Showing the top {board.rows.length} of {board.total_ranked.toLocaleString()}. Not in the list? Open the link Burn prints after each run: it takes you to your spot.</p>
        )}

        <section aria-labelledby="score" className="space-y-2 text-sm text-slate-700">
          <h2 id="score" className="text-lg font-semibold text-ink">How the score works</h2>
          <p>Resolution rate is resolved sessions out of judged sessions. A few lucky sessions would win on that alone, so the board ranks by a cautious score: the lowest resolution rate your history still supports with 95% confidence (the Wilson lower bound). 180 of 200 resolved scores 85; a perfect 20 of 20 scores 84. You need at least {board?.min_sessions ?? 20} judged sessions to be ranked. Each person appears once, with their latest run.</p>
          <p>Money is at API prices (the public pay-as-you-go price list), the same numbers as the cards at the top of your Burn report: what your failed sessions cost, their share of your usage, and your cost per resolved session. On a subscription you paid a flat fee instead. Numbers are self-reported by the Burn skill from local history; we remove rows that look fake.</p>
          <p>Want off the board? Run <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em]">/burn off</code> or email <a className="text-brand-dark underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
        </section>

        <p><Link to="/burn" className="font-semibold text-brand-dark hover:underline">Get Burn and see your own number &rarr;</Link></p>
      </div>
    </div>
  );
}
