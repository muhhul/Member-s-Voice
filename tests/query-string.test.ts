import { describe, expect, it } from "vitest";
import { toQueryString } from "@/lib/query-string";

describe("toQueryString", () => {
  it("omits empty filters and page 1", () => {
    expect(toQueryString({ page: 1 })).toBe("");
  });

  it("keeps the filters that are set", () => {
    expect(toQueryString({ category: "safety", q: "licin", page: 1 })).toBe(
      "category=safety&q=licin",
    );
  });

  it("includes a page beyond the first", () => {
    expect(toQueryString({ page: 3 })).toBe("page=3");
  });

  it("applies overrides on top of the current filters", () => {
    expect(toQueryString({ category: "hr", page: 2 }, { page: 5 })).toBe("category=hr&page=5");
  });

  it("encodes values that need it", () => {
    expect(toQueryString({ q: "jam & shift", page: 1 })).toBe("q=jam+%26+shift");
  });
});
