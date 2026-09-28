import type { Voice } from "@/db/schema";
import { CategoryChip } from "@/components/admin/category-chip";
import { DeleteVoiceButton } from "@/components/admin/delete-voice-button";
import { formatDateJakarta } from "@/lib/format";

export function VoiceTable({ rows, canDelete }: { rows: Voice[]; canDelete: boolean }) {
  if (rows.length === 0) {
    return (
      <div className="panel">
        <p className="empty">Tidak ada suara yang cocok dengan filter ini.</p>
      </div>
    );
  }

  return (
    <div className="panel panel--scroll">
      <table className="data-table data-table--compact">
        <thead>
          <tr>
            <th scope="col">Tanggal</th>
            <th scope="col">Kategori</th>
            <th scope="col">Pesan</th>
            {canDelete ? (
              <th scope="col" className="data-table__actions">
                Aksi
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {/* Tanggal saja. Jangan pernah merender row.createdAt dengan jam. */}
              <td className="data-table__nowrap" data-label="Tanggal">
                {formatDateJakarta(row.createdAt)}
              </td>
              <td className="data-table__nowrap" data-label="Kategori">
                <CategoryChip value={row.category} />
              </td>
              <td className="data-table__msg" data-label="Pesan">
                {row.message}
              </td>
              {canDelete ? (
                <td className="data-table__actions">
                  <DeleteVoiceButton voiceId={row.id} />
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
