import { useEffect, useRef, useState } from "react";
import { ApiError, api } from "../lib/api";
import { RESEND_COOLDOWN_S, TURNSTILE_SITE_KEY } from "../lib/config";
import { fillCode } from "../lib/validate";
import Turnstile from "./Turnstile";
import { Button, ErrorNote } from "./ui";

export default function CodeForm({ email, onVerified }: { email: string; onVerified: () => void }) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);
  const [captcha, setCaptcha] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const put = (i: number, raw: string) => {
    const r = fillCode(digits, i, raw);
    setDigits(r.digits);
    boxes.current[r.focus]?.focus();
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < 6) { setErr("Enter all 6 digits."); return; }
    setBusy(true); setErr(null); setInfo(null);
    try {
      await api.verify(code);
      onVerified();
    } catch (x) {
      const m = x instanceof ApiError ? x.message : "Something went wrong. Please try again.";
      setErr(x instanceof ApiError && x.status === 410 ? `${m} Use "Send a new code" below.` : m);
      if (x instanceof ApiError && x.status === 400) { setDigits(Array(6).fill("")); boxes.current[0]?.focus(); }
    } finally { setBusy(false); }
  }

  async function resend() {
    setErr(null); setInfo(null);
    try {
      await api.resend(captcha);
      setInfo(`A new code is on its way to ${email}.`);
      setDigits(Array(6).fill(""));
      boxes.current[0]?.focus();
      setCooldown(RESEND_COOLDOWN_S);
      setCaptcha(""); setResetKey((k) => k + 1);
    } catch (x) {
      setErr(x instanceof ApiError ? x.message : "Could not send a new code.");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p>We sent a 6-digit code to <strong>{email}</strong>. We only start analysing after you confirm your email.</p>
      <div role="group" aria-label="6-digit code" className="flex gap-2">
        {digits.map((d, i) => (
          <input
            key={i} ref={(el) => { boxes.current[i] = el; }} value={d} autoFocus={i === 0}
            inputMode="numeric" autoComplete={i === 0 ? "one-time-code" : "off"} aria-label={`Digit ${i + 1}`}
            className="size-12 rounded-lg border border-slate-400 text-center text-xl"
            onChange={(e) => put(i, e.target.value)}
            onPaste={(e) => { e.preventDefault(); put(i, e.clipboardData.getData("text")); }}
            onKeyDown={(e) => { if (e.key === "Backspace" && !d && i > 0) boxes.current[i - 1]?.focus(); }}
          />
        ))}
      </div>
      {err && <ErrorNote>{err}</ErrorNote>}
      <p aria-live="polite" className="text-sm text-green-800">{info}</p>
      <Button type="submit" disabled={busy}>{busy ? "Checking..." : "Confirm email"}</Button>
      <div className="space-y-2 border-t border-slate-200 pt-4">
        <Turnstile onToken={setCaptcha} resetKey={resetKey} />
        <Button type="button" variant="secondary" onClick={resend} disabled={cooldown > 0 || (!!TURNSTILE_SITE_KEY && !captcha)}>
          {cooldown > 0 ? `Send a new code in ${cooldown}s` : "Send a new code"}
        </Button>
      </div>
    </form>
  );
}
