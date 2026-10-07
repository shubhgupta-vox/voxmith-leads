// Single place for values the founder may want to change.
export const API_BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8090").replace(/\/$/, "") + "/api/v1";
export const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
export const STAFF_MOCK = import.meta.env.VITE_STAFF_AUTH === "mock";
export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

// ponytail: placeholder address, founder to replace
export const TALK_TO_US_MAILTO = "mailto:hello@voxmith.com?subject=More%20than%2010%20calls";
export const TURNAROUND_FALLBACK = "within 3 business days";

export const LIMITS = { maxFiles: 10, maxMb: 50, maxMinutes: 15 };
