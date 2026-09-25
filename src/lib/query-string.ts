import type { VoiceFilters } from "@/lib/validation";

/**
 * Serialises the active filters back into a query string, so pagination links
 * and the CSV export link both carry exactly what the list is showing.
 * Page 1 is omitted because it is the default.
 */
export function toQueryString(
  filters: VoiceFilters,
  overrides: Partial<VoiceFilters> = {},
): string {
  const merged = { ...filters, ...overrides };
  const params = new URLSearchParams();

  if (merged.category) params.set("category", merged.category);
  if (merged.from) params.set("from", merged.from);
  if (merged.to) params.set("to", merged.to);
  if (merged.q) params.set("q", merged.q);
  if (merged.page && merged.page > 1) params.set("page", String(merged.page));

  return params.toString();
}
