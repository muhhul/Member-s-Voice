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
