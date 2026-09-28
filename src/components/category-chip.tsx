import { categoryLabel, categoryTone } from "@/lib/constants";

/** Kategori adalah dimensi utama saat memindai daftar, jadi diberi warna. */
export function CategoryChip({ value }: { value: string }) {
  return <span className={`chip chip--${categoryTone(value)}`}>{categoryLabel(value)}</span>;
}
