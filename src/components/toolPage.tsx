// Pieces shared by the free-tool pages (/groundhog, /burn).
import { type ReactNode, useRef, useState } from "react";
import { Button } from "./ui";
import { APP_URL, CONTACT_EMAIL } from "../data/groundhogCopy";

export const chip = "rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-ink";

export function useCopy(text: string) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 2000); } catch { /* the text can still be selected by hand */ }
  };
  return { done, copy };
}

/** The main install command: a terminal-style box with the copy button inside it. */
export function InstallBox({ cmd }: { cmd: string }) {
  const { done, copy } = useCopy(cmd);
  return (
    <div className="flex items-center gap-2 rounded-xl bg-ink p-2 pl-4 shadow-lg ring-1 ring-black/5">
      <code className="min-w-0 flex-1 break-words py-2 font-mono text-sm text-white sm:whitespace-nowrap sm:text-[15px]">
        <span className="select-none text-slate-500">$ </span>{cmd}
      </code>
      <button type="button" onClick={() => void copy()} aria-label={`Copy: ${cmd}`}
        className="min-h-10 shrink-0 rounded-lg bg-white/10 px-3 text-sm font-semibold text-white hover:bg-white/20">
        {done ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

/** Smaller command line used inside the fold-outs. */
export function CopyLine({ cmd }: { cmd: string }) {
  const { done, copy } = useCopy(cmd);
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1.5 pl-3">
      <code className="min-w-0 flex-1 break-all py-1 font-mono text-[13px] leading-relaxed text-ink">{cmd}</code>
      <button type="button" onClick={() => void copy()} aria-label={`Copy: ${cmd}`}
        className="min-h-9 shrink-0 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
        {done ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export function Fold({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group border-b border-slate-200">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 font-semibold text-ink [&::-webkit-details-marker]:hidden">
        {title}
        <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180"><path fill="currentColor" d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z" /></svg>
      </summary>
      <div className="space-y-4 pb-5 text-sm text-slate-700">{children}</div>
    </details>
  );
}

/** A window frame (terminal or browser) around the example output. */
export function Frame({ label, dark, children }: { label: string; dark?: boolean; children: ReactNode }) {
  return (
    <div className={`overflow-hidden rounded-xl shadow-lg ring-1 ${dark ? "bg-ink ring-black/10" : "bg-white ring-slate-200"}`}>
      <div className={`flex items-center gap-1.5 px-4 py-2.5 ${dark ? "border-b border-white/10" : "border-b border-slate-200 bg-slate-50"}`} aria-hidden="true">
        {[0, 1, 2].map((i) => <span key={i} className={`size-2.5 rounded-full ${dark ? "bg-white/20" : "bg-slate-300"}`} />)}
        <span className={`ml-2 font-mono text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{label}</span>
      </div>
      {children}
    </div>
  );
}

export function TryDialog() {
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
