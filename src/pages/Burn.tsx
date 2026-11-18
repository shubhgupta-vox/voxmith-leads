import { Link } from "react-router-dom";
import { CopyLine, Fold, Frame, InstallBox, TryDialog, chip } from "../components/toolPage";
import { COMMANDS, INSTALL, PRIVACY_LIST, RULES, SAMPLE } from "../data/burnCopy";
import { TOO_OLD } from "../data/groundhogCopy";

/** What the terminal prints (burn.py summary), built only from SAMPLE so it cannot drift. */
function TerminalSummary() {
  const s = SAMPLE;
  const w = Math.max(...s.top.map((t) => t[1].length));
  return (
    <Frame label="claude" dark>
      <div className="relative overflow-x-auto" tabIndex={0} role="region" aria-label="Example terminal output, scrolls sideways on small screens">
        <pre className="w-max min-w-full p-4 font-mono text-[13px] leading-relaxed text-slate-200 sm:p-5">
          <span className="text-slate-500">&gt; /burn:burn</span>{"\n\n"}
          <span className="font-bold text-white">Burn  ({s.agents}, whole device)</span>{"\n\n"}
          {"Resolution rate     "}<span className="font-bold text-emerald-300">{s.rate}%</span>{`   (${s.resolved} of ${s.counted} sessions judged)\n`}
          {"Failed sessions     "}<span className="font-bold text-orange-300">{s.share}% of your usage</span>{`   (${s.burned} at API prices, ${s.burnedTokens} tokens)\n`}
          {"Cost per resolved   "}<span className="font-bold text-white">{s.perResolved}</span>{" at API prices\n\n"}
          <span className="font-bold text-white">Most expensive failed sessions</span>{"\n"}
          {s.top.map(([d, p, c, why, name]) => `  ${d.padEnd(6)}  ${p.padEnd(w)}  ${c.padStart(9)}  ${why}\n          "${name}"\n`).join("")}
          {"\n"}
          <span className="text-slate-400">{`Your current session is not counted.
${s.tooShort} sessions were too short to judge (under 2 messages from you). Their cost is in the totals.
Claude Code history starts ${s.historyStart} (Claude Code keeps about 30 days by default).
Why API prices: it's what these tokens cost pay-as-you-go, one public price list for everyone, so
numbers compare across people and plans. On a subscription you paid a flat fee instead, not this.
Full report opened in your browser.`}</span>
        </pre>
      </div>
    </Frame>
  );
}

const STEPS: [string, string][] = [
  ["Reads your history", "Goes through your sessions on your own computer: Claude Code history in Claude Code, Codex history in Codex. Your current session is left out."],
  ["Judges every session", "Fixed rules, not an AI guess, mark the sessions where you corrected the agent, repeated yourself or gave up. Same computer, same answer."],
  ["Adds up the cost", "Counts each session's tokens once and prices them at API rates: your resolution rate, what failures burned, and the cost per resolved session."],
];

