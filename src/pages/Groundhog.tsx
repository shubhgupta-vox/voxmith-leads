import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { APP_URL, COMMANDS, CONTACT_EMAIL, INSTALL, PRIVACY_SHORT, SAMPLE, TOO_OLD } from "../data/groundhogCopy";

// The whole page is dark (its own shell, outside the light Public layout). `on-dark` swaps the focus ring.
const btn = "inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 font-semibold transition-colors";
const darkBtn = `${btn} border border-white/15 bg-white/10 text-white hover:bg-white/20`;
const brandBtn = `${btn} bg-brand text-white hover:bg-brand-dark`;
const chip = "rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.9em] text-white";

function CopyLine({ cmd }: { cmd: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(cmd); setDone(true); setTimeout(() => setDone(false), 2000); } catch { /* user can still select the text */ }
  };
  return (
    <div className="flex items-stretch gap-2">
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-lg border border-white/10 bg-black/30 px-3 py-3 font-mono text-sm text-white">{cmd}</code>
      <button type="button" onClick={() => void copy()} className={`${darkBtn} shrink-0 px-3 text-sm`} aria-label={`Copy: ${cmd}`}>{done ? "Copied" : "Copy"}</button>
    </div>
  );
}

/** What the terminal prints (groundhog.py --summary), built only from SAMPLE so it cannot drift. */
function TerminalSummary() {
  const s = SAMPLE;
  return (
    <div className="relative overflow-x-auto rounded-xl border border-white/10 bg-black/40" tabIndex={0} role="region" aria-label="Sample terminal output, scrolls sideways on small screens">
      <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5" aria-hidden="true">
        <span className="size-2.5 rounded-full bg-white/20" /><span className="size-2.5 rounded-full bg-white/20" /><span className="size-2.5 rounded-full bg-white/20" />
        <span className="ml-2 font-mono text-xs text-slate-500">claude</span>
      </div>
      <div className="w-max min-w-full space-y-3 p-4 font-mono text-[13px] leading-relaxed text-slate-200 sm:p-5">
        <p className="text-slate-500">&gt; /groundhog:groundhog all</p>
        <p className="text-base font-bold text-white">You've said this {s.count} times</p>
        <p className="border-l-2 border-brand pl-3 font-bold text-brand-200">"{s.quote}"</p>
        <p>Told {s.count} times across {s.projects.length} projects since {s.since}. About {s.cost.minutes} minutes and {s.cost.messages} extra messages.<br />Full report: opened in your browser.</p>
        <div>
          <p className="font-bold text-white">Lines for CLAUDE.md:</p>
          <ol className="list-inside list-decimal">{s.lines.map((l) => <li key={l} className="whitespace-nowrap"><span className="text-brand-200">{l}</span></li>)}</ol>
        </div>
        <p className="text-slate-400">Which ones should I add? Reply with numbers (like 1,2,5), "all" or "none".</p>
      </div>
    </div>
  );
}

function TryDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className={`${brandBtn} px-6`} onClick={() => ref.current?.showModal()}>Try VoxMith free</button>
      <dialog ref={ref} aria-labelledby="try-title" className="on-dark m-auto w-[min(92vw,22rem)] rounded-xl border border-white/10 bg-ink-soft p-5 text-white shadow-xl backdrop:bg-black/60">
        <h2 id="try-title" className="text-lg font-semibold">Try VoxMith free</h2>
        <div className="mt-4 space-y-3">
          <a className={`${brandBtn} w-full`} href={APP_URL} target="_blank" rel="noopener">Open the app</a>
          <a className={`${darkBtn} w-full`} href={`mailto:${CONTACT_EMAIL}`}>Contact us</a>
          <button type="button" className={`${darkBtn} w-full`} onClick={() => ref.current?.close()}>Close</button>
        </div>
      </dialog>
    </>
  );
}

const H2 = ({ id, children }: { id: string; children: string }) => <h2 id={id} className="text-xl font-semibold text-white">{children}</h2>;

