import { describe, expect, it } from "vitest";
import { fileLabel, isBad, leadMessage } from "./stages";

describe("leadMessage", () => {
  it("only says the report was sent when delivered", () => {
    for (const s of ["awaiting_verification", "processing", "in_review"] as const) {
      expect(leadMessage(s, "within 3 business days").title).not.toMatch(/sent|ready/i);
    }
    expect(leadMessage("delivered", "x").title).toMatch(/sent/);
  });
  it("shows the expected delivery while work is pending", () => {
    expect(leadMessage("processing", "within 3 business days").body).toMatch(/within 3 business days/);
  });
  it("does not claim a review when nothing was analysed", () => {
    expect(leadMessage("in_review", "x", false).title).toMatch(/could not analyse/);
  });
  it("says analysing only starts after email confirmation", () => {
    expect(leadMessage("awaiting_verification", "").body).toMatch(/confirm your email/);
  });
});

describe("fileLabel", () => {
  it("distinguishes not uploaded from waiting", () => {
    expect(fileLabel("not_started", false)).toBe("Not uploaded");
    expect(fileLabel("not_started", true)).toBe("Waiting to start");
  });
  it("flags failed/rejected", () => {
    expect(isBad("failed") && isBad("rejected") && !isBad("analysed")).toBe(true);
  });
});
