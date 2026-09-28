import { categoryLabel, categoryTone } from "@/lib/constants";

/** Category is the main dimension people scan a list by, so it gets a colour. */
export function CategoryChip({ value }: { value: string }) {
  return <span className={`chip chip--${categoryTone(value)}`}>{categoryLabel(value)}</span>;
}
