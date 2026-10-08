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

- **Lead page, Analysis overview**: tiles like the real dashboard's Home (resolution, dropped, handoff, repair with fix/redo, effort, frustrated, phantom, handed to a human), each with "n of d calls" and its definition. Resolution / dropped / handoff / effort show the **signed-off** values, with "judge said X%" when they differ. Phantom actions get no tile when they can't be measured (a recording has no tool trace); a "Needs a live connection" block (`src/components/NeedsConnection.tsx`) says tool errors, latency and cost need traces instead. Never a 0. Then top requests, sentiment bars with "N of M calls had a negative moment ...", violations (English calls only; "Not run on Hindi calls" otherwise), needs attention. The calls table has per-call chips (outcome, grade, effort, requests, worst mood), fetched in parallel once per visit.
- **Call page tabs**: Overview (facts, requests, "Was each request resolved?" with the caller's quote and attempts, repairs with English gloss, claimed actions = "can't tell", the judge's reason as "Automatic assessment"); Transcript (per-turn request and mood chips; click a turn to seek audio); Sentiment (hand-drawn SVG curve + first-negative marker + turn table); Violations. The audio and the "Judge output and corrections" panel stay visible on every tab; shortcuts are unchanged.
- **Re-run** buttons (outcome only, or incl. intents) ask for confirmation first because they spend LLM tokens. An unjudged call shows "Analysing" and the page re-fetches every 5 s.
- Defaults chosen: the curve scores moods neutral 0, relieved +1, appreciative +2, confused/anxious -0.5, impatient -1, frustrated/resigned -2, hostile -3 on a fixed scale (state only, intensity not used); "worst mood" in the table is the lowest-scoring turn below neutral. Logic and tests: `src/lib/analysis.ts`.

Placeholders to review: `src/lib/copy.ts` (`UPLOAD_NOTICE`, the sentence above the upload button), `src/lib/config.ts` (turnaround, demo URL, contact).

## Operations (read this if you are taking over)

**What this is.** A static website (Vite + React). It has no server of its own: it calls the VoxMith API
(`https://api.voxmith.com`, repo `VoxMith/voxmith-backend`). Public pages: `/`, `/start`, `/status`. Staff pages: `/staff/*`.

**Hosting: AWS Amplify Hosting, in the company AWS account, connected to this GitHub repo.** Every merge to `main` redeploys.
- The build is defined in `amplify.yml` (Node 20, `npm ci`, `npm run build`, output `dist`).
- Unknown paths must serve `index.html` (so `/start`, `/status`, `/staff` work on refresh). In Amplify: App -> Hosting -> Rewrites and redirects -> Open text editor, paste:
  ```json
  [
    { "source": "/<*>", "status": "404-200", "target": "/index.html" }
  ]
  ```
  (Real files are served as normal; only a path with no file behind it falls back to `index.html`.)
- Build-time variables (App -> Hosting -> Environment variables). They are baked into the build, so changing one needs a redeploy:
  - `VITE_API_URL` = `https://api.voxmith.com`
  - `VITE_TURNSTILE_SITE_KEY` = the Cloudflare Turnstile **site** key (public)
  - `VITE_CLERK_PUBLISHABLE_KEY` = the Clerk publishable key (public). Never set `VITE_STAFF_AUTH_STUB` in production.
- Domain: `analyze.voxmith.com`, added under App -> Hosting -> Custom domains. Zone `voxmith.com` is in the same AWS account's Route 53, so Amplify can create the DNS record and the HTTPS certificate. Do not let it touch the root `voxmith.com`: it is hosted elsewhere.
- Brand assets live in `public/brand/` (`wordmark.png` / `mark.png` for light backgrounds, `*-white.png` for dark). Colours are Tailwind theme tokens in `src/index.css`: `brand` blue `#026CFE` (buttons, bars, focus), `brand-dark` `#0258d6` (links, hover), `ink` navy `#13222C` (text, dark sections). The favicon is `mark.png`.
- There is no consent checkbox on `/start`: the plain sentence `UPLOAD_NOTICE` (`src/lib/copy.ts`, placeholder wording for the founder to review) above the button is the consent. The API call still sends `consent_analyse: true`, which the backend requires.
- Staff sign-in returns to the staff URL that was open (e.g. a `/staff/leads/<id>` link), not the public landing page: `<SignIn routing="hash">` and `ClerkProvider` get `forceRedirectUrl` from `staffReturnUrl()` (`src/lib/staffLogic.ts`), and Clerk navigates through react-router.
- Cloudflare is used only for the Turnstile bot check (the widget lists `analyze.voxmith.com`); nothing is hosted there.

**Who can do what (keep this list true).**
- AWS account (Amplify hosting, Route 53, S3): the company account; keep at least two admins. Cloudflare account (Turnstile only): owned by the company, at least two admins.
- GitHub: org `VoxMith`, this repo needs at least two owners.
- Staff access: backend env `STAFF_EMAILS` (in `infra/k8s/voxmith-backend/deployment.yaml` of the backend repo). To add someone, add their email and merge. They sign in with Clerk using that email.
- Secrets are never in this repo: the Turnstile **secret** key lives in the Kubernetes secret `voxmith-backend` (key `turnstile_secret`).

**Where to look when something breaks.**
- Public form says "Bot check ..." -> Turnstile keys or hostname (the widget must list `analyze.voxmith.com`).
- Staff login says not authorised -> the email is missing from `STAFF_EMAILS`, or the Clerk session token lacks the `email` claim (see Staff review above).
- Uploads fail in the browser -> the S3 bucket CORS rule must allow `https://analyze.voxmith.com` (backend repo PR #23 has the commands).
- Reports are emailed by hand for now (no email provider configured): download the PDF on the lead page, send it, then press "Mark as sent by hand".
