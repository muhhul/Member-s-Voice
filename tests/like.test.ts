import { describe, expect, it } from "vitest";
import { escapeLike } from "@/lib/like";

const BACKSLASH = String.fromCharCode(92);

describe("escapeLike", () => {
  it("leaves ordinary text alone", () => {
    expect(escapeLike("licin")).toBe("licin");
  });

  it("escapes a percent sign so it is not a wildcard", () => {
    expect(escapeLike("100%")).toBe("100" + BACKSLASH + "%");
  });

  it("escapes an underscore so it is not a single-character wildcard", () => {
    expect(escapeLike("shift_2")).toBe("shift" + BACKSLASH + "_2");
  });

  it("escapes a backslash", () => {
    expect(escapeLike("a" + BACKSLASH + "b")).toBe("a" + BACKSLASH + BACKSLASH + "b");
  });

  it("escapes every metacharacter in a mixed term", () => {
    expect(escapeLike("50%_off")).toBe("50" + BACKSLASH + "%" + BACKSLASH + "_off");
  });
});
