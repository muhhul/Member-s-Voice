export const CATEGORIES = ["safety", "hr", "facility_improvement"] as const;

export type Category = (typeof CATEGORIES)[number];

/** UI copy is Bahasa Indonesia; the stored values stay English. */
export const CATEGORY_LABELS: Record<Category, string> = {
  safety: "Keselamatan (K3)",
  hr: "HR",
  facility_improvement: "Perbaikan Fasilitas",
};

export function categoryLabel(value: string): string {
  return CATEGORY_LABELS[value as Category] ?? value;
}

export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 2000;

/** Rows per page on the admin voice list. */
export const PAGE_SIZE = 25;
