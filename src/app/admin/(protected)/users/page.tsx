import { PageHeader } from "@/components/admin/page-header";
import { CreateUserForm } from "@/components/admin/user-admin";
import { UserTable } from "@/components/admin/user-table";
import { listAdminUsers } from "@/lib/queries";
import { requireRole } from "@/lib/session";

export default async function UsersPage() {
  const actor = await requireRole(["master"]);
  const users = await listAdminUsers();

  return (
    <>
      <PageHeader
        title="Akun Manajemen"
        icon={
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="9" cy="8" r="3.4" fill="currentColor" />
            <path d="M3 20c0-3.3 2.7-5.6 6-5.6s6 2.3 6 5.6z" fill="currentColor" />
            <path
              d="M16.4 5.6a3.4 3.4 0 0 1 0 6.4M17.6 15c2.3.7 3.9 2.6 3.9 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        }
        subtitle="Akun dinonaktifkan, tidak pernah dihapus, supaya riwayat aksesnya tetap jelas."
      />

      {/*
        Creating an account is an occasional task; what people usually open this
        page for is the list. So the form is folded away and the list comes first.
      */}
      <details className="fold">
        <summary>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
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

      <UserTable users={users} actorId={actor.id} />
    </>
  );
}
