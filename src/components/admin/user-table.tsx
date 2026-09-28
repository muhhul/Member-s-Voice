import { setUserActive } from "@/app/admin/(protected)/users/actions";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ResetPasswordForm } from "@/components/admin/user-admin";
import type { AdminUserSummary } from "@/db/columns";
import { formatDateJakarta } from "@/lib/format";

/**
 * Counterpart to voice-table. Keeps its data-label attributes so the shared
 * card layout works on a phone: unlike a voice row, Email / Peran / Status
 * cannot be read off their values alone, so the labels stay visible there.
 */
export function UserTable({
  users,
  actorId,
}: {
  users: AdminUserSummary[];
  actorId: string;
}) {
  return (
    <div className="panel panel--scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Email</th>
            <th scope="col">Nama</th>
            <th scope="col">Peran</th>
            <th scope="col">Status</th>
            <th scope="col">Dibuat</th>
            <th scope="col">Kata Sandi</th>
            <th scope="col" className="data-table__actions">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td data-label="Email">{user.email}</td>
              <td data-label="Nama">{user.name}</td>
              <td data-label="Peran">
                <span className={user.role === "master" ? "chip chip--rose" : "chip chip--slate"}>
                  {user.role === "master" ? "Master" : "Manajemen"}
                </span>
              </td>
              <td data-label="Status">
                <span className={user.isActive ? "chip chip--green" : "chip chip--slate"}>
                  {user.isActive ? "Aktif" : "Nonaktif"}
                </span>
              </td>
              <td className="data-table__nowrap" data-label="Dibuat">
                {formatDateJakarta(user.createdAt)}
              </td>
              <td data-label="Kata Sandi">
                <ResetPasswordForm userId={user.id} />
              </td>
              <td className="data-table__actions" data-label="Aksi">
                {user.id === actorId ? (
                  <span className="hint">Akun Anda</span>
                ) : (
                  /*
                   * The master's own row has no button, but that is only the
                   * UI half of the rule: setUserActive refuses a self-target
                   * server-side, because this form can be POSTed directly.
                   */
                  <form action={setUserActive}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="active" value={user.isActive ? "false" : "true"} />
                    <ConfirmButton
                      label={user.isActive ? "Nonaktifkan" : "Aktifkan"}
                      confirmLabel={user.isActive ? "Ya, nonaktifkan" : "Ya, aktifkan"}
                    />
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
