import { describe, expect, it } from "vitest";
import { DISCLOSURE, PRIVACY_LIST, SAMPLE } from "../data/burnCopy";

describe("burn page copy", () => {
  it("lists the disclosure in the privacy fold", () => expect(PRIVACY_LIST).toContain(DISCLOSURE));
  it("never says calls", () => expect(JSON.stringify({ DISCLOSURE, PRIVACY_LIST, SAMPLE }).toLowerCase()).not.toMatch(/\bcalls?\b/));
  it("sample numbers add up", () => expect(Math.round((SAMPLE.resolved / SAMPLE.counted) * 100)).toBe(SAMPLE.rate));
  it("sample share is a percent", () => expect(SAMPLE.share).toBeGreaterThan(0));
});

describe("burn leaderboard", () => {
  it("formats dates without timezone shifts", async () => {
    const { boardDate } = await import("../pages/BurnLeaderboard");
    expect(boardDate("2026-11-03")).toBe("Nov 3, 2026");
  });
  it("tells people about the public board and how to leave it", () => {
    expect(DISCLOSURE).toContain("public Burn leaderboard");
    expect(PRIVACY_LIST.join(" ")).toContain("/burn off takes you off it");
  });
});

describe("leaderboard money", () => {
  it("formats cents as dollars and shows a dash when missing", async () => {
    const { usd } = await import("../pages/BurnLeaderboard");
    expect(usd(41459)).toBe("$414.59");
    expect(usd(123456789)).toBe("$1,234,567.89");
    expect(usd(0)).toBe("$0.00");
    expect(usd(null)).toBe("-");
  });
});
