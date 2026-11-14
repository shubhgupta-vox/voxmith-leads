import { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui";
import { APP_URL, CONTACT_EMAIL, INSTALL, PRIVACY_SHORT, SAMPLE, TOO_OLD, bar, barLen } from "../data/groundhogCopy";

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

/** Terminal-style card, built only from SAMPLE so it cannot drift from the shared copy. */
function SampleCard() {
  const s = SAMPLE;
  const topCount = s.top[0][1];
  const nameW = Math.max(...s.projects.map((p) => p[0].length));
  return (
    <figure className="mt-3">
      <figcaption className="mb-2 inline-block rounded bg-amber-100 px-2 py-1 text-sm font-medium text-amber-900">Sample result (made-up data)</figcaption>
      <div className="relative overflow-x-auto rounded-xl bg-ink p-4 text-slate-100 sm:p-5" tabIndex={0} role="region" aria-label="Sample result, scrolls sideways on small screens">
        <div className="w-max min-w-full space-y-4 font-mono text-[13px] leading-relaxed">
          <section>
            <p className="text-lg font-bold text-white">You've said this {s.count} times</p>
            <p className="mt-2 font-bold text-brand-200">"{s.quote}"</p>
            <p className="mt-2">{s.told}</p>
            <p>{s.sessions}</p>
          </section>
          <section>
            <p className="font-bold text-white">What it costs you</p>
            <p>About <b>{s.cost.minutes} minutes</b> and <b>{s.cost.messages} extra messages</b> {s.cost.detail}.</p>
            <p className="text-slate-400">{s.cost.assumption}</p>
          </section>
          <section>
            <p className="font-bold text-white">When you say it</p>
            <p>{s.weekly.range}</p>
            <pre className="mt-1">{s.weekly.spark}      {s.weekly.peak}</pre>
          </section>
          <section>
            <p className="font-bold text-white">Your top 10 repeated instructions</p>
            <table className="mt-1 text-left">
              <thead><tr className="text-slate-400"><th className="pr-3 font-normal">#</th><th className="pr-4 font-normal">Instruction</th><th className="pr-3 font-normal">Times</th><th className="pr-3 font-normal">Sessions</th><th className="font-normal"><span className="sr-only">Bar</span></th></tr></thead>
              <tbody>
                {s.top.map(([text, n, ses], i) => (
                  <tr key={text}><td className="pr-3">{i + 1}</td><td className="pr-4 whitespace-nowrap">{text}</td><td className="pr-3">{n}</td><td className="pr-3">{ses}</td><td aria-hidden="true" className="whitespace-nowrap text-brand-200">{bar(barLen(n, topCount))}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
          <section>
            <p className="font-bold text-white">Where it happens most</p>
            <pre>{s.projects.map(([p, blocks, n]) => `${p.padEnd(nameW)}  ${bar(blocks).padEnd(12)}  ${n}`).join("\n")}</pre>
          </section>
          <section>
            <p className="font-bold text-white">Add these to CLAUDE.md</p>
            <ol className="list-inside list-decimal">{s.lines.map((l) => <li key={l} className="whitespace-nowrap">{l}</li>)}</ol>
            <p className="mt-2 text-slate-400">Which ones should I add? Reply with numbers (like 1,2,5), "all" or "none".</p>
          </section>
        </div>
      </div>
    </figure>
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
        <p>Then type <code className="rounded bg-slate-100 px-1 font-mono text-sm">/groundhog:groundhog</code></p>
        <p className="text-sm text-slate-700">Type /plugin. If you see 'groundhog' in the list, you're done.</p>
        <p className="text-sm text-slate-700">{TOO_OLD}</p>
        <button type="button" aria-expanded={curl} aria-controls="curl-install" onClick={() => setCurl(!curl)} className="min-h-11 text-sm font-medium text-brand-dark underline">Prefer a plain /groundhog?</button>
        {curl && (
          <div id="curl-install" className="space-y-2">
            <CopyLine cmd={INSTALL.curl} />
            <p>Then restart Claude Code and type <code className="rounded bg-slate-100 px-1 font-mono text-sm">/groundhog</code></p>
          </div>
        )}
        <p className="rounded-lg bg-brand-50 p-3 text-sm text-slate-800">{PRIVACY_SHORT}</p>
      </section>

      <section aria-labelledby="sample">
        <h2 id="sample" className="text-xl font-semibold">What you get</h2>
        <SampleCard />
      </section>

      <section className="space-y-3 text-center">
        <TryDialog />
        <p className="text-sm text-slate-700">VoxMith shows teams where their customer-facing AI agents go wrong.</p>
      </section>
    </div>
  );
}