export default function Groundhog() {
  const [curl, setCurl] = useState(false);
  return (
    <div className="on-dark flex min-h-screen flex-col bg-ink text-slate-300">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:m-2 focus:rounded focus:bg-ink-soft focus:p-2 focus:text-white">Skip to content</a>
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-3xl items-center px-4 py-3">
          <Link to="/" aria-label="VoxMith home"><img src="/brand/wordmark-white.png" alt="VoxMith" width={148} height={36} className="h-8 w-auto" /></Link>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-3xl flex-1 space-y-12 px-4 py-10 sm:py-14">
        <section className="space-y-4">
          <p className="font-mono text-sm font-semibold uppercase tracking-wider text-brand-200">Groundhog</p>
          <h1 className="text-3xl font-bold leading-tight text-white sm:text-5xl">What have you told your agent the most times?</h1>
          <p className="max-w-2xl text-lg">It finds your most repeated instruction (“stop adding comments”, “don’t use any”), counts it, and writes the line to add to CLAUDE.md so you never have to say it again. That measures the problem and fixes it in one command, which is the VoxMith pitch in miniature.</p>
        </section>

        <section aria-labelledby="install" className="space-y-3">
          <H2 id="install">Install</H2>
          <p>Paste into Claude Code, one line at a time.</p>
          <div className="space-y-2">
            {INSTALL.plugin.map((c) => <CopyLine key={c.which} cmd={c.cmd} />)}
          </div>
          <p>Then type <code className={chip}>/groundhog:groundhog</code></p>
          <p className="text-sm text-slate-400">Type /plugin. If you see 'groundhog' in the list, you're done.</p>
          <p className="text-sm text-slate-400">{TOO_OLD}</p>
          <button type="button" aria-expanded={curl} aria-controls="curl-install" onClick={() => setCurl(!curl)} className="min-h-11 text-sm font-medium text-brand-200 underline">Prefer a plain /groundhog?</button>
          {curl && (
            <div id="curl-install" className="space-y-2">
              <CopyLine cmd={INSTALL.curl} />
              <p>Then restart Claude Code and type <code className={chip}>/groundhog</code></p>
            </div>
          )}
          <p className="rounded-lg border border-brand/30 bg-brand/10 p-3 text-sm text-slate-200">{PRIVACY_SHORT}</p>
        </section>

        <section aria-labelledby="commands" className="space-y-3">
          <H2 id="commands">Commands and options</H2>
          <p>Type the command alone, or add one of these words after it. With the plain install it's <code className={chip}>/groundhog</code> instead of <code className={chip}>/groundhog:groundhog</code>.</p>
          <dl className="divide-y divide-white/10 rounded-xl border border-white/10 bg-ink-soft">
            {COMMANDS.map((c) => (
              <div key={c.cmd || "plain"} className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-4">
                <dt className="min-w-0 font-mono text-sm text-white"><span className="text-slate-500">/groundhog:groundhog</span><span className="font-semibold text-brand-200">{c.cmd}</span></dt>
                <dd className="text-sm">{c.what}</dd>
              </div>
            ))}
          </dl>
          <p className="text-sm text-slate-400">After the result, reply with the numbers of the lines you want. Groundhog asks where to put them (this project's CLAUDE.md, your personal one, or nowhere) and shows you the exact lines before it writes anything. Setting <code className={chip}>GROUNDHOG_NO_PING=1</code> or <code className={chip}>DO_NOT_TRACK=1</code> works like <code className={chip}>off</code>.</p>
        </section>

        <section aria-labelledby="sample" className="space-y-4">
          <H2 id="sample">What you get</H2>
          <span className="inline-block rounded bg-amber-400/15 px-2 py-1 text-sm font-medium text-amber-200">Sample result (made-up data)</span>
          <div className="space-y-2">
            <h3 className="font-semibold text-white">In Claude Code</h3>
            <TerminalSummary />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-white">In your browser</h3>
            <p className="text-sm text-slate-400">A full report opens by itself. It's a file on your own computer and is never uploaded.</p>
            <picture>
              {/* Phone-width render of the same report, so the text stays readable on small screens. */}
              <source media="(max-width: 640px)" srcSet="/groundhog/sample-report-mobile.png" width={390} height={2420} />
              <img src="/groundhog/sample-report.png" alt="Sample report: 23 times 'Don't add comments to code I didn't ask you about', cost of 12 minutes and 46 extra messages, a weekly chart, the top 10 repeated instructions, where it happens most, and 5 lines for CLAUDE.md." width={760} height={2100} loading="lazy" className="h-auto w-full rounded-xl border border-white/10" />
            </picture>
          </div>
        </section>

        <section className="space-y-3 text-center">
          <TryDialog />
          <p className="text-sm text-slate-400">VoxMith shows teams where their customer-facing AI agents go wrong.</p>
        </section>
      </main>

      <footer className="border-t border-white/10 py-5">
        <div className="mx-auto flex max-w-3xl items-center justify-center gap-2 px-4 text-sm text-slate-400">
          <img src="/brand/mark-white.png" alt="" width={22} height={20} className="h-5 w-auto" />
          VoxMith conversation analysis
        </div>
      </footer>
    </div>
  );
}