export default function Burn() {
  return (
    <div className="fade-in">
      <section className="border-b border-slate-200 bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-3xl space-y-6 px-4 pb-12 pt-12 sm:pt-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-dark">Burn &middot; a free Claude Code skill</p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">What did your coding agent&rsquo;s failures cost you?</h1>
          <p className="max-w-2xl text-lg text-slate-700">Burn finds the sessions where you corrected your agent, repeated yourself or gave up, and adds up what they cost. You get your resolution rate, how much of your usage went to failed sessions, and the cost per resolved session.</p>
          <div className="space-y-3 pt-2">
            <InstallBox cmd={INSTALL.oneLine} />
            <p className="text-sm text-slate-600">Run it in your terminal, then open Claude Code and type <code className={chip}>/burn:burn</code>. Using Codex? See &ldquo;Other ways to install&rdquo;.</p>
            <p><Link to="/burn/leaderboard" className="text-sm font-semibold text-brand-dark hover:underline">See the leaderboard &rarr;</Link></p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl space-y-16 px-4 py-14">
        <section aria-labelledby="how">
          <h2 id="how" className="text-2xl font-semibold tracking-tight">How it works</h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-3">
            {STEPS.map(([h, b], i) => (
              <li key={h} className="border-t-2 border-slate-200 pt-4">
                <p className="font-mono text-xs font-semibold text-slate-400">STEP {i + 1}</p>
                <h3 className="mt-1 font-semibold">{h}</h3>
                <p className="mt-1 text-sm text-slate-600">{b}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-label="More details" className="border-t border-slate-200">
          <Fold title="What counts as a failed session">
            <p>A session is judged when you wrote at least 2 messages in it. It failed if any of these is true:</p>
            <dl className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200">
              {RULES.map(([k, v]) => (
                <div key={k} className="grid gap-1 px-3 py-2.5 sm:grid-cols-[10rem_1fr] sm:gap-4"><dt className="font-semibold text-ink">{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
            <p>Shorter sessions are not judged, but their cost is in the totals. Your usage that went to failed sessions = their cost / the cost of all sessions. Cost per resolved session = total cost / resolved sessions.</p>
            <p>Why API prices: it is the one public price list everyone shares, so your numbers compare across people and plans. On a subscription (Claude Pro or Max, ChatGPT) you paid a flat fee instead, which is why Burn leads with the share of your usage, not dollars. A model with no published price is counted in tokens, never guessed.</p>
          </Fold>
          <Fold title="Other ways to install">
            <p>{TOO_OLD}</p>
            <div className="space-y-2">
              <p className="font-semibold text-ink">From inside Claude Code, one line at a time</p>
              {INSTALL.plugin.map((c) => <CopyLine key={c.which} cmd={c.cmd} />)}
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-ink">As a plain <code className={chip}>/burn</code> command, without the plugin</p>
              <CopyLine cmd={INSTALL.curl} />
              <p>Then restart Claude Code and type <code className={chip}>/burn</code>. Use one way only, not both.</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-ink">In Codex</p>
              <CopyLine cmd={INSTALL.codex} />
              <p>Then start Codex and type <code className={chip}>$burn</code>. In Codex, Burn reads only your Codex history; in Claude Code, only your Claude Code history.</p>
            </div>
          </Fold>
          <Fold title="Commands and options">
            <p>Type the command alone, or add one of these words after it. With the plain install it's <code className={chip}>/burn</code>.</p>
            <dl className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200">
              {COMMANDS.map((c) => (
                <div key={c.cmd || "plain"} className="grid gap-1 px-3 py-2.5 sm:grid-cols-[minmax(0,12rem)_1fr] sm:gap-4">
                  <dt className="min-w-0 font-mono text-[13px]"><span className="text-slate-400">/burn:burn</span><span className="font-semibold text-ink">{c.cmd}</span></dt>
                  <dd>{c.what}</dd>
                </div>
              ))}
            </dl>
          </Fold>
          <Fold title="Privacy">
            <ul className="list-disc space-y-2 pl-5">{PRIVACY_LIST.map((p) => <li key={p}>{p}</li>)}</ul>
          </Fold>
        </section>

        <section aria-labelledby="get" className="space-y-6">
          <div>
            <h2 id="get" className="text-2xl font-semibold tracking-tight">What you get</h2>
            <p className="mt-1 text-slate-600">An example result: a short summary in Claude Code, and a full report that opens in your browser. Failed sessions are listed by name with the command to reopen them, and there's a card you can share.</p>
          </div>
          <TerminalSummary />
          <Frame label="burn-report.html">
            <div className="max-h-[640px] overflow-y-auto overscroll-contain" tabIndex={0} role="region" aria-label="Example report, scrolls inside this window">
              <picture>
                <source media="(max-width: 640px)" srcSet="/burn/sample-report-mobile.png" width={390} height={3778} />
                <img src="/burn/sample-report.png" alt={`Example report: ${SAMPLE.rate}% resolution rate, ${SAMPLE.share}% of usage on failed sessions (${SAMPLE.burned} at API prices), ${SAMPLE.perResolved} per resolved session, then week by week, by project, by model, why sessions failed, the most expensive failed sessions by name and a share card.`} width={760} height={3147} loading="lazy" className="block h-auto w-full" />
              </picture>
            </div>
          </Frame>
        </section>

        <section className="on-dark rounded-2xl bg-ink px-6 py-10 text-center text-white">
          <h2 className="text-xl font-semibold">Burn is from VoxMith</h2>
          <p className="mx-auto mt-2 max-w-md text-slate-300">VoxMith shows teams where their customer-facing AI agents go wrong.</p>
          <div className="mt-5"><TryDialog /></div>
        </section>
      </div>
    </div>
  );
}
