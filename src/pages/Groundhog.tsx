import { CopyLine, Fold, Frame, InstallBox, TryDialog, chip } from "../components/toolPage";
import { COMMANDS, INSTALL, SAMPLE, TOO_OLD } from "../data/groundhogCopy";

/** What the terminal prints (groundhog.py --summary), built only from SAMPLE so it cannot drift. */
function TerminalSummary() {
  const s = SAMPLE;
  return (
    <Frame label="claude" dark>
      <div className="relative overflow-x-auto" tabIndex={0} role="region" aria-label="Example terminal output, scrolls sideways on small screens">
        <div className="w-max min-w-full space-y-3 p-4 font-mono text-[13px] leading-relaxed text-slate-200 sm:p-5">
          <p className="text-slate-500">&gt; /groundhog:groundhog all</p>
          <p className="text-base font-bold text-white">You've said this {s.count} times</p>
          <p className="border-l-2 border-brand pl-3 font-bold text-brand-200">"{s.quote}"</p>
          <p>Told {s.count} times across {s.projects.length} projects since {s.since}. About {s.cost.minutes} minutes and {s.cost.messages} extra messages.<br />Full report: opened in your browser.</p>
          <div>
            <p className="font-bold text-white">Lines for CLAUDE.md:</p>
            <ol className="list-inside list-decimal">{s.lines.map((l) => <li key={l} className="whitespace-nowrap"><span className="text-brand-200">{l}</span></li>)}</ol>
          </div>
          <p className="text-slate-500">Which ones should I add? Reply with numbers (like 1,2,5), "all" or "none".</p>
        </div>
      </div>
    </Frame>
  );
}

const STEPS: [string, string][] = [
  ["Reads your history", "Goes through your Claude Code sessions on your own computer and picks out what you told the agent to do, or not do."],
  ["Groups and counts", "Your own Claude session groups the rewordings (“no comments”, “stop adding comments”) and counts how often each one came up."],
  ["Writes the fix", "Turns your top instructions into CLAUDE.md lines, shows them to you, and adds only the ones you pick."],
];

export default function Groundhog() {
  return (
    <div className="fade-in">
      <section className="border-b border-slate-200 bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-3xl space-y-6 px-4 pb-12 pt-12 sm:pt-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-dark">Groundhog &middot; a free Claude Code skill</p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">What have you told your agent the most times?</h1>
          <p className="max-w-2xl text-lg text-slate-700">It finds your most repeated instruction (&ldquo;stop adding comments&rdquo;, &ldquo;don&rsquo;t use any&rdquo;), counts it, and writes the line to add to CLAUDE.md so you never have to say it again.</p>
          <div className="space-y-3 pt-2">
            <InstallBox cmd={INSTALL.oneLine} />
            <p className="text-sm text-slate-600">Run it in your terminal, then open Claude Code and type <code className={chip}>/groundhog:groundhog</code></p>
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
          <Fold title="Other ways to install">
            <p>{TOO_OLD}</p>
            <div className="space-y-2">
              <p className="font-semibold text-ink">From inside Claude Code, one line at a time</p>
              {INSTALL.plugin.map((c) => <CopyLine key={c.which} cmd={c.cmd} />)}
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-ink">As a plain <code className={chip}>/groundhog</code> command, without the plugin</p>
              <CopyLine cmd={INSTALL.curl} />
              <p>Then restart Claude Code and type <code className={chip}>/groundhog</code>. Use one way only, not both.</p>
            </div>
          </Fold>
          <Fold title="Commands and options">
            <p>Type the command alone, or add one of these words after it. With the plain install it's <code className={chip}>/groundhog</code>.</p>
            <dl className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200">
              {COMMANDS.map((c) => (
                <div key={c.cmd || "plain"} className="grid gap-1 px-3 py-2.5 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-4">
                  <dt className="min-w-0 font-mono text-[13px]"><span className="text-slate-400">/groundhog:groundhog</span><span className="font-semibold text-ink">{c.cmd}</span></dt>
                  <dd>{c.what}</dd>
                </div>
              ))}
            </dl>
            <p>After the result, reply with the numbers of the lines you want. Groundhog asks where to put them and shows you the exact lines before it writes anything.</p>
          </Fold>
        </section>

        <section aria-labelledby="get" className="space-y-6">
          <div>
            <h2 id="get" className="text-2xl font-semibold tracking-tight">What you get</h2>
            <p className="mt-1 text-slate-600">An example result: a short summary in Claude Code, and a full report that opens in your browser.</p>
          </div>
          <TerminalSummary />
          <Frame label="groundhog-report.html">
            {/* The whole report, scrolling inside its own window so the page does not become one long screenshot. */}
            <div className="max-h-[640px] overflow-y-auto overscroll-contain" tabIndex={0} role="region" aria-label="Example report, scrolls inside this window">
            <picture>
              {/* Phone-width render of the same report, so the text stays readable on small screens. */}
              <source media="(max-width: 640px)" srcSet="/groundhog/sample-report-mobile.png" width={390} height={2361} />
              <img src="/groundhog/sample-report.png" alt="Example report: 23 times 'Don't add comments to code I didn't ask you about', 12 minutes and 46 extra messages, a weekly chart, the top 10 repeated instructions, where it happens most, and 5 lines for CLAUDE.md." width={760} height={2154} loading="lazy" className="block h-auto w-full" />
            </picture>
            </div>
          </Frame>
        </section>

        <section className="on-dark rounded-2xl bg-ink px-6 py-10 text-center text-white">
          <h2 className="text-xl font-semibold">Groundhog is from VoxMith</h2>
          <p className="mx-auto mt-2 max-w-md text-slate-300">VoxMith shows teams where their customer-facing AI agents go wrong.</p>
          <div className="mt-5"><TryDialog /></div>
        </section>
      </div>
    </div>
  );
}
