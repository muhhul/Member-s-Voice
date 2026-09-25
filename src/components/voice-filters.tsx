import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";
import type { VoiceFilters } from "@/lib/validation";

/** A plain GET form, so it needs no client JavaScript. */
export function VoiceFiltersForm({ filters }: { filters: VoiceFilters }) {
  return (
    <form action="/admin" method="get" className="card" style={{ marginBottom: 20 }}>
      <div className="filters">
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
          <input
            id="filter-q"
            name="q"
            type="text"
            defaultValue={filters.q ?? ""}
            placeholder="kata kunci"
          />
        </div>
      </div>

      {/* No page input: applying a filter naturally returns to page 1. */}
      <div className="row-actions">
        <button type="submit">Terapkan</button>
        <a className="hint" href="/admin" style={{ alignSelf: "center" }}>
          Reset
        </a>
      </div>
    </form>
  );
}
