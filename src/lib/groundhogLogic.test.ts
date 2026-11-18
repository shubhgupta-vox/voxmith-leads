import { describe, expect, it } from "vitest";
import { BAR_BLOCKS, DISCLOSURE, PRIVACY_LIST, PRIVACY_SHORT, SAMPLE, bar, barLen } from "../data/groundhogCopy";
import { chartSummary, csvFilename, dayLabel, shortId, showing, toBars } from "./groundhogLogic";

describe("staff helpers", () => {
  it("shortens ids to 8 chars", () => expect(shortId("0f8fad5b-d9cb-469f-a165-70867728950e")).toBe("0f8fad5b"));
  it("labels days without timezone shifts", () => { expect(dayLabel("2026-11-03")).toBe("Nov 3"); expect(dayLabel("2026-01-31")).toBe("Jan 31"); });
  it("names the CSV by date", () => expect(csvFilename(new Date("2026-11-14T10:00:00Z"))).toBe("groundhog-installs-2026-11-14.csv"));
  it("words the paging line", () => {
    expect(showing(1, 50, 120, 50)).toBe("Showing 1 to 50 of 120");
    expect(showing(3, 50, 120, 20)).toBe("Showing 101 to 120 of 120");
    expect(showing(1, 50, 0, 0)).toBe("Showing 0 of 0");
  });
});

describe("toBars / chartSummary", () => {
  const series = [{ day: "2026-11-01", runs: 0, new_people: 0 }, { day: "2026-11-02", runs: 2, new_people: 1 }, { day: "2026-11-03", runs: 4, new_people: 0 }];
  it("scales to the tallest bar, zero stays flat", () => {
    const b = toBars(series, "runs", 300, 100);
    expect(b.map((x) => x.h)).toEqual([0, 50, 100]);
    expect(b.map((x) => x.y)).toEqual([100, 50, 0]);
    expect(b[1].x).toBe(100);
  });
  it("tiny non-zero values stay visible", () => expect(toBars([{ day: "d", runs: 1, new_people: 0 }, { day: "e", runs: 1000, new_people: 0 }], "runs", 10, 100)[0].h).toBe(1));
  it("handles empty and all-zero", () => {
    expect(toBars([], "runs", 10, 10)).toEqual([]);
    expect(toBars([series[0]], "runs", 10, 10)[0].h).toBe(0);
    expect(chartSummary([series[0]], "runs", "runs")).toBe("No runs from Nov 1 to Nov 1.");
  });
  it("summarises total and busiest day", () => expect(chartSummary(series, "runs", "runs")).toBe("6 runs from Nov 1 to Nov 3. Busiest day: Nov 3, 4."));
});

describe("shared sample card data", () => {
  it("bars follow the spec rule (top = 20 blocks, min 1)", () => {
    const top = SAMPLE.top[0][1];
    expect(barLen(top, top)).toBe(BAR_BLOCKS);
    // spec example: 20,17,12,10,7,5,4,3,3 (the spec text shows 2 for the last row; its own rule gives 3)
    expect(SAMPLE.top.map(([, n]) => barLen(n, top))).toEqual([20, 17, 12, 10, 7, 5, 4, 3, 3, 3]);
    expect(barLen(0, top)).toBe(1);
    expect(bar(3)).toBe("███");
  });
  it("keeps the spec numbers", () => {
    expect(SAMPLE.count).toBe(23);
    expect(SAMPLE.cost).toMatchObject({ minutes: 12, messages: 46 });
    expect(SAMPLE.top).toHaveLength(10);
    expect(SAMPLE.weekly.spark).toBe("▁▃▄▅█▂▁·▁");
    expect(SAMPLE.projects.map((p) => p[2])).toEqual([11, 7, 3, 2]);
  });
  it("has the exact disclosure sentence and no forbidden claims", () => {
    expect(DISCLOSURE).toBe("Groundhog tells VoxMith that you ran it, with your account email and a count. It never sends your chats or what you said.");
    expect(PRIVACY_LIST).toContain(DISCLOSURE);
    const all = [...PRIVACY_LIST, PRIVACY_SHORT].join(" ").toLowerCase();
    expect(all).not.toContain("nothing leaves your machine");
    expect(all).not.toContain("nothing is sent");
    expect(all).not.toContain("12 months");
  });
});

describe("burn copy", () => {
  it("names the Burn CSV", () => expect(csvFilename(new Date("2026-11-17T10:00:00Z"), "burn")).toBe("burn-installs-2026-11-17.csv"));
});
