import { useEffect, useRef, useState } from "react";
import CodeForm from "../components/CodeForm";
import Turnstile from "../components/Turnstile";
import { Button, ErrorNote, Field, inputCls } from "../components/ui";
import { ApiError, api, clearToken, putFile } from "../lib/api";
import { LIMITS, MAX_CONCURRENT_UPLOADS, TURNSTILE_SITE_KEY } from "../lib/config";
import { UPLOAD_NOTICE } from "../lib/copy";
import { countLabel, fmtDuration, fmtSize, isTranscript, probeDuration, slotsLeft, validateDuration, validateFile, validateStart } from "../lib/validate";

type Item = { id: string; file: File; duration: number | null; state: "queued" | "uploading" | "done" | "error"; progress: number; error?: string; fileId?: string };
let seq = 0;

export default function Start() {
  const [form, setForm] = useState({ name: "", email: "", company: "", desc: "" });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [items, setItems] = useState<Item[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [started, setStarted] = useState(false); // the lead exists: files can upload right away
  const [step, setStep] = useState<"files" | "code" | "done">("files");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState("");
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<Item[]>([]);
  itemsRef.current = items;
  const creating = useRef<Promise<boolean> | null>(null);
  const running = useRef(new Set<string>());
  const aborts = useRef(new Map<string, AbortController>());

  const patch = (id: string, p: Partial<Item>) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)));

  /** The first file creates the lead (so there is something to upload to); later files reuse it. */
  function ensureLead(): Promise<boolean> {
    if (started) return Promise.resolve(true);
    creating.current ??= api
      .createLead({ name: form.name.trim(), email: form.email.trim(), company: form.company.trim(), agent_description: form.desc.trim(), consent_analyse: true, turnstile_token: captcha })
      .then(() => { setStarted(true); return true; })
      .catch((e) => { setFormError(e instanceof ApiError ? e.message : "Something went wrong. Please try again."); creating.current = null; return false; });
    return creating.current;
  }

  async function addFiles(list: FileList | File[]) {
    setFormError(null);
    const er = validateStart(form, 1);
    delete er.files;
    setErrs(er);
    if (Object.keys(er).length) { setNotes(["Please fill in your details above first, then add your files."]); return; }
    if (!started && TURNSTILE_SITE_KEY && !captcha) { setNotes(["Please wait for the bot check to finish, then add your files again."]); return; }
    const bad: string[] = [];
    let count = itemsRef.current.length;
    const ok: { file: File; duration: number | null }[] = [];
    for (const file of Array.from(list)) {
      if (itemsRef.current.some((i) => i.file.name === file.name && i.file.size === file.size) || ok.some((o) => o.file === file)) { bad.push(`${file.name}: already added.`); continue; }
      let why = validateFile(file, count);
      const duration = why || isTranscript(file) ? null : await probeDuration(file);
      why ??= validateDuration(duration);
      if (why) { bad.push(`${file.name}: ${why}`); continue; }
      count++;
      ok.push({ file, duration });
    }
    setNotes(bad);
    if (!ok.length || !(await ensureLead())) return;
    setItems((xs) => [...xs, ...ok.map((o) => ({ id: `i${++seq}`, file: o.file, duration: o.duration, state: "queued" as const, progress: 0 }))]);
  }

  async function run(i: Item) {
    const ctl = new AbortController();
    aborts.current.set(i.id, ctl);
    try {
      // A fresh presigned URL every time: that is also how a failed or expired upload is resumed.
      const p = i.fileId ? await api.refreshUrl(i.fileId) : await api.createFile(i.file.name, i.file.size);
      patch(i.id, { fileId: p.file_id });
      await putFile(p, i.file, (f) => patch(i.id, { progress: f }), ctl.signal);
      await api.completeFile(p.file_id);
      patch(i.id, { state: "done", progress: 1 });
    } catch (e) {
      if (!ctl.signal.aborted) patch(i.id, { state: "error", error: e instanceof ApiError ? e.message : "Upload failed. Please retry." });
    } finally {
      running.current.delete(i.id);
      aborts.current.delete(i.id);
    }
  }

  // Start queued uploads, at most MAX_CONCURRENT_UPLOADS at a time, as soon as they are added.
  useEffect(() => {
    const free = MAX_CONCURRENT_UPLOADS - running.current.size;
    for (const i of items.filter((x) => x.state === "queued" && !running.current.has(x.id)).slice(0, Math.max(0, free))) {
      running.current.add(i.id);
      patch(i.id, { state: "uploading" });
      void run(i);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  function remove(i: Item) {
    aborts.current.get(i.id)?.abort();
    if (i.fileId) api.deleteFile(i.fileId).catch(() => {});
    setItems((xs) => xs.filter((x) => x.id !== i.id));
  }

  /** Continue: only now is the verification code emailed. */
  async function sendCode() {
    setFormError(null);
    setBusy(true);
    try {
      await api.resend("");
      setStep("code");
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  }

  const done = items.filter((i) => i.state === "done").length;
  const allDone = items.length > 0 && done === items.length;
  const full = slotsLeft(items.length) === 0;
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  if (step === "done") return (
    <div className="fade-in space-y-3" aria-live="polite">
      <h1 className="text-2xl font-bold">Thank you</h1>
      <p>We have received your conversations and will start analysing them now.</p>
      <p>We will send your report to <strong>{form.email.trim()}</strong> within 6 hours. There is nothing more you need to do. We have also sent you a short email to confirm.</p>
    </div>
  );

  if (step === "code") return (
    <div className="fade-in space-y-4">
      <h1 className="text-2xl font-bold">Confirm your email</h1>
      <p className="text-sm text-slate-600">{done} {done === 1 ? "conversation" : "conversations"} uploaded.</p>
      <CodeForm email={form.email.trim()} onVerified={() => { clearToken(); setStep("done"); }} />
    </div>
  );

  return (
    <div className="fade-in space-y-8">
      <h1 className="text-2xl font-bold">Start your analysis</h1>

      <fieldset disabled={started} className="space-y-4">
        <legend className="mb-2 text-lg font-semibold">1. Your details</legend>
        <Field label="Your name" error={errs.name}>{(p) => <input {...p} className={inputCls} value={form.name} onChange={set("name")} autoComplete="name" required />}</Field>
        <Field label="Work email" hint="We send a 6-digit code here to confirm it is you." error={errs.email}>{(p) => <input {...p} type="email" className={inputCls} value={form.email} onChange={set("email")} autoComplete="email" required />}</Field>
        <Field label="Company" error={errs.company}>{(p) => <input {...p} className={inputCls} value={form.company} onChange={set("company")} autoComplete="organization" required />}</Field>
        <Field label="What does your agent do?" error={errs.desc}>{(p) => <textarea {...p} className={inputCls} rows={3} value={form.desc} onChange={set("desc")} required />}</Field>
        {!started && <Turnstile onToken={setCaptcha} />}
      </fieldset>

      <section aria-labelledby="convos" className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 id="convos" className="text-lg font-semibold">2. Your conversations</h2>
          <p aria-live="polite" className="text-sm font-medium">{countLabel(items.length)} conversations{items.length ? `, ${done} uploaded` : ""}</p>
        </div>
        <p className="text-sm text-slate-700">Calls or transcripts from your voice or chat agent. Files upload as soon as you add them.</p>
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); void addFiles(e.dataTransfer.files); }}
          className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${drag ? "border-brand bg-brand-50" : "border-slate-400"}`}
        >
          <p className="mb-3">Drag and drop your files here</p>
          <Button type="button" variant="secondary" disabled={full} onClick={() => input.current?.click()}>Choose files</Button>
          <input ref={input} type="file" multiple accept=".mp3,.wav,.m4a,.txt,.json,audio/mpeg,audio/wav,audio/mp4,text/plain,application/json" className="sr-only" tabIndex={-1} aria-label="Choose conversation files"
            onChange={(e) => { if (e.target.files) void addFiles(e.target.files); e.target.value = ""; }} />
          <p className="mt-3 text-sm text-slate-600">Calls: mp3, wav or m4a, up to {LIMITS.maxMinutes} minutes and {LIMITS.maxMb} MB each. Transcripts: txt or json, up to {LIMITS.maxTranscriptKb} KB each. Up to {LIMITS.maxFiles} conversations.</p>
        </div>
        {notes.length > 0 && <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"><p className="font-medium">{notes.length === 1 && notes[0].startsWith("Please") ? "Before adding files:" : "Some files were not added:"}</p><ul className="list-disc pl-5">{notes.map((n) => <li key={n}>{n}</li>)}</ul></div>}
        {full && <p className="text-sm text-slate-700">That is the maximum of {LIMITS.maxFiles} conversations.</p>}

        <ul className="space-y-2">
          {items.map((i) => (
            <li key={i.id} className="rounded-lg border border-slate-300 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0"><p className="truncate font-medium">{i.file.name}</p><p className="text-sm text-slate-600">{fmtSize(i.file.size)}{i.duration != null && ` · ${fmtDuration(i.duration)}`}</p></div>
                <div className="flex shrink-0 gap-2">
                  {i.state === "error" && <Button type="button" variant="secondary" onClick={() => patch(i.id, { state: "queued", error: undefined })}>Retry<span className="sr-only"> {i.file.name}</span></Button>}
                  <Button type="button" variant="secondary" onClick={() => remove(i)}>Remove<span className="sr-only"> {i.file.name}</span></Button>
                </div>
              </div>
              <div role="progressbar" aria-label={`Upload of ${i.file.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(i.progress * 100)} className="mt-2 h-2 overflow-hidden rounded bg-slate-200">
                <div className={`bar h-full ${i.state === "error" ? "bg-red-600" : "bg-brand"}`} style={{ width: `${Math.round(i.progress * 100)}%` }} />
              </div>
              <p className="mt-1 text-sm" aria-live="polite">{i.state === "done" ? "Uploaded" : i.state === "error" ? <span className="text-red-700">{i.error}</span> : i.state === "queued" ? "Waiting" : `Uploading ${Math.round(i.progress * 100)}%`}</p>
            </li>
          ))}
        </ul>
      </section>

      {formError && <ErrorNote>{formError}</ErrorNote>}
      <div className="space-y-3">
        <p className="text-sm text-slate-700">{UPLOAD_NOTICE}</p>
        <Button type="button" disabled={busy || !allDone} onClick={() => void sendCode()}>{busy ? "Sending your code..." : "Continue"}</Button>
        {items.length > 0 && !allDone && <p className="text-sm text-slate-600">Continue unlocks when every file has uploaded.</p>}
      </div>
    </div>
  );
}
