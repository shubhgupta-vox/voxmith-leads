// Pure helpers for the staff analysis views (no React, no network), so they can be unit-tested.

/** "3 of 9 calls" for a tile: the counts behind a rate. */
export const nOfD = (num: number, den: number, noun = "calls") => `${num} of ${den} ${noun}`;

/** 0.3333 -> "33%", null -> "n/a" (never 0 for something that can't be measured). */
export const pct = (v: number | null | undefined) => (v == null ? "n/a" : `${Math.round(v * 100)}%`);

/** Small note shown when the reviewed value differs from what the judge said; null when equal. */
export function judgeNote(reviewed: number | null | undefined, judge: number | null | undefined, fmt: (v: number | null) => string = pct): string | null {
  if (reviewed == null || judge == null) return null;
  return Math.abs(reviewed - judge) < 0.005 ? null : `judge said ${fmt(judge)}`;
}

/** Position of each mood on the curve: neutral 0, good above, bad below. Drawn from the state label only. */
export const STATE_SCORE: Record<string, number> = {
  appreciative: 2, relieved: 1, neutral: 0, confused: -0.5, anxious: -0.5, impatient: -1, frustrated: -2, resigned: -2, hostile: -3,
};
export const stateScore = (s: string): number => STATE_SCORE[s] ?? 0;

export type SentTurn = { idx: number; state: string; secondary?: string | null; intensity?: number | null; confidence?: number | null; quote?: string };

/** Customer-turn mood by turn index, for the transcript chips. */
export const sentimentByIdx = (turns: SentTurn[] | undefined): Map<number, SentTurn> => new Map((turns ?? []).map((t) => [t.idx, t]));

const MAX = 3; // fixed scale so two calls can be compared by eye
/** Zero-line y. */
export const zeroY = (h: number, pad = 12) => pad + (MAX * (h - 2 * pad)) / (2 * MAX);

/** SVG points for the curve: x spread evenly over the scored turns, y from the state score. */
export function curvePoints(turns: SentTurn[], w: number, h: number, pad = 12): { x: number; y: number; t: SentTurn }[] {
  return turns.map((t, i) => ({
    x: turns.length < 2 ? w / 2 : pad + (i * (w - 2 * pad)) / (turns.length - 1),
    y: pad + ((MAX - Math.max(-MAX, Math.min(MAX, stateScore(t.state)))) * (h - 2 * pad)) / (2 * MAX),
    t,
  }));
}

/** The caller's words at a given span (evidence for an intent), from the transcript. */
export const quoteAt = (turns: { span_id: string; text: string }[], spanId: string | null | undefined): string | null =>
  (spanId && turns.find((t) => t.span_id === spanId)?.text) || null;

/** The worst mood in a call, by score; null when nothing scored below neutral. */
export function worstMood(turns: SentTurn[] | undefined): string | null {
  const worst = (turns ?? []).reduce<SentTurn | null>((a, t) => (!a || stateScore(t.state) < stateScore(a.state) ? t : a), null);
  return worst && stateScore(worst.state) < 0 ? worst.state : null;
}

export const gradeLabel = (g: string | null | undefined) => (g ? g.replace(/_/g, " ") : "n/a");
export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
