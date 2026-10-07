import { describe, expect, it } from "vitest";
import { curvePoints, judgeNote, nOfD, pct, quoteAt, sentimentByIdx, stateScore, worstMood, zeroY } from "./analysis";

describe("analysis helpers", () => {
  it("formats tiles", () => {
    expect(nOfD(3, 9)).toBe("3 of 9 calls");
    expect(pct(0.3333)).toBe("33%");
    expect(pct(null)).toBe("n/a");
  });
  it("notes only real differences from the judge", () => {
    expect(judgeNote(0.5, 0.3333)).toBe("judge said 33%");
    expect(judgeNote(0.3333, 0.3333)).toBeNull();
    expect(judgeNote(null, 0.2)).toBeNull();
  });
  it("maps states to a score around neutral", () => {
    expect(stateScore("neutral")).toBe(0);
    expect(stateScore("relieved")).toBeGreaterThan(0);
    expect(stateScore("frustrated")).toBeLessThan(0);
    expect(stateScore("unknown")).toBe(0);
    expect(stateScore("hostile")).toBeLessThan(stateScore("impatient"));
  });
  it("places positive above and negative below the zero line", () => {
    const p = curvePoints([{ idx: 1, state: "relieved" }, { idx: 3, state: "frustrated" }], 200, 100);
    expect(p[0].y).toBeLessThan(zeroY(100));
    expect(p[1].y).toBeGreaterThan(zeroY(100));
    expect(p[0].x).toBeLessThan(p[1].x);
    expect(curvePoints([{ idx: 1, state: "neutral" }], 200, 100)[0].y).toBe(zeroY(100));
  });
  it("joins sentiment to turns by idx and finds the worst mood", () => {
    const m = sentimentByIdx([{ idx: 3, state: "anxious" }]);
    expect(m.get(3)?.state).toBe("anxious");
    expect(m.get(2)).toBeUndefined();
    expect(worstMood([{ idx: 1, state: "neutral" }, { idx: 3, state: "resigned" }])).toBe("resigned");
    expect(worstMood([{ idx: 1, state: "relieved" }])).toBeNull();
  });
  it("finds the evidence quote by span id", () => {
    expect(quoteAt([{ span_id: "a", text: "hi" }], "a")).toBe("hi");
    expect(quoteAt([{ span_id: "a", text: "hi" }], "b")).toBeNull();
  });
});
