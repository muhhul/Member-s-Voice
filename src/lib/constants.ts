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
 * Warna chip disimpan sebagai nama nada, bukan hex.
 *
 * Kontras teks-di-atas-latar diurus di CSS (.chip--<nada>), tempat pasangan
 * latar muda dan teks gelap bisa disetel bersama. Menaruh hex di sini akan
 * memisahkan keduanya dan mudah menghasilkan chip yang tidak terbaca.
 */
export const TONES = ["green", "blue", "amber", "slate"] as const;

export type Tone = (typeof TONES)[number];

export const CATEGORY_TONES: Record<Category, Tone> = {
  safety: "green",
  hr: "blue",
  facility_improvement: "amber",
};

/** "slate" untuk nilai lama yang sudah tidak ada di CATEGORIES. */
export function categoryTone(value: string): Tone {
  return CATEGORY_TONES[value as Category] ?? "slate";
}

export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 2000;

/** Rows per page on the admin voice list. */
export const PAGE_SIZE = 25;
