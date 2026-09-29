import { describe, expect, it } from "vitest";
import { CATEGORIES, CATEGORY_LABELS, categoryLabel } from "@/lib/constants";

describe("categories", () => {
  it("holds exactly the six agreed categories in order", () => {
    expect(CATEGORIES).toEqual([
      "safety",
      "productivity",
      "quality",
      "cost",
      "environment",
      "delivery",
    ]);
  });

  it("has a label for every category", () => {
    for (const category of CATEGORIES) {
      expect(CATEGORY_LABELS[category]).toBeTruthy();
    }
  });

  it("maps a known value to its label", () => {
    expect(categoryLabel("quality")).toBe("Quality");
  });

  /**
   * Category is stored as text so the list can change without a migration,
   * which means rows written under an older list keep values no longer in
   * CATEGORIES. They must still render as something rather than vanish.
   */
  it("falls back to the raw value for a category no longer in the list", () => {
    expect(categoryLabel("facility_improvement")).toBe("facility_improvement");
  });
});
