import Link from "next/link";
import { PageHeader } from "@/components/page-header";
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
    <>
      <PageHeader
        title="Daftar Suara"
        subtitle={`${total} suara ditemukan. Tanggal saja yang ditampilkan, tanpa jam, untuk menjaga anonimitas pengirim.`}
        actions={
          <Link
            className="btn-ghost"
            href={exportQuery ? `/admin/export?${exportQuery}` : "/admin/export"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 3.5v11m0 0 4-4m-4 4-4-4M4.5 16.5v2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Unduh CSV
          </Link>
        }
      />

      <VoiceFiltersForm filters={filters} />
      <VoiceTable rows={rows} canDelete={user.role === "master"} />
      <Pagination filters={filters} page={page} pageCount={pageCount} />
    </>
  );
}
