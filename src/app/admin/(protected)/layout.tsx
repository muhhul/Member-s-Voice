import { logout } from "@/app/admin/login/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireRole } from "@/lib/session";
import "../../admin.css";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireRole(["master", "viewer"]);

  const items: { href: string; label: string; icon: "voices" | "users" }[] = [
    { href: "/admin", label: "Daftar Suara", icon: "voices" },
  ];
  if (user.role === "master") {
    items.push({ href: "/admin/users", label: "Akun Manajemen", icon: "users" });
  }

  return (
    <div className="admin-shell">
      <nav className="admin-bar">
        <div className="admin-bar__inner">
          <AdminNav items={items} />
          <span className="admin-bar__spacer" />
          <span className="admin-bar__who">
            {user.name} &middot; {user.role === "master" ? "Master" : "Manajemen"}
          </span>
          <form action={logout} className="admin-bar__logout">
            <button className="btn-ghost" type="submit">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M15 17v1.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2V7"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                />
                <path
                  d="M19.5 12H9.5m10 0-3-3m3 3-3 3"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Keluar
            </button>
          </form>
        </div>
      </nav>
      <main className="admin-main">
        <div className="admin-panel">{children}</div>
      </main>
    </div>
  );
}
