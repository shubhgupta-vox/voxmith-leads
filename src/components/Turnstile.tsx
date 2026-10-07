import { useEffect, useRef } from "react";
import { TURNSTILE_SITE_KEY } from "../lib/config";

type TS = { render: (el: HTMLElement, o: Record<string, unknown>) => string; reset: (id?: string) => void; remove: (id?: string) => void };
declare global { interface Window { turnstile?: TS } }

const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let loading: Promise<void> | null = null;
const load = () => (loading ??= new Promise<void>((ok, fail) => {
  const s = document.createElement("script");
  s.src = SRC; s.async = true; s.onload = () => ok(); s.onerror = () => { loading = null; fail(); };
  document.head.appendChild(s);
}));

/** Cloudflare Turnstile widget. Renders nothing when no site key is configured (token stays ""). */
export default function Turnstile({ onToken, resetKey = 0 }: { onToken: (t: string) => void; resetKey?: number }) {
  const el = useRef<HTMLDivElement>(null);
  const id = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !el.current) return;
    let dead = false;
    load().then(() => {
      if (dead || !el.current || !window.turnstile) return;
      id.current = window.turnstile.render(el.current, {
        sitekey: TURNSTILE_SITE_KEY, callback: onToken,
        "expired-callback": () => onToken(""), "error-callback": () => onToken(""),
      });
    }).catch(() => onToken(""));
    return () => { dead = true; if (id.current) window.turnstile?.remove(id.current); id.current = undefined; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { if (resetKey && id.current) window.turnstile?.reset(id.current); }, [resetKey]);
  return TURNSTILE_SITE_KEY ? <div ref={el} aria-label="Bot check" /> : null;
}
