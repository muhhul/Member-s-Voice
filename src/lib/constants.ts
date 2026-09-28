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

/**
 * Chip colours are stored as tone names, not hex values.
 *
 * Text-on-background contrast is handled in CSS (.chip--<tone>), where the pale
 * background and the dark text are set as a pair. Hex values here would split
 * that pair apart and make unreadable chips easy to produce.
 */
export const TONES = ["green", "blue", "amber", "slate"] as const;

export type Tone = (typeof TONES)[number];

export const CATEGORY_TONES: Record<Category, Tone> = {
  safety: "green",
  hr: "blue",
  facility_improvement: "amber",
};

/** "slate" covers legacy values no longer present in CATEGORIES. */
export function categoryTone(value: string): Tone {
  return CATEGORY_TONES[value as Category] ?? "slate";
}

export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 2000;

/** Rows per page on the admin voice list. */
export const PAGE_SIZE = 25;
