import { describe, expect, it } from "vitest";
import { CATEGORIES, CATEGORY_TONES, TONES, categoryTone } from "@/lib/constants";

describe("CATEGORY_TONES", () => {
  it("gives every category a tone", () => {
    for (const category of CATEGORIES) {
      expect(TONES).toContain(CATEGORY_TONES[category]);
    }
  });

  it("gives each category its own tone, so chips stay distinguishable", () => {
    const tones = CATEGORIES.map((category) => CATEGORY_TONES[category]);
    expect(new Set(tones).size).toBe(CATEGORIES.length);
  });

  it("maps safety to green", () => {
    expect(categoryTone("safety")).toBe("green");
  });

  /**
   * An unknown value can reach the UI: category is stored as text so the list
   * can change without a migration, which means older rows may hold a value no
   * longer in CATEGORIES.
   */
  it("falls back to a neutral tone for an unknown category", () => {
    expect(categoryTone("legacy_value")).toBe("slate");
  });

  it("includes the neutral tone in the allowed set", () => {
    expect(TONES).toContain("slate");
  });
});
