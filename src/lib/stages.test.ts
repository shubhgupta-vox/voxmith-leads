import { describe, expect, it } from "vitest";
import { fileLabel, isBad } from "./stages";

describe("fileLabel", () => {
  it("distinguishes not uploaded from waiting", () => {
    expect(fileLabel("not_started", false)).toBe("Not uploaded");
    expect(fileLabel("not_started", true)).toBe("Waiting to start");
  });
  it("flags failed/rejected", () => {
    expect(isBad("failed") && isBad("rejected") && !isBad("analysed")).toBe(true);
  });
});
