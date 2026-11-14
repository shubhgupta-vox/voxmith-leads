import { useRef, useState } from "react";
import { Button } from "../components/ui";
import { APP_URL, COMMANDS, CONTACT_EMAIL, INSTALL, PRIVACY_SHORT, SAMPLE, TOO_OLD } from "../data/groundhogCopy";

const chip = "rounded bg-slate-100 px-1 font-mono text-sm";

function CopyLine({ cmd }: { cmd: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(cmd); setDone(true); setTimeout(() => setDone(false), 2000); } catch { /* user can still select the text */ }
  };
  return (
    <div className="flex items-stretch gap-2">
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-lg bg-ink px-3 py-3 font-mono text-sm text-white">{cmd}</code>
      <Button variant="secondary" onClick={() => void copy()} className="shrink-0 px-3 text-sm" aria-label={`Copy: ${cmd}`}>{done ? "Copied" : "Copy"}</Button>
    </div>
  );
}

/** What the terminal prints (groundhog.py --summary), built only from SAMPLE so it cannot drift. */
function TerminalSummary() {
  const s = SAMPLE;
  return (
    <div className="relative overflow-x-auto rounded-xl bg-ink text-slate-100" tabIndex={0} role="region" aria-label="Sample terminal output, scrolls sideways on small screens">
      <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5" aria-hidden="true">
        <span className="size-2.5 rounded-full bg-white/25" /><span className="size-2.5 rounded-full bg-white/25" /><span className="size-2.5 rounded-full bg-white/25" />
        <span className="ml-2 font-mono text-xs text-slate-400">claude</span>
      </div>
      <div className="w-max min-w-full space-y-3 p-4 font-mono text-[13px] leading-relaxed sm:p-5">
        <p className="text-slate-400">&gt; /groundhog:groundhog all</p>
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
  const linkCls = "inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2 font-semibold text-slate-800 hover:bg-slate-50";
  return (
    <>
      <Button onClick={() => { ref.current?.showModal(); }}>Try VoxMith free</Button>
      <dialog ref={ref} aria-labelledby="try-title" className="m-auto w-[min(92vw,22rem)] rounded-xl p-5 text-ink shadow-xl backdrop:bg-black/50">
        <h2 id="try-title" className="text-lg font-semibold">Try VoxMith free</h2>
        <div className="mt-4 space-y-3">
          <a className={`${linkCls} !bg-brand !text-white hover:!bg-brand-dark !border-brand`} href={APP_URL} target="_blank" rel="noopener">Open the app</a>
          <a className={linkCls} href={`mailto:${CONTACT_EMAIL}`}>Contact us</a>
          <Button variant="secondary" className="w-full" onClick={() => ref.current?.close()}>Close</Button>
        </div>
      </dialog>
    </>
  );
}

export default function Groundhog() {
  const [curl, setCurl] = useState(false);
  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-8 sm:py-12">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">What have you told your agent the most times?</h1>
        <p className="max-w-xl text-lg text-slate-700">It finds your most repeated instruction (“stop adding comments”, “don’t use any”), counts it, and writes the line to add to CLAUDE.md so you never have to say it again. That measures the problem and fixes it in one command, which is the VoxMith pitch in miniature.</p>
      </section>

      <section aria-labelledby="install" className="space-y-3">
        <h2 id="install" className="text-xl font-semibold">Install</h2>
        <p>Paste into Claude Code, one line at a time.</p>
        <div className="space-y-2">
          {INSTALL.plugin.map((c) => <CopyLine key={c.which} cmd={c.cmd} />)}
        </div>
        <p>Then type <code className={chip}>/groundhog:groundhog</code></p>
        <p className="text-sm text-slate-700">Type /plugin. If you see 'groundhog' in the list, you're done.</p>
        <p className="text-sm text-slate-700">{TOO_OLD}</p>
        <button type="button" aria-expanded={curl} aria-controls="curl-install" onClick={() => setCurl(!curl)} className="min-h-11 text-sm font-medium text-brand-dark underline">Prefer a plain /groundhog?</button>
        {curl && (
          <div id="curl-install" className="space-y-2">
            <CopyLine cmd={INSTALL.curl} />
            <p>Then restart Claude Code and type <code className={chip}>/groundhog</code></p>
          </div>
        )}
        <p className="rounded-lg bg-brand-50 p-3 text-sm text-slate-800">{PRIVACY_SHORT}</p>
      </section>

      <section aria-labelledby="commands" className="space-y-3">
        <h2 id="commands" className="text-xl font-semibold">Commands and options</h2>
        <p className="text-slate-700">Type the command alone, or add one of these words after it. With the plain install it's <code className={chip}>/groundhog</code> instead of <code className={chip}>/groundhog:groundhog</code>.</p>
        <dl className="divide-y divide-slate-200 rounded-xl border border-slate-200">
          {COMMANDS.map((c) => (
            <div key={c.cmd || "plain"} className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-4">
              <dt className="min-w-0 font-mono text-sm"><span className="text-slate-500">/groundhog:groundhog</span><span className="font-semibold text-brand-dark">{c.cmd}</span></dt>
              <dd className="text-sm text-slate-700">{c.what}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm text-slate-700">After the result, reply with the numbers of the lines you want. Groundhog asks where to put them (this project's CLAUDE.md, your personal one, or nowhere) and shows you the exact lines before it writes anything. Setting <code className={chip}>GROUNDHOG_NO_PING=1</code> or <code className={chip}>DO_NOT_TRACK=1</code> works like <code className={chip}>off</code>.</p>
      </section>

      <section aria-labelledby="sample" className="space-y-4">
        <h2 id="sample" className="text-xl font-semibold">What you get</h2>
        <span className="inline-block rounded bg-amber-100 px-2 py-1 text-sm font-medium text-amber-900">Sample result (made-up data)</span>
        <div className="space-y-2">
          <h3 className="font-semibold">In Claude Code</h3>
          <TerminalSummary />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">In your browser</h3>
          <p className="text-sm text-slate-700">A full report opens by itself. It's a file on your own computer and is never uploaded.</p>
          <picture>
            {/* Phone-width render of the same report, so the text stays readable on small screens. */}
            <source media="(max-width: 640px)" srcSet="/groundhog/sample-report-mobile.png" width={390} height={2420} />
            <img src="/groundhog/sample-report.png" alt="Sample report: 23 times 'Don't add comments to code I didn't ask you about', cost of 12 minutes and 46 extra messages, a weekly chart, the top 10 repeated instructions, where it happens most, and 5 lines for CLAUDE.md." width={760} height={2100} loading="lazy" className="h-auto w-full rounded-xl border border-slate-200 shadow-sm" />
          </picture>
        </div>
      </section>

      <section className="space-y-3 text-center">
        <TryDialog />
        <p className="text-sm text-slate-700">VoxMith shows teams where their customer-facing AI agents go wrong.</p>
      </section>
    </div>
  );
}
