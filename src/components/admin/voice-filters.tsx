import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";
import type { VoiceFilters } from "@/lib/validation";

/** A plain GET form, so it needs no client-side JavaScript. */
export function VoiceFiltersForm({ filters }: { filters: VoiceFilters }) {
  const hasFilter = Boolean(filters.category || filters.from || filters.to || filters.q);

  return (
    <form action="/admin" method="get" className="filters-panel">
      <div className="filter-bar">
        <div>
          <label htmlFor="filter-category">Kategori</label>
          <select id="filter-category" name="category" defaultValue={filters.category ?? ""}>
            <option value="">Semua kategori</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-from">Dari tanggal</label>
          <input id="filter-from" name="from" type="date" defaultValue={filters.from ?? ""} />
        </div>

        <div>
          <label htmlFor="filter-to">Sampai tanggal</label>
          <input id="filter-to" name="to" type="date" defaultValue={filters.to ?? ""} />
        </div>

        <div>
          <label htmlFor="filter-q">Cari isi pesan</label>
          <span className="search-field">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="6.4" stroke="currentColor" strokeWidth="1.9" />
              <path
                d="m16 16 4 4"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
              />
            </svg>
            <input
              id="filter-q"
              name="q"
              type="text"
              defaultValue={filters.q ?? ""}
              placeholder="kata kunci"
            />
          </span>
        </div>
      </div>

      {/* No page input: applying a filter naturally returns to page 1. */}
      <div className="filter-actions">
        <button type="submit">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M3.5 5.5h17l-6.6 7.6v5.6l-3.8 2v-7.6z"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          Terapkan
        </button>
        {hasFilter ? (
          <a className="btn-ghost" href="/admin">
            Reset
          </a>
        ) : null}
      </div>
    </form>
  );
}
