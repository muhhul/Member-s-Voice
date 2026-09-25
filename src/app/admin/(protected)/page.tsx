import { requireRole } from "@/lib/session";

export default async function AdminPage() {
  const user = await requireRole(["master", "viewer"]);
  return (
    <main className="container container--wide">
      <div className="card">
        <p>Masuk sebagai {user.email}.</p>
      </div>
    </main>
  );
}
