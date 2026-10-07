import { ApiError, messageFor } from "./api";
import { API_BASE } from "./config";
import type { Fields } from "./staffLogic";

const BASE = `${API_BASE}/staff`;

/** Set once by the auth gate: returns the Clerk session token (null with the dev stub). */
let tokenGetter: () => Promise<string | null> = async () => null;
export const setTokenGetter = (f: () => Promise<string | null>) => { tokenGetter = f; };

export type Me = { staff: true; email: string; reasons: string[]; outcomes: string[] };
export type QueueRow = { id: string; company: string; email: string; name: string; status: string; calls: number; analysed: number; reviewed: number; created_at: string; delivered_at: string | null };
export type LeadCallRow = { file_id: string; conversation_id: string | null; filename: string; stage: string; reason: string | null; duration_s: number | null; language: string | null; outcome_judged: boolean; reviewed_at: string | null; reviewed_by: string | null };
export type LeadDetail = { id: string; name: string; email: string; company: string; agent_description: string | null; keep_consent: boolean; status: string; delivered_at: string | null; created_at: string; calls: LeadCallRow[] };
export type Turn = { idx: number; role: string; text: string; offset_sec: number; span_id: string };
export type Correction = { id: string | number; field: keyof Fields; original_value: unknown; corrected_value: unknown; reason: string; reviewer_email: string | null; created_at: string };
export type CallDetail = {
  lead: { id: string; company: string; email: string };
  call: { file_id: string; filename: string; language: string | null; duration_s: number | null; reviewed_at: string | null; reviewed_by: string | null };
  audio_url: string | null;
  conversation: { turns: Turn[]; outcome_detail: { reason: string; confidence: number | null } | null };
  review: { judged: boolean; original: Fields | null; effective: Fields | null; corrections: Correction[] };
};

async function raw(path: string, method = "GET", body?: unknown): Promise<Response> {
  const headers: Record<string, string> = {};
  const token = await tokenGetter().catch(() => null);
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  let res: Response;
  try {
    res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const msg = res.status === 401 ? "Your sign-in has expired. Please sign in again." : res.status === 403 ? "Staff only." : messageFor(res.status, data);
    throw new ApiError(res.status, msg);
  }
  return res;
}
const json = async <T>(path: string, method = "GET", body?: unknown) => (await raw(path, method, body)).json() as Promise<T>;

export const staffApi = {
  me: () => json<Me>("/me"),
  queue: () => json<QueueRow[]>("/leads"),
  lead: (id: string) => json<LeadDetail>(`/leads/${id}`),
  call: (cid: string) => json<CallDetail>(`/calls/${cid}`),
  correct: (cid: string, b: { field: string; corrected_value: unknown; reason: string }) => json<Correction>(`/calls/${cid}/corrections`, "POST", b),
  reviewed: (cid: string) => json<{ reviewed_at: string; reviewed_by: string }>(`/calls/${cid}/reviewed`, "POST"),
  send: (id: string, resend: boolean) => json<{ sent: true; delivered_at: string } | { sent: false; reason: string }>(`/leads/${id}/send`, "POST", { resend }),
  delivered: (id: string) => json<{ delivered_at: string }>(`/leads/${id}/delivered`, "POST"),
  /** PDF preview as a blob URL (caller revokes it) + whether the server says it is complete enough to send. */
  async report(id: string) {
    const res = await raw(`/leads/${id}/report.pdf`);
    return { url: URL.createObjectURL(await res.blob()), ready: res.headers.get("X-Report-Ready") === "true" };
  },
};
