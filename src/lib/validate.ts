import { LIMITS } from "./config";

const EXT_TYPES: Record<string, string> = { mp3: "audio/mpeg", wav: "audio/wav", m4a: "audio/mp4", txt: "text/plain", json: "application/json" };
const ALLOWED_MIME = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/x-m4a", "audio/m4a", "text/plain", "application/json"];

const ext = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

/** Transcripts (txt/json) are text; everything else is a recording. */
export const isTranscript = (f: { name: string }) => ext(f.name) === "txt" || ext(f.name) === "json";

/** Content type to send to the presign endpoint (contract whitelist), or null if unsupported. */
export function contentTypeFor(f: { name: string; type: string }): string | null {
  if (!(ext(f.name) in EXT_TYPES)) return null;
  return ALLOWED_MIME.includes(f.type) ? f.type : EXT_TYPES[ext(f.name)];
}

/** Returns a human error, or null when the file may be queued. `existing` = how many files are already in the list. */
export function validateFile(f: { name: string; type: string; size: number }, existing: number): string | null {
  if (existing >= LIMITS.maxFiles) return `You can upload up to ${LIMITS.maxFiles} conversations.`;
  if (!contentTypeFor(f)) return "Unsupported format. Use mp3, wav or m4a for calls, or txt or json for transcripts.";
  if (f.size === 0) return "This file is empty.";
  if (isTranscript(f) && f.size > LIMITS.maxTranscriptKb * 1024) return `Too large (${Math.round(f.size / 1024)} KB). The limit is ${LIMITS.maxTranscriptKb} KB per transcript.`;
  if (f.size > LIMITS.maxMb * 1024 * 1024) return `Too large (${(f.size / 1048576).toFixed(0)} MB). The limit is ${LIMITS.maxMb} MB per recording.`;
  return null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Start-page details errors by field (empty object = ok). Every field is required. No consent field: the notice above the button is the consent. */
export function validateStart(f: { name: string; email: string; company: string; desc: string }, fileCount: number): Record<string, string> {
  const er: Record<string, string> = {};
  if (!f.name.trim()) er.name = "Enter your name.";
  if (!EMAIL.test(f.email.trim())) er.email = "Enter a valid work email.";
  if (!f.company.trim()) er.company = "Enter your company.";
  if (!f.desc.trim()) er.desc = "Tell us what your agent does.";
  if (!fileCount) er.files = "Add at least one conversation.";
  return er;
}

export const countLabel = (n: number, max = LIMITS.maxFiles) => `${n} of ${max}`;
export const slotsLeft = (n: number, max = LIMITS.maxFiles) => Math.max(0, max - n);

export function validateDuration(seconds: number | null): string | null {
  if (seconds !== null && seconds > LIMITS.maxMinutes * 60) return `Too long (${Math.ceil(seconds / 60)} min). The limit is ${LIMITS.maxMinutes} minutes per recording.`;
  return null;
}

/** Browser-side duration probe; null when the browser can't decode it (server re-checks anyway). */
export function probeDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const a = new Audio();
    const url = URL.createObjectURL(file);
    const done = (v: number | null) => { URL.revokeObjectURL(url); resolve(v); };
    const t = setTimeout(() => done(null), 2000);
    a.preload = "metadata";
    a.onloadedmetadata = () => { clearTimeout(t); done(Number.isFinite(a.duration) ? a.duration : null); };
    a.onerror = () => { clearTimeout(t); done(null); };
    a.src = url;
  });
}

export const fmtDuration = (s: number | null | undefined) =>
  s == null ? "" : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
export const fmtSize = (b: number) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/** OTP box logic: typing/pasting `raw` at box `index`. Returns new digits and the box to focus. */
export function fillCode(digits: string[], index: number, raw: string, len = 6): { digits: string[]; focus: number } {
  const clean = raw.replace(/\D/g, "");
  const next = [...digits];
  if (!clean) { next[index] = ""; return { digits: next, focus: index }; }
  let i = index;
  for (const ch of clean) { if (i >= len) break; next[i++] = ch; }
  return { digits: next, focus: Math.min(i, len - 1) };
}
