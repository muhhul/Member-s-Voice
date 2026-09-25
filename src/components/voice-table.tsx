import type { Voice } from "@/db/schema";
import { DeleteVoiceButton } from "@/components/delete-voice-button";
import { categoryLabel } from "@/lib/constants";
import { formatDateJakarta } from "@/lib/format";

export function VoiceTable({ rows, canDelete }: { rows: Voice[]; canDelete: boolean }) {
  if (rows.length === 0) {
    return (
      <div className="card">
        <p>Tidak ada suara yang cocok dengan filter ini.</p>
      </div>
    );
  }

  return (
    <div className="card table-scroll">
      <table>
        <thead>
          <tr>
            <th scope="col">Tanggal</th>
            <th scope="col">Kategori</th>
            <th scope="col">Pesan</th>
            {canDelete ? <th scope="col">Aksi</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {/* Date only. Never render row.createdAt with a time. */}
              <td style={{ whiteSpace: "nowrap" }}>{formatDateJakarta(row.createdAt)}</td>
              <td style={{ whiteSpace: "nowrap" }}>{categoryLabel(row.category)}</td>
              <td style={{ minWidth: 280, whiteSpace: "pre-wrap" }}>{row.message}</td>
              {canDelete ? (
                <td>
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
