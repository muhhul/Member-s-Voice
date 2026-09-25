import Link from "next/link";
import { logout } from "@/app/admin/login/actions";
import { requireRole } from "@/lib/session";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireRole(["master", "viewer"]);

  return (
    <>
      <nav className="admin-nav">
        <Link href="/admin">Daftar Suara</Link>
        {user.role === "master" ? <Link href="/admin/users">Akun Manajemen</Link> : null}
        <span className="admin-nav__spacer" />
        <span className="hint">
          {user.name} ({user.role === "master" ? "Master" : "Manajemen"})
        </span>
        <form action={logout}>
          <button className="secondary" type="submit">
            Keluar
          </button>
        </form>
      </nav>
      {children}
    </>
  );
}
