import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LIMITS } from "../lib/config";

// Copy from www.voxmith.com (fetched 2026-11-16), reworded only to say "conversations"/"sessions", never "calls".
const APP_URL = "https://app.voxmith.com";
const BOOK_URL = "https://calendly.com/manvendra-singh-voxmith/30min";

const TOOLS: { to: string; tag: string; title: string; body: string; cta: string }[] = [
  {
    to: "/burn",
    tag: "Claude Code skill",
    title: "Burn: what did your coding agent's failures cost you?",
    body: "Finds the sessions where you corrected your agent, repeated yourself or gave up, and adds up what they cost: your resolution rate and how much of your usage went to failed sessions. Reads Claude Code and Codex history on your own computer.",
    cta: "Get Burn",
  },
  {
    to: "/analyze",
    tag: "Free analysis",
    title: "See how your agent really handles customers",
    body: `Upload up to ${LIMITS.maxFiles} production conversations (recordings or transcripts) and get a reviewed analysis PDF: what people ask for, where conversations go wrong, and what to fix first.`,
    cta: "Start your analysis",
  },
  {
    to: "/groundhog",
    tag: "Claude Code skill",
    title: "Groundhog: what have you told your agent the most times?",
    body: "Finds the instruction you repeat most to your coding agent, counts it, and writes the line for CLAUDE.md so you never say it again. Runs on your own computer.",
    cta: "Get Groundhog",
  },
];

const FEATURES: [string, string][] = [
  ["See every conversation", "Every voice and chat conversation captured and analysed the moment it ends. No sampling, no blind spots."],
  ["Catch every failure", "Hallucinations, workflow failures, policy violations, tool and API failures, drop-offs, escalations: flagged the moment they happen."],
  ["Ship what customers ask for", "Every conversation where your agent couldn't fulfil a request, categorised, quantified and prioritised. A product roadmap from real customers."],
  ["From failure to fix", "Every failure becomes a specific fix, tested against your real production sessions, with the before and after failure rate."],
];

const ext = "inline-flex min-h-11 items-center justify-center rounded-lg px-5 py-2 font-semibold";
const Ext = ({ href, primary, children }: { href: string; primary?: boolean; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noopener" className={`${ext} ${primary ? "bg-brand text-white hover:bg-brand-dark" : "border border-white/30 text-white hover:bg-white/10"}`}>{children}</a>
);

export default function Home() {
  return (
    <div className="fade-in">
      <section className="on-dark relative overflow-hidden bg-ink text-white">
        <img src="/brand/mark-white.png" alt="" aria-hidden="true" width={256} height={232} className="pointer-events-none absolute -right-10 top-1/2 hidden h-72 w-auto -translate-y-1/2 opacity-10 sm:block" />
        <div className="relative mx-auto max-w-3xl space-y-5 px-4 py-14 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-200">VoxMith</p>
          <h1 className="text-3xl font-bold leading-tight sm:text-5xl">Know exactly why users abandon your AI agent.</h1>
          <p className="max-w-xl text-lg text-slate-200">VoxMith traces every chat and voice conversation step by step, showing exactly where users drop off and why.</p>
          <div className="flex flex-wrap gap-3">
            <Ext href={APP_URL} primary>Get started</Ext>
            <Ext href={BOOK_URL}>Book a call</Ext>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl space-y-14 px-4 py-12">
        <section aria-labelledby="tools" className="space-y-4">
          <div>
            <h2 id="tools" className="text-2xl font-semibold">Free tools</h2>
            <p className="mt-1 text-slate-700">Try VoxMith's thinking on your own agents, free.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {TOOLS.map((t) => (
              <Link key={t.to} to={t.to} className="group flex flex-col rounded-xl border border-slate-200 p-5 shadow-sm transition-shadow hover:border-brand hover:shadow-md sm:first:col-span-2">
                <span className="self-start rounded bg-brand-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-brand-dark">{t.tag}</span>
                <h3 className="mt-3 text-lg font-semibold leading-snug">{t.title}</h3>
                <p className="mt-2 flex-1 text-sm text-slate-700">{t.body}</p>
                <span className="mt-4 font-semibold text-brand-dark group-hover:underline">{t.cta} &rarr;</span>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="what" className="space-y-4">
          <div>
            <h2 id="what" className="text-2xl font-semibold">Turn every conversation into an improvement</h2>
            <p className="mt-1 text-slate-700">Every production interaction observed, every failure diagnosed, every pattern learned, every fix verified on live traffic.</p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map(([h, b], i) => (
              <li key={h} className="rounded-xl bg-slate-50 p-5">
                <p className="font-mono text-sm font-semibold text-brand-dark">0{i + 1}</p>
                <h3 className="mt-1 font-semibold">{h}</h3>
                <p className="mt-1 text-sm text-slate-700">{b}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="on-dark rounded-xl bg-ink p-6 text-center text-white">
          <p className="text-lg font-semibold">See it on your own agents.</p>
          <p className="mt-1 text-sm text-slate-300">Lightweight integration. No infrastructure changes required.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Ext href={APP_URL} primary>Get started</Ext>
            <Ext href={BOOK_URL}>Book a call</Ext>
          </div>
        </section>
      </div>
    </div>
  );
}
