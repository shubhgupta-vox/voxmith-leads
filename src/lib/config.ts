// Single place for values the founder may want to change.
export const API_BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8090").replace(/\/$/, "") + "/api/v1";
export const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

// Placeholders, founder to replace.
export const TALK_TO_US_MAILTO = "mailto:hello@voxmith.com?subject=More%20than%2010%20calls";
export const DEMO_URL = "https://voxmith.com/demo";
export const TURNAROUND_FALLBACK = "within 3 business days";

// Defaults until the server's limits arrive (POST /leads returns the real ones).
export const LIMITS = { maxFiles: 10, maxMb: 50, maxMinutes: 15 };
export const MAX_CONCURRENT_UPLOADS = 3;
export const RESEND_COOLDOWN_S = 30;
export const POLL_MS = 5000;
