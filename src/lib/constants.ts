/**
 * The six QCDSM areas the division reports against.
 *
 * Stored as text rather than a database enum so this list can change without
 * a migration. Rows written under an older list keep their old value and are
 * still rendered - see categoryLabel and categoryTone.
 */
export const CATEGORIES = [
  "safety",
  "productivity",
  "quality",
  "cost",
  "environment",
  "delivery",
] as const;

export type Category = (typeof CATEGORIES)[number];

/**
 * These labels stay English, unlike the rest of the UI copy. They are the
 * division's own QCDSM terms, used in English on the shop floor and on the
 * boards people already read.
 */
export const CATEGORY_LABELS: Record<Category, string> = {
  safety: "Safety",
  productivity: "Productivity",
  quality: "Quality",
  cost: "Cost",
  environment: "Environment",
  delivery: "Delivery",
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
export const TONES = [
  "green",
  "blue",
  "purple",
  "amber",
  "teal",
  "rose",
  "slate",
] as const;

export type Tone = (typeof TONES)[number];

export const CATEGORY_TONES: Record<Category, Tone> = {
  safety: "green",
  productivity: "blue",
  quality: "purple",
  cost: "amber",
  environment: "teal",
  delivery: "rose",
};

/** "slate" covers legacy values no longer present in CATEGORIES. */
export function categoryTone(value: string): Tone {
  return CATEGORY_TONES[value as Category] ?? "slate";
}

export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 2000;

/** Rows per page on the admin voice list. */
export const PAGE_SIZE = 25;
