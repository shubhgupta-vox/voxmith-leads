/** Calm info block for metrics a recording cannot give: they come from traces, so we show this instead of a number. */
export const NEEDS_CONNECTION_TEXT = "Claimed actions with no matching tool call, tool errors, response latency and cost per call are measured from traces, not from audio. Connect the agent with OpenTelemetry (or a supported framework) to get them.";

const ITEMS = ["Claimed actions vs tool calls", "Tool failures and errors", "Response latency (p95)", "LLM cost per call and per resolved call"];

export default function NeedsConnection({ className = "" }: { className?: string }) {
  return (
    <aside aria-label="Needs a live connection" className={`rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm text-ink ${className}`}>
      <h3 className="font-semibold">Needs a live connection</h3>
      <p className="mt-1 max-w-prose">{NEEDS_CONNECTION_TEXT}</p>
      <details className="mt-2">
        <summary className="cursor-pointer font-medium text-brand-dark">What needs a connection</summary>
        <ul className="mt-1 list-disc pl-5">{ITEMS.map((t) => <li key={t}>{t}</li>)}</ul>
      </details>
    </aside>
  );
}
