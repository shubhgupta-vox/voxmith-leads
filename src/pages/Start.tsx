import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Turnstile from "../components/Turnstile";
import { Button, ErrorNote, Field, inputCls } from "../components/ui";
import { ApiError, api, getToken, putFile } from "../lib/api";
import { LIMITS, MAX_CONCURRENT_UPLOADS, TALK_TO_US_MAILTO, TURNSTILE_SITE_KEY } from "../lib/config";
import { CONSENT_ANALYSE, CONSENT_KEEP } from "../lib/copy";
import { countLabel, fmtDuration, fmtSize, probeDuration, slotsLeft, validateDuration, validateFile } from "../lib/validate";

type Item = { id: string; file: File; duration: number | null; state: "queued" | "uploading" | "done" | "error"; progress: number; error?: string; fileId?: string };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let seq = 0;

export default function Start() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", company: "", desc: "" });
  const [analyse, setAnalyse] = useState(false);
  const [keep, setKeep] = useState(false);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [items, setItems] = useState<Item[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [started, setStarted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState("");
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<Item[]>([]);
  itemsRef.current = items;
  const running = useRef(new Set<string>());
  const aborts = useRef(new Map<string, AbortController>());
  const hadToken = useRef(getToken()).current;

  const patch = (id: string, p: Partial<Item>) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)));

  async function addFiles(list: FileList | File[]) {
    const bad: string[] = [];
    let count = itemsRef.current.length;
    for (const file of Array.from(list)) {
      if (itemsRef.current.some((i) => i.file.name === file.name && i.file.size === file.size)) { bad.push(`${file.name}: already added.`); continue; }
      let why = validateFile(file, count);
      const duration = why ? null : await probeDuration(file);
      why ??= validateDuration(duration);
      if (why) { bad.push(`${file.name}: ${why}`); continue; }
      count++;
      setItems((xs) => [...xs, { id: `i${++seq}`, file, duration, state: "queued", progress: 0 }]);
    }
    setNotes(bad);
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

  // Start queued uploads, at most MAX_CONCURRENT_UPLOADS at a time, once the lead exists.
  useEffect(() => {
    if (!started) return;
    const free = MAX_CONCURRENT_UPLOADS - running.current.size;
    for (const i of items.filter((x) => x.state === "queued" && !running.current.has(x.id)).slice(0, Math.max(0, free))) {
      running.current.add(i.id);
      patch(i.id, { state: "uploading" });
      void run(i);
    }
    if (items.length && items.every((x) => x.state === "done")) nav("/status");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, started]);

  function remove(i: Item) {
    aborts.current.get(i.id)?.abort();
    if (i.fileId) api.deleteFile(i.fileId).catch(() => {});
    setItems((xs) => xs.filter((x) => x.id !== i.id));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const er: Record<string, string> = {};
    if (!form.name.trim()) er.name = "Enter your name.";
    if (!EMAIL.test(form.email.trim())) er.email = "Enter a valid work email.";
    if (!form.company.trim()) er.company = "Enter your company.";
    if (!analyse) er.analyse = "Please agree so we can analyse your calls.";
    if (!items.length) er.files = "Add at least one call.";
    setErrs(er);
    if (Object.keys(er).length) return;
    if (TURNSTILE_SITE_KEY && !captcha) { setFormError("Please wait for the bot check to finish, then try again."); return; }
    setBusy(true);
    try {
      await api.createLead({ name: form.name.trim(), email: form.email.trim(), company: form.company.trim(), agent_description: form.desc.trim() || undefined, consent_analyse: true, consent_keep: keep, turnstile_token: captcha });
      setStarted(true);
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  }

  const done = items.filter((i) => i.state === "done").length;
  const full = slotsLeft(items.length) === 0;
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <form onSubmit={submit} noValidate className="fade-in space-y-8">
      <h1 className="text-2xl font-bold">Start your analysis</h1>
      {hadToken && !started && <p className="rounded-lg bg-slate-50 p-3 text-sm">You already have a submission in progress. <Link to="/status" className="underline">Go to its status page</Link>, or fill this in to start a new one.</p>}

      <fieldset disabled={started} className="space-y-4">
        <legend className="mb-2 text-lg font-semibold">1. Your details</legend>
        <Field label="Your name" error={errs.name}>{(p) => <input {...p} className={inputCls} value={form.name} onChange={set("name")} autoComplete="name" required />}</Field>
        <Field label="Work email" hint="We send a 6-digit code here. We only start analysing after you confirm your email." error={errs.email}>{(p) => <input {...p} type="email" className={inputCls} value={form.email} onChange={set("email")} autoComplete="email" required />}</Field>
        <Field label="Company" error={errs.company}>{(p) => <input {...p} className={inputCls} value={form.company} onChange={set("company")} autoComplete="organization" required />}</Field>
        <Field label="What does your agent do? (optional)">{(p) => <textarea {...p} className={inputCls} rows={3} value={form.desc} onChange={set("desc")} />}</Field>
      </fieldset>

      <section aria-labelledby="calls" className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 id="calls" className="text-lg font-semibold">2. Your calls</h2>
          <p aria-live="polite" className="text-sm font-medium">{countLabel(items.length)} calls{started && items.length ? `, ${done} uploaded` : ""}</p>
        </div>
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); void addFiles(e.dataTransfer.files); }}
          className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${drag ? "border-brand bg-blue-50" : "border-slate-400"}`}
        >
          <p className="mb-3">Drag and drop recordings here</p>
          <Button type="button" variant="secondary" disabled={full} onClick={() => input.current?.click()}>Choose files</Button>
          <input ref={input} type="file" multiple accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/mp4" className="sr-only" tabIndex={-1} aria-label="Choose call recordings"
            onChange={(e) => { if (e.target.files) void addFiles(e.target.files); e.target.value = ""; }} />
          <p className="mt-3 text-sm text-slate-600">mp3, wav or m4a. Up to {LIMITS.maxMinutes} minutes and {LIMITS.maxMb} MB each. Up to {LIMITS.maxFiles} calls.</p>
        </div>
        {errs.files && <p className="text-sm text-red-700">{errs.files}</p>}
        {notes.length > 0 && <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"><p className="font-medium">Some files were not added:</p><ul className="list-disc pl-5">{notes.map((n) => <li key={n}>{n}</li>)}</ul></div>}
        {full && <p className="text-sm text-slate-700">That is the maximum of {LIMITS.maxFiles}. Have more calls? <a className="underline" href={TALK_TO_US_MAILTO}>Talk to us</a>.</p>}

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
              {started && (
                <>
                  <div role="progressbar" aria-label={`Upload of ${i.file.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(i.progress * 100)} className="mt-2 h-2 overflow-hidden rounded bg-slate-200">
                    <div className={`bar h-full ${i.state === "error" ? "bg-red-600" : "bg-brand"}`} style={{ width: `${Math.round(i.progress * 100)}%` }} />
                  </div>
                  <p className="mt-1 text-sm" aria-live="polite">{i.state === "done" ? "Uploaded" : i.state === "error" ? <span className="text-red-700">{i.error}</span> : i.state === "queued" ? "Waiting" : `Uploading ${Math.round(i.progress * 100)}%`}</p>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>

      <fieldset disabled={started} className="space-y-3">
        <legend className="mb-2 text-lg font-semibold">3. Consent</legend>
        <label className="flex items-start gap-3"><input type="checkbox" className="mt-1 size-5" checked={analyse} onChange={(e) => setAnalyse(e.target.checked)} aria-required aria-invalid={errs.analyse ? true : undefined} /><span>{CONSENT_ANALYSE}</span></label>
        {errs.analyse && <p className="text-sm text-red-700">{errs.analyse}</p>}
        <label className="flex items-start gap-3"><input type="checkbox" className="mt-1 size-5" checked={keep} onChange={(e) => setKeep(e.target.checked)} /><span>{CONSENT_KEEP}</span></label>
      </fieldset>

      <Turnstile onToken={setCaptcha} />
      {formError && <ErrorNote>{formError}</ErrorNote>}
      {!started ? (
        <Button type="submit" disabled={busy}>{busy ? "Starting..." : "Upload and continue"}</Button>
      ) : (
        <p aria-live="polite" className="text-sm font-medium">{done < items.length ? "Uploading your calls. Keep this page open." : "All uploaded."} Next you will confirm your email.</p>
      )}
    </form>
  );
}
