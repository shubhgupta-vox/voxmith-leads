import { ApiError, messageFor } from "./api";
import { API_BASE } from "./config";
import type { SentTurn } from "./analysis";
import type { Fields } from "./staffLogic";

const BASE = `${API_BASE}/staff`;

/** Set once by the auth gate: returns the Clerk session token (null with the dev stub). */
let tokenGetter: () => Promise<string | null> = async () => null;
export const setTokenGetter = (f: () => Promise<string | null>) => { tokenGetter = f; };

export type Me = { staff: true; email: string; reasons: string[]; outcomes: string[] };
export type QueueRow = { id: string; company: string; email: string; name: string; status: string; calls: number; analysed: number; reviewed: number; created_at: string; delivered_at: string | null };
export type LeadCallRow = { file_id: string; conversation_id: string | null; filename: string; stage: string; reason: string | null; duration_s: number | null; language: string | null; outcome_judged: boolean; reviewed_at: string | null; reviewed_by: string | null };
export type LeadDetail = { id: string; name: string; email: string; company: string; agent_description: string | null; keep_consent: boolean; status: string; delivered_at: string | null; created_at: string; calls: LeadCallRow[] };
export type TurnIntent = { intent_id: string; name: string; status: string; confidence: number | null };
export type Turn = { idx: number; role: string; text: string; offset_sec: number; span_id: string; intents?: TurnIntent[] };
export type IntentResult = { name: string; resolved: boolean; attempts: number | null; evidence_span_id: string | null };
export type Repair = { type: string; subtype: string | null; quote: string; gloss_en: string | null; caller_span_id: string | null; agent_span_id: string | null };
export type OutcomeDetail = {
  outcome: string; escalated: boolean; intent_results: IntentResult[]; repairs: Repair[]; phantom_actions: unknown[] | null;
  reason: string; confidence: number | null; model: string | null;
};
export type Sentiment = {
  status?: string; turns: SentTurn[]; statesDetected: string[]; firstNegativeState: string | null; firstNegativeTurn: number | null;
  recovered: boolean; reachedResigned?: boolean;
};
export type Violation = { title: string; family: string; category: string | null; sentence: string; agent_complied: boolean | null; judge_reason: string | null };
export type Rate = { value: number | null; num: number; den: number; definition: string; note?: string };
export type Analytics = {
  automatic: {
    counts: { conversations: number; counted: number; judged: number; analysing: number; no_request: number };
    rates: {
      resolution_rate: Rate; dropped_rate: Rate; handoff_rate: Rate; effort: Rate; frustrated_rate: Rate; phantom_rate: Rate;
      repair_rate: Rate & { by_type: { fix: { events: number; subtypes: Record<string, number> }; redo: { events: number; subtypes: Record<string, number> } } };
    };
    intents: { name: string; calls: number; resolved: number; unresolved: number; resolved_rate: number | null; avg_effort: number | null }[];
    sentiment: {
      distribution: { state: string; conversations: number; share: number }[]; scored_conversations: number; negative_conversations: number;
      median_first_negative_turn: number | null; recovered_rate: number | null;
    };
    violations: { rules_checked: number; english_calls: number; fired: { title: string; family: string; attempts: number; conversations: number; judged: number; complied: number }[]; note: string };
    needs_attention: { conversation_id: string; started_at: string; outcome: string; intent: string; reason: string }[];
  };
  reviewed: {
    calls: number; counted: number; signed_off: number; calls_corrected: number; escalations: number; negative_calls: number;
    resolution_rate: { value: number | null; num: number; den: number }; dropped_rate: { value: number | null; num: number; den: number };
    handoff_rate: { value: number | null; num: number; den: number }; effort: { value: number | null; den: number };
  };
  waiting: number;
};
export type Correction = { id: string | number; field: keyof Fields; original_value: unknown; corrected_value: unknown; reason: string; reviewer_email: string | null; created_at: string };
export type CallDetail = {
  lead: { id: string; company: string; email: string };
  call: { file_id: string; filename: string; language: string | null; duration_s: number | null; reviewed_at: string | null; reviewed_by: string | null };
  audio_url: string | null;
  conversation: {
    turns: Turn[]; outcome_detail: OutcomeDetail | null; sentiment: Sentiment | null;
    call_grade: string | null; effort: number | null; turn_count: number | null; duration_ms: number | null; intents: string[];
  };
  review: { judged: boolean; original: Fields | null; effective: Fields | null; corrections: Correction[] };
  violations: Violation[];
  violations_checked: boolean;
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
  analytics: (id: string) => json<Analytics>(`/leads/${id}/analytics`),
  /** Re-run the outcome judge (full: the intent pass too). Spends LLM tokens. */
  rejudge: (cid: string, full: boolean) => json<{ outcome: string }>(`/calls/${cid}/rejudge`, "POST", { full }),
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
