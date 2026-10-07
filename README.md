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
Placeholders to review: `src/lib/copy.ts` (consent wording), `src/lib/config.ts` (turnaround, demo URL, contact).
