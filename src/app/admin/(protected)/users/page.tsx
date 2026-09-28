import { setUserActive } from "@/app/admin/(protected)/users/actions";
import { ConfirmButton } from "@/components/confirm-button";
import { PageHeader } from "@/components/page-header";
import { CreateUserForm, ResetPasswordForm } from "@/components/user-admin";
import { formatDateJakarta } from "@/lib/format";
import { listAdminUsers } from "@/lib/queries";
import { requireRole } from "@/lib/session";

export default async function UsersPage() {
  const actor = await requireRole(["master"]);
  const users = await listAdminUsers();

  return (
    <>
      <PageHeader
        title="Akun Manajemen"
        subtitle="Akun dinonaktifkan, tidak pernah dihapus, supaya riwayat aksesnya tetap jelas."
      />

      {/*
        Membuat akun itu kegiatan sesekali; yang dicari saat membuka halaman ini
        biasanya daftarnya. Jadi formnya dilipat dan daftar naik ke atas.
      */}
      <details className="fold">
        <summary>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
          Buat Akun Baru
          <svg
            className="fold__chev"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="m6 9 6 6 6-6"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </summary>
        <div className="fold__body">
          <CreateUserForm />
        </div>
      </details>

      <div className="panel">
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
    </>
  );
}
