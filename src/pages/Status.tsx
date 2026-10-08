import { useCallback, useEffect, useState } from "react";
import CodeForm from "../components/CodeForm";
import { Button, ErrorNote, LinkButton } from "../components/ui";
import { ApiError, type Status, api, clearToken, getToken, setToken } from "../lib/api";
import { DEMO_URL, LIMITS, POLL_MS, TALK_TO_US_MAILTO, TURNAROUND_FALLBACK } from "../lib/config";
import { fileLabel, isBad, leadMessage } from "../lib/stages";
import { fmtSize } from "../lib/validate";

/** Emailed links look like /status#t=<token>: store it and drop it from the address bar. */
function adoptTokenFromLink() {
  const m = /[#&]t=([\w-]+)/.exec(window.location.hash);
  if (m) { setToken(m[1]); history.replaceState(null, "", window.location.pathname); }
}

export default function StatusPage() {
  const [token, setTok] = useState<string | null>(() => { adoptTokenFromLink(); return getToken(); });
  const [s, setS] = useState<Status | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [gone, setGone] = useState<"unknown" | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try { setS(await api.status()); setErr(null); }
    catch (e) {
      if (e instanceof ApiError && e.status === 404) { clearToken(); setTok(null); setGone("unknown"); }
      else setErr(e instanceof ApiError ? e.message : "Could not load your status.");
    }
  }, []);

  useEffect(() => { if (token) void load(); }, [token, load]);
  useEffect(() => {
    if (s?.status !== "processing") return;
    const t = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(t);
  }, [s?.status, load]);

  if (!token) return (
    <div className="fade-in space-y-4">
      <h1 className="text-2xl font-bold">{gone === "unknown" ? "We couldn't find that submission" : "No submission on this device"}</h1>
      <p>Open the private link from your email to see its status, or start a new analysis.</p>
      <LinkButton to="/start">Start your analysis</LinkButton>
    </div>
  );
  if (!s) return <div className="space-y-3">{err ? <ErrorNote>{err}</ErrorNote> : <p aria-live="polite">Loading your status...</p>}</div>;

  const msg = leadMessage(s.status, s.expected_delivery || TURNAROUND_FALLBACK, s.files.some((f) => f.stage === "analysed"));
  const link = `${window.location.origin}/status#t=${token}`;

  return (
    <div className="fade-in space-y-8">
      <section aria-live="polite" className="space-y-2">
        <p className="text-sm text-slate-600">{s.company}</p>
        <h1 className="text-2xl font-bold">{msg.title}</h1>
        <p>{msg.body}</p>
      </section>

      {err && <ErrorNote>{err}</ErrorNote>}
      {s.status === "awaiting_verification" && <CodeForm email={s.email} onVerified={() => void load()} />}

      <section aria-labelledby="files" className="space-y-2">
        <h2 id="files" className="text-lg font-semibold">Your calls</h2>
        <ul className="space-y-2">
          {s.files.map((f) => (
            <li key={f.file_id} className="rounded-lg border border-slate-300 p-3">
              <div className="flex flex-wrap justify-between gap-2">
                <span className="min-w-0 truncate font-medium">{f.filename} <span className="text-sm font-normal text-slate-600">({fmtSize(f.size_bytes)})</span></span>
                <span className={`text-sm font-medium ${isBad(f.stage) ? "text-red-700" : ""}`}>{fileLabel(f.stage, f.uploaded)}</span>
              </div>
              {(f.reason || f.stage === "failed") && <p className="mt-1 text-sm text-red-700">{f.reason || "Something went wrong while processing this call."}</p>}
            </li>
          ))}
        </ul>
        {!s.files.length && <p className="text-sm text-slate-600">No calls on this submission.</p>}
      </section>

      <section className="space-y-3 rounded-xl bg-slate-50 p-4">
        <p>Have more than {LIMITS.maxFiles} calls? <a className="underline" href={TALK_TO_US_MAILTO}>Talk to us</a>.</p>
        <p>Want to see VoxMith on your live calls? <a className="underline" href={DEMO_URL}>Book a demo</a>.</p>
        <p className="text-sm text-slate-700">This page is private. Keep this link to come back: <Button variant="secondary" className="ml-1 min-h-9 px-3 py-1" onClick={() => { void navigator.clipboard?.writeText(link).then(() => setCopied(true)); }}>{copied ? "Copied" : "Copy private link"}</Button></p>
      </section>
    </div>
  );
}
