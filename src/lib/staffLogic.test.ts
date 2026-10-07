import { describe, expect, it } from "vitest";
import { buildCorrection, changedFields, fmtValue, neighbour, reportBlocker, reviewableIds, saveBlocker, shortcutFor, type Fields } from "./staffLogic";

const cur: Fields = { outcome: "dropped", escalated: false, intents: [{ name: "Book", resolved: false }], sentiment: "frustrated" };

describe("changedFields", () => {
  it("is empty for an identical draft, ignoring blank intent rows and padding", () => {
    expect(changedFields(cur, { ...cur, intents: [{ name: " Book ", resolved: false }, { name: "  ", resolved: true }] })).toEqual([]);
  });
  it("lists exactly the edited fields", () => {
    expect(changedFields(cur, { ...cur, outcome: "resolved", sentiment: null })).toEqual(["outcome", "sentiment"]);
    expect(changedFields(cur, { ...cur, intents: [{ name: "Book", resolved: true }] })).toEqual(["intents"]);
  });
});

describe("saveBlocker / buildCorrection", () => {
  it("needs a reason", () => {
    expect(saveBlocker("outcome", cur, undefined)).toMatch(/reason/);
    expect(saveBlocker("outcome", cur, "other")).toBeNull();
  });
  it("caps intents at 10 and name length", () => {
    const many = Array.from({ length: 11 }, (_, i) => ({ name: "n" + i, resolved: true }));
    expect(saveBlocker("intents", { ...cur, intents: many }, "other")).toMatch(/10/);
    expect(saveBlocker("intents", { ...cur, intents: [{ name: "x".repeat(121), resolved: true }] }, "other")).toMatch(/120/);
  });
  it("builds the request body, trimming intents and keeping null sentiment", () => {
    expect(buildCorrection("intents", { ...cur, intents: [{ name: " A ", resolved: true }, { name: "", resolved: false }] }, "judge_wrong"))
      .toEqual({ field: "intents", corrected_value: [{ name: "A", resolved: true }], reason: "judge_wrong" });
    expect(buildCorrection("sentiment", { ...cur, sentiment: null }, "other")).toEqual({ field: "sentiment", corrected_value: null, reason: "other" });
    expect(buildCorrection("escalated", { ...cur, escalated: true }, "other").corrected_value).toBe(true);
  });
  it("formats values for humans", () => {
    expect(fmtValue("escalated", true)).toBe("Yes");
    expect(fmtValue("sentiment", null)).toBe("None");
    expect(fmtValue("intents", cur.intents)).toBe("Book (unresolved)");
    expect(fmtValue("outcome", "handed_off")).toBe("Handed off");
  });
});

describe("shortcutFor", () => {
  const k = (key: string, target?: { tagName: string }) => shortcutFor({ key, target });
  it("maps keys", () => {
    expect(k("j")).toEqual({ type: "call", by: 1 });
    expect(k("k")).toEqual({ type: "call", by: -1 });
    expect(k(" ")).toEqual({ type: "play" });
    expect(k("[")).toEqual({ type: "seek", by: -5 });
    expect(k("]")).toEqual({ type: "seek", by: 5 });
    expect(k("1")).toEqual({ type: "outcome", value: "resolved" });
    expect(k("4")).toEqual({ type: "outcome", value: "no_request" });
    expect(k("e")).toEqual({ type: "escalate" });
    expect(k("r")).toEqual({ type: "reviewed" });
    expect(k("?")).toEqual({ type: "help" });
    expect(k("5")).toBeNull();
  });
  it("does not fire while typing, or on a focused button for space, or with modifiers", () => {
    for (const t of ["INPUT", "TEXTAREA", "SELECT"]) expect(k("j", { tagName: t })).toBeNull();
    expect(shortcutFor({ key: "j", target: { isContentEditable: true } })).toBeNull();
    expect(k(" ", { tagName: "BUTTON" })).toBeNull();
    expect(k("r", { tagName: "BUTTON" })).toEqual({ type: "reviewed" });
    expect(shortcutFor({ key: "r", metaKey: true })).toBeNull();
    expect(shortcutFor({ key: "r", ctrlKey: true })).toBeNull();
  });
});

describe("navigation and report gating", () => {
  const calls = [
    { conversation_id: "a", stage: "analysed", reviewed_at: "t" },
    { conversation_id: null, stage: "received", reviewed_at: null },
    { conversation_id: "b", stage: "analysed", reviewed_at: null },
    { conversation_id: "c", stage: "failed", reviewed_at: null },
  ];
  it("steps through analysed calls only", () => {
    const ids = reviewableIds(calls);
    expect(ids).toEqual(["a", "b"]);
    expect(neighbour(ids, "a", 1)).toBe("b");
    expect(neighbour(ids, "a", -1)).toBeNull();
    expect(neighbour(ids, "zzz", 1)).toBeNull();
  });
  it("explains why the report is blocked", () => {
    expect(reportBlocker(calls)).toMatch(/still being processed/);
    expect(reportBlocker([calls[0], calls[2], calls[3]])).toMatch(/1 analysed call is not signed off/);
    expect(reportBlocker([calls[0], calls[3]])).toBeNull();
    expect(reportBlocker([calls[3]])).toMatch(/nothing to report/);
  });
});
