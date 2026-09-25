import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getAuthorizedUser } from "@/lib/session";

export default async function LoginPage() {
  // Checked against the database, not just against the cookie. A cookie for a
  // deactivated account must not bounce the visitor into /admin, which would
  // send them straight back here in a loop.
  const user = await getAuthorizedUser(["master", "viewer"]);
  if (user) redirect("/admin");

  return (
    <main className="container">
      <h1>Masuk</h1>
      <p>Halaman ini hanya untuk akun manajemen.</p>
      <LoginForm />
    </main>
  );
}
