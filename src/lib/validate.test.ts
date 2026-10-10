import { describe, expect, it } from "vitest";
import { contentTypeFor, countLabel, fillCode, slotsLeft, validateDuration, validateFile, validateStart } from "./validate";
import { UPLOAD_NOTICE } from "./copy";

describe("validateStart", () => {
  const ok = { name: "Ann", email: "a@b.co", company: "Acme", desc: "Books appointments" };
  it("needs no consent field", () => expect(validateStart(ok, 1)).toEqual({}));
  it("flags missing fields and files", () => {
    expect(Object.keys(validateStart({ name: " ", email: "x", company: "", desc: " " }, 0)).sort()).toEqual(["company", "desc", "email", "files", "name"]);
  });
  it("the notice states what the user agrees to", () => expect(UPLOAD_NOTICE).toMatch(/analyse them and send you the report.*delete everything/));
  it("no longer mentions storing recordings or calls", () => expect(UPLOAD_NOTICE).not.toMatch(/store|recording|calls/i));
});

const f = (name: string, size = 1000, type = "") => ({ name, type, size });

describe("validateFile", () => {
  it("accepts mp3/wav/m4a", () => {
    for (const n of ["a.mp3", "b.WAV", "c.m4a"]) expect(validateFile(f(n), 0)).toBeNull();
  });
  it("accepts txt/json transcripts, with their own small size cap", () => {
    for (const n of ["a.txt", "b.JSON"]) expect(validateFile(f(n), 0)).toBeNull();
    expect(validateFile(f("a.txt", 301 * 1024), 0)).toMatch(/Too large/);
  });
  it("rejects other types, empty, oversize and the 11th file", () => {
    expect(validateFile(f("a.ogg"), 0)).toMatch(/Unsupported/);
    expect(validateFile(f("a.mp3", 0), 0)).toMatch(/empty/);
    expect(validateFile(f("a.mp3", 51 * 1048576), 0)).toMatch(/Too large/);
    expect(validateFile(f("a.mp3"), 10)).toMatch(/up to 10/);
  });
  it("maps content types onto the contract whitelist", () => {
    expect(contentTypeFor(f("a.mp3"))).toBe("audio/mpeg");
    expect(contentTypeFor(f("a.m4a", 1, "audio/x-m4a"))).toBe("audio/x-m4a");
    expect(contentTypeFor(f("a.m4a", 1, "video/mp4"))).toBe("audio/mp4");
  });
  it("duration limit is 15 min; unknown passes", () => {
    expect(validateDuration(901)).toMatch(/Too long/);
    expect(validateDuration(900)).toBeNull();
    expect(validateDuration(null)).toBeNull();
  });
});

describe("countLabel", () => {
  it("reads N of 10 and flags full", () => {
    expect(countLabel(3)).toBe("3 of 10");
    expect(countLabel(10, 10)).toBe("10 of 10");
    expect(slotsLeft(4)).toBe(6);
    expect(slotsLeft(12)).toBe(0);
  });
});

describe("fillCode", () => {
  const empty = Array(6).fill("");
  it("types a digit and advances", () => expect(fillCode(empty, 0, "4")).toMatchObject({ digits: ["4", "", "", "", "", ""], focus: 1 }));
  it("spreads a paste across boxes, ignoring non-digits", () => {
    const r = fillCode(empty, 0, "12 34-56");
    expect(r.digits.join("")).toBe("123456");
    expect(r.focus).toBe(5);
  });
  it("paste in the middle truncates", () => expect(fillCode(empty, 4, "9999").digits).toEqual(["", "", "", "", "9", "9"]));
  it("clears on non-digit", () => expect(fillCode(["1", "2", "", "", "", ""], 1, "x").digits[1]).toBe(""));
});
