import { setUserActive } from "@/app/admin/(protected)/users/actions";
import { ConfirmButton } from "@/components/confirm-button";
import { CreateUserForm, ResetPasswordForm } from "@/components/user-admin";
import { formatDateJakarta } from "@/lib/format";
import { listAdminUsers } from "@/lib/queries";
import { requireRole } from "@/lib/session";

export default async function UsersPage() {
  const actor = await requireRole(["master"]);
  const users = await listAdminUsers();

  return (
    <main className="container container--wide">
      <h1>Akun Manajemen</h1>
      <p className="hint">
        Akun dinonaktifkan, tidak pernah dihapus, supaya riwayat aksesnya tetap jelas.
      </p>

      <CreateUserForm />

      <div className="card table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Email</th>
              <th scope="col">Nama</th>
              <th scope="col">Peran</th>
              <th scope="col">Status</th>
              <th scope="col">Dibuat</th>
              <th scope="col">Kata Sandi</th>
              <th scope="col">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.name}</td>
                <td>{user.role === "master" ? "Master" : "Manajemen"}</td>
                <td>{user.isActive ? "Aktif" : "Nonaktif"}</td>
                <td style={{ whiteSpace: "nowrap" }}>{formatDateJakarta(user.createdAt)}</td>
                <td>
                  <ResetPasswordForm userId={user.id} />
                </td>
                <td>
                  {user.id === actor.id ? (
                    <span className="hint">Akun Anda</span>
                  ) : (
                    <form action={setUserActive}>
                      <input type="hidden" name="userId" value={user.id} />
                      <input
                        type="hidden"
                        name="active"
                        value={user.isActive ? "false" : "true"}
                      />
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
    </main>
  );
}
