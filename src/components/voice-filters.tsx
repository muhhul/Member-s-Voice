import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";
import type { VoiceFilters } from "@/lib/validation";

/** Form GET biasa, jadi tidak perlu JavaScript di sisi klien. */
export function VoiceFiltersForm({ filters }: { filters: VoiceFilters }) {
  const hasFilter = Boolean(filters.category || filters.from || filters.to || filters.q);

  return (
    <form action="/admin" method="get" className="panel panel--pad" style={{ marginBottom: 18 }}>
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
          <input
            id="filter-q"
            name="q"
            type="text"
            defaultValue={filters.q ?? ""}
            placeholder="kata kunci"
          />
        </div>
      </div>

      {/* Tanpa input page: menerapkan filter wajar mengembalikan ke halaman 1. */}
      <div className="filter-actions">
        <button type="submit">Terapkan</button>
        {hasFilter ? (
          <a className="btn-ghost" href="/admin">
            Reset
          </a>
        ) : null}
      </div>
    </form>
  );
}
