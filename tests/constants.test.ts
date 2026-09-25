import { describe, expect, it } from "vitest";
import { CATEGORIES, CATEGORY_LABELS, categoryLabel } from "@/lib/constants";

describe("categories", () => {
  it("holds exactly the three agreed categories in order", () => {
    expect(CATEGORIES).toEqual(["safety", "hr", "facility_improvement"]);
  });

  it("has an Indonesian label for every category", () => {
    for (const category of CATEGORIES) {
      expect(CATEGORY_LABELS[category]).toBeTruthy();
    }
  });

  it("maps a known value to its Indonesian label", () => {
    expect(categoryLabel("facility_improvement")).toBe("Perbaikan Fasilitas");
  });

  it("falls back to the raw value for an unknown category", () => {
    expect(categoryLabel("legacy_value")).toBe("legacy_value");
  });
});
