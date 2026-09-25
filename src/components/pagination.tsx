import Link from "next/link";
import { toQueryString } from "@/lib/query-string";
import type { VoiceFilters } from "@/lib/validation";

export function Pagination({
  filters,
  page,
  pageCount,
}: {
  filters: VoiceFilters;
  page: number;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;

  const hrefFor = (target: number) => {
    const query = toQueryString(filters, { page: target });
    return query ? `/admin?${query}` : "/admin";
  };

  return (
    <nav className="row-actions" style={{ alignItems: "center", marginTop: 16 }}>
      {page > 1 ? <Link href={hrefFor(page - 1)}>&larr; Sebelumnya</Link> : <span />}
      <span className="hint">
        Halaman {page} dari {pageCount}
      </span>
      {page < pageCount ? <Link href={hrefFor(page + 1)}>Berikutnya &rarr;</Link> : <span />}
    </nav>
  );
}
