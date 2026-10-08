// Pure helpers for the staff review screen (no React, no network), so they can be unit-tested.

export type Intent = { name: string; resolved: boolean };
export type Fields = { outcome: string; escalated: boolean; intents: Intent[]; sentiment: string | null };
export type FieldName = keyof Fields;
export const FIELD_NAMES: FieldName[] = ["outcome", "escalated", "intents", "sentiment"];
export const MAX_INTENTS = 10;
export const SENTIMENTS = ["appreciative", "relieved", "neutral", "confused", "impatient", "anxious", "frustrated", "resigned", "hostile"];

export const FIELD_LABEL: Record<FieldName, string> = {
  outcome: "Outcome", escalated: "Handed to a human", intents: "What the caller wanted", sentiment: "Caller's worst mood",
};
export const REASON_LABEL: Record<string, string> = {
  judge_wrong: "The automatic judge was wrong", transcript_error: "Transcript error",
  unclear_call: "The call is unclear", missing_context: "Missing context", other: "Other",
};
export const OUTCOME_LABEL: Record<string, string> = {
  resolved: "Resolved", handed_off: "Handed off", dropped: "Dropped", no_request: "No request",
};

/** Intent rows as the server stores them: trimmed names, blank rows dropped. */
export const cleanIntents = (l: Intent[]): Intent[] =>
  l.map((i) => ({ name: i.name.trim(), resolved: i.resolved })).filter((i) => i.name);

const norm = (f: FieldName, v: Fields[FieldName]) => JSON.stringify(f === "intents" ? cleanIntents(v as Intent[]) : v);

/** Fields where the draft differs from the current (corrected) value. Each needs a reason before saving. */
export const changedFields = (current: Fields, draft: Fields): FieldName[] =>
  FIELD_NAMES.filter((f) => norm(f, current[f]) !== norm(f, draft[f]));

/** Why a field can't be saved yet, or null when it can. */
export function saveBlocker(f: FieldName, draft: Fields, reason: string | undefined): string | null {
  if (!reason) return "Choose a reason first.";
  if (f === "intents") {
    const named = cleanIntents(draft.intents);
    if (named.length > MAX_INTENTS) return `At most ${MAX_INTENTS} intents.`;
    if (draft.intents.some((i) => i.name.length > 120)) return "Intent names can be at most 120 characters.";
  }
  return null;
}

/** Body for POST /calls/{id}/corrections. */
export const buildCorrection = (f: FieldName, draft: Fields, reason: string) => ({
  field: f,
  corrected_value: f === "intents" ? cleanIntents(draft.intents) : draft[f],
  reason,
});

export function fmtValue(f: FieldName, v: unknown): string {
  if (f === "escalated") return v ? "Yes" : "No";
  if (f === "outcome") return OUTCOME_LABEL[v as string] ?? String(v);
  if (f === "sentiment") return v ? String(v) : "None";
  const l = (v as Intent[] | null) ?? [];
  return l.length ? l.map((i) => `${i.name} (${i.resolved ? "resolved" : "unresolved"})`).join(", ") : "None";
}

// ---- keyboard shortcuts on the call page ----
export type Shortcut =
  | { type: "call"; by: 1 | -1 } | { type: "play" } | { type: "seek"; by: number }
  | { type: "outcome"; value: string } | { type: "escalate" } | { type: "reviewed" } | { type: "help" };
type Key = { key: string; ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean; target?: unknown };
type El = { tagName?: string; isContentEditable?: boolean } | null | undefined;

const OUTCOME_KEYS = ["resolved", "handed_off", "dropped", "no_request"];

/** Maps a keydown to an action, or null. Never fires while typing, or with modifiers. */
export function shortcutFor(e: Key): Shortcut | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  const el = e.target as El;
  const tag = el?.tagName?.toUpperCase();
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable) return null;
  if (e.key === " ") return tag === "BUTTON" || tag === "A" ? null : { type: "play" }; // space activates a focused button
  if (e.key === "j") return { type: "call", by: 1 };
  if (e.key === "k") return { type: "call", by: -1 };
  if (e.key === "[") return { type: "seek", by: -5 };
  if (e.key === "]") return { type: "seek", by: 5 };
  if (e.key >= "1" && e.key <= "4") return { type: "outcome", value: OUTCOME_KEYS[+e.key - 1] };
  if (e.key === "e") return { type: "escalate" };
  if (e.key === "r") return { type: "reviewed" };
  if (e.key === "?") return { type: "help" };
  return null;
}

/** Calls of a lead that can be reviewed, in order; j/k move through these. */
export const reviewableIds = (calls: { conversation_id: string | null; stage: string }[]): string[] =>
  calls.filter((c) => c.conversation_id && c.stage === "analysed").map((c) => c.conversation_id as string);

export function neighbour(ids: string[], current: string, by: 1 | -1): string | null {
  const i = ids.indexOf(current);
  return i < 0 ? null : (ids[i + by] ?? null);
}

/** Where to send someone after Clerk sign-in: the staff URL they were on (deep link kept), never the hash or anything outside /staff. */
export function staffReturnUrl(loc: { pathname: string; search: string }): string {
  return loc.pathname === "/staff" || loc.pathname.startsWith("/staff/") ? loc.pathname + loc.search : "/staff";
}

/** Report can be sent only when something is analysed, nothing is still processing, and every analysed call is signed off. */
export function reportBlocker(calls: { stage: string; reviewed_at: string | null }[]): string | null {
  const analysed = calls.filter((c) => c.stage === "analysed");
  if (calls.some((c) => ["received", "transcribing", "analysing", "not_started"].includes(c.stage))) return "Some calls are still being processed.";
  if (!analysed.length) return "No call has been analysed, so there is nothing to report.";
  const open = analysed.filter((c) => !c.reviewed_at).length;
  return open ? `${open} analysed call${open === 1 ? " is" : "s are"} not signed off yet.` : null;
}
