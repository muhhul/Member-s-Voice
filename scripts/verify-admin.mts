/**
 * Manual end-to-end check of the admin authorization rules.
 *
 * These rules cannot be unit tested: they need a running server, a real
 * session cookie and a live database. Without this script the checks get
 * rewritten by hand every time the admin markup changes, which is how they
 * end up not being run at all.
 *
 * Usage:
 *   npm run dev            # in another terminal
 *   npm run verify:admin
 *
 * It creates a throwaway viewer account and deletes it again at the end.
 */
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

const BASE = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";

const { SignJWT } = await import("jose");
const { eq } = await import("drizzle-orm");
const { db } = await import("../src/db/client.ts");
const { adminUsers } = await import("../src/db/schema.ts");
const { hashPassword } = await import("../src/lib/password.ts");

const TEST_EMAIL = "verify-viewer@example.invalid";

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  if (!ok) failures++;
  console.log((ok ? "  PASS  " : "  FAIL  ") + label + (detail ? `  -> ${detail}` : ""));
}

/** Neon scales to zero; the first query after an idle spell can time out. */
async function retry<T>(fn: () => Promise<T>, attempts = 5): Promise<T> {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === attempts) throw error;
      await new Promise((r) => setTimeout(r, 2000 * i));
    }
  }
  throw new Error("unreachable");
}

const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
const mint = (uid: string, role: string) =>
  new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(uid)
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(secret);

async function get(path: string, token?: string) {
  const res = await fetch(BASE + path, {
    headers: token ? { cookie: `mv_session=${token}` } : {},
    redirect: "manual",
  });
  return { status: res.status, html: await res.text() };
}

const [master] = await retry(() =>
  db.select().from(adminUsers).where(eq(adminUsers.role, "master")).limit(1),
);
if (!master) throw new Error("No master account found. Run: npm run seed");

await retry(() => db.delete(adminUsers).where(eq(adminUsers.email, TEST_EMAIL)));
const passwordHash = await hashPassword("throwaway-password-for-verification");
const [viewer] = await retry(() =>
  db
    .insert(adminUsers)
    .values({ email: TEST_EMAIL, name: "Verify Viewer", role: "viewer", passwordHash })
    .returning(),
);

try {
  const masterToken = await mint(master.id, "master");
  const viewerToken = await mint(viewer.id, "viewer");

  // Warm the routes: a dev server can answer the first request for a route
  // before it has finished compiling, and the body comes back incomplete.
  for (const path of ["/admin", "/admin/users"]) await get(path, masterToken);
  await new Promise((r) => setTimeout(r, 1000));

  const anon = await get("/admin");
  const mHome = await get("/admin", masterToken);
  const vHome = await get("/admin", viewerToken);
  const vUsers = await get("/admin/users", viewerToken);
  const mUsers = await get("/admin/users", masterToken);
  const anonCsv = await get("/admin/export");

  console.log("\nAccess control");
  check("anonymous is turned away from /admin", anon.status === 307, `${anon.status}`);
  check("anonymous is turned away from the CSV export", anonCsv.status === 307, `${anonCsv.status}`);
  check("viewer is turned away from /admin/users", vUsers.status === 307, `${vUsers.status}`);
  check("master reaches /admin/users", mUsers.status === 200, `${mUsers.status}`);
  check("viewer reaches the voice list", vHome.status === 200, `${vHome.status}`);

  console.log("\nRole separation in the markup");
  check("viewer sees no accounts link", !vHome.html.includes("Akun Manajemen"));
  check("master sees the accounts link", mHome.html.includes("Akun Manajemen"));
  check("viewer sees no delete control", !vHome.html.includes("Hapus suara"));
  check("master sees the delete control", mHome.html.includes("Hapus suara"));

  console.log("\nInvariants that a redesign can quietly break");
  check("no bcrypt hash in the accounts page", !/\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}/.test(mUsers.html));
  check("no bcrypt hash in the voice list", !/\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}/.test(mHome.html));
  const tbody = mHome.html.split("<tbody>")[1]?.split("</tbody>")[0] ?? "";
  check("voice rows carry a date", /\d{4}-\d{2}-\d{2}/.test(tbody));
  check("voice rows carry no clock time", !/\d{1,2}:\d{2}/.test(tbody));
  check("category chips render", mHome.html.includes("chip chip--"));
  check("the active page is marked", mHome.html.includes('aria-current="page"'));
} finally {
  await retry(() => db.delete(adminUsers).where(eq(adminUsers.id, viewer.id)));
  const left = await retry(() =>
    db.select().from(adminUsers).where(eq(adminUsers.id, viewer.id)),
  );
  console.log(`\nTest account removed: ${left.length === 0 ? "yes" : "NO - clean up by hand"}`);
}

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
