# voxmith-leads

Public intake for the VoxMith call-analysis programme: landing page, details + uploads, email code, private status page.

```
cp .env.example .env.local   # VITE_API_URL, VITE_TURNSTILE_SITE_KEY
npm install
npm run dev                  # http://localhost:5173
npm test && npm run build
```

Backend: branch `leads-1-intake-api` of VoxMith/voxmith-backend, run with `LEAD_STORAGE=local`
on port 8090 and `CORS_ORIGINS` including `http://localhost:5173`. The verification code is in the backend log.
The static host must serve `index.html` for unknown paths (`/start`, `/status`).
## Staff review (`/staff`)

Queue (`/staff`) -> lead (`/staff/leads/:id`: details, consent, calls, PDF preview, send / mark as sent by hand) ->
call review (`/staff/calls/:conversationId`: audio, transcript, the judge's answer next to editable
outcome / escalated / intents / sentiment, correction history, sign-off). The staff code is lazy-loaded, so the public bundle does not include Clerk.
Backend: branch `leads-3-pdf` (staff endpoints under `/api/v1/staff`).

- Sign-in is Clerk (`VITE_CLERK_PUBLISHABLE_KEY`, the dev instance key is in `.env.example`). Signed out: Clerk's sign-in. Signed in but not allowlisted (`GET /staff/me` = 403): "not authorised for staff".
- The Clerk session token must include the email: Clerk dashboard -> Sessions -> Customize session token ->
  `{"email": "{{user.primary_email_address}}"}`. The backend env `STAFF_EMAILS` (comma-separated) must list the staff, otherwise 403.
- Every correction needs a reason and is stored beside the judge's answer (never overwrites it). Editing a signed-off call re-opens it; the report can be sent only when every analysed call is signed off.
- "Send report" answers honestly when the backend has no email provider ("nothing was sent"): download the PDF, send it yourself, then "Mark as sent by hand".
- Keyboard shortcuts on the call page (press `?` for the overlay; none fire while typing in a field): `j`/`k` next/previous call of the lead, `Space` play/pause, `[` `]` seek -/+5 s, `1`-`4` outcome (resolved / handed off / dropped / no request) and focus its reason picker, `e` toggle escalated, `r` mark reviewed.
- Dev auth stub: `VITE_STAFF_AUTH_STUB=1 npm run dev` skips Clerk and sends no token, for use against a local backend whose `current_user` dependency is overridden. It only works when `import.meta.env.DEV` is true, so production builds ignore it.
- Audio: `audio_url` comes from the backend (S3 presigned, or the local dev route). `null` means the recording was deleted (delete-my-data or retention).

### Analysis views (data from `GET /staff/leads/:id/analytics` and `GET /staff/calls/:id`)

- **Lead page, Analysis overview**: tiles like the real dashboard's Home (resolution, dropped, handoff, repair with fix/redo, effort, frustrated, phantom, handed to a human), each with "n of d calls" and its definition. Resolution / dropped / handoff / effort show the **signed-off** values, with "judge said X%" when they differ. Phantom shows "Not measurable" (a recording has no tool trace), never 0. Then top requests, sentiment bars with "N of M calls had a negative moment ...", violations (English calls only; "Not run on Hindi calls" otherwise), needs attention. The calls table has per-call chips (outcome, grade, effort, requests, worst mood), fetched in parallel once per visit.
- **Call page tabs**: Overview (facts, requests, "Was each request resolved?" with the caller's quote and attempts, repairs with English gloss, claimed actions = "can't tell", the judge's reason as "Automatic assessment"); Transcript (per-turn request and mood chips; click a turn to seek audio); Sentiment (hand-drawn SVG curve + first-negative marker + turn table); Violations. The audio and the "Judge output and corrections" panel stay visible on every tab; shortcuts are unchanged.
- **Re-run** buttons (outcome only, or incl. intents) ask for confirmation first because they spend LLM tokens. An unjudged call shows "Analysing" and the page re-fetches every 5 s.
- Defaults chosen: the curve scores moods neutral 0, relieved +1, appreciative +2, confused/anxious -0.5, impatient -1, frustrated/resigned -2, hostile -3 on a fixed scale (state only, intensity not used); "worst mood" in the table is the lowest-scoring turn below neutral. Logic and tests: `src/lib/analysis.ts`.

Placeholders to review: `src/lib/copy.ts` (consent wording), `src/lib/config.ts` (turnaround, demo URL, contact).
