import { describe, expect, it } from "vitest";
import {
  handleProblem,
  isValidHandle,
  normalizeHandle,
  suggestHandle,
} from "./handle";

describe("normalizeHandle", () => {
  it("folds case, because two cases of one name is impersonation", () => {
    expect(normalizeHandle("  Anthony ")).toBe("anthony");
    expect(normalizeHandle("ANTHONY")).toBe(normalizeHandle("anthony"));
  });
});

describe("handleProblem", () => {
  it("accepts the ordinary ones", () => {
    for (const handle of ["ant", "anthony", "anthony_s", "a1", "lifter99"]) {
      if (handle.length >= 3) expect(isValidHandle(handle)).toBe(true);
    }
  });

  it("names what's wrong rather than just refusing", () => {
    expect(handleProblem("ab")).toBe("too-short");
    expect(handleProblem("a".repeat(21))).toBe("too-long");
    expect(handleProblem("9lives")).toBe("shape");
    expect(handleProblem("anthony.s")).toBe("shape");
    expect(handleProblem("anthony-s")).toBe("shape");
    expect(handleProblem("anthony s")).toBe("shape");
    expect(handleProblem("admin")).toBe("reserved");
    // Reserved is checked after shape, so a name that's both reports the
    // thing the user can most obviously act on.
    expect(handleProblem("NATTY")).toBe("reserved");
  });

  it("judges the folded form, not what was typed", () => {
    expect(handleProblem("  Anthony  ")).toBeUndefined();
  });
});

describe("suggestHandle", () => {
  it("turns a real name into something typeable", () => {
    expect(suggestHandle("Anthony Steiner")).toBe("anthony_steiner");
  });

  it("cuts a long one to the limit rather than suggesting a name that fails", () => {
    // An email is the fallback source, and most are longer than a handle may
    // be — so truncation is the normal path here, not an edge case.
    const suggested = suggestHandle("anthonysteiner96@gmail.com");
    expect(suggested).toBe("anthonysteiner96_gma");
    expect(handleProblem(suggested)).toBeUndefined();
  });

  it("keeps the letters under the accents", () => {
    // "muoz" would be a worse suggestion than a wrong one — it looks like a
    // typo the user made.
    expect(suggestHandle("Muñoz")).toBe("munoz");
    expect(suggestHandle("José García")).toBe("jose_garcia");
  });

  it("always suggests something the rules accept", () => {
    for (const name of [
      "Anthony Steiner",
      "99 Problems",
      "  ",
      "José García",
      "a".repeat(50),
      "___",
      "陳大文",
    ]) {
      const suggested = suggestHandle(name);
      // The empty ones can't be helped — the field just starts blank rather
      // than pre-filled with something invalid.
      if (suggested.length >= 3) {
        expect(handleProblem(suggested)).toBeUndefined();
      }
    }
  });
});
