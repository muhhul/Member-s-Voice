import Link from "next/link";
import { Pagination } from "@/components/pagination";
import { VoiceFiltersForm } from "@/components/voice-filters";
import { VoiceTable } from "@/components/voice-table";
import { listVoices } from "@/lib/queries";
import { toQueryString } from "@/lib/query-string";
import { requireRole } from "@/lib/session";
import { filtersSchema } from "@/lib/validation";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireRole(["master", "viewer"]);

  const raw = await searchParams;
  const filters = filtersSchema.parse({
    category: raw.category,
    from: raw.from,
    to: raw.to,
    q: raw.q,
    page: raw.page,
  });

  const { rows, total, page, pageCount } = await listVoices(filters);
  const exportQuery = toQueryString(filters, { page: 1 });

  return (
    <main className="container container--wide">
      <div className="row-actions" style={{ alignItems: "baseline" }}>
        <h1 style={{ flex: 1 }}>Daftar Suara</h1>
        <Link href={exportQuery ? `/admin/export?${exportQuery}` : "/admin/export"}>
          Unduh CSV
        </Link>
      </div>

      <p className="hint">
        {total} suara ditemukan. Tanggal saja yang ditampilkan, tanpa jam, untuk menjaga
        anonimitas pengirim.
      </p>

      <VoiceFiltersForm filters={filters} />
      <VoiceTable rows={rows} canDelete={user.role === "master"} />
      <Pagination filters={filters} page={page} pageCount={pageCount} />
    </main>
  );
}
