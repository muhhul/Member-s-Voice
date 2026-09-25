# Member's Voice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an anonymous employee feedback box where anyone can submit a voice without logging in, management accounts can read/filter/export those voices, and a master account manages the management accounts.

**Architecture:** A single Next.js 15 App Router application deployed on Vercel, talking to Neon Postgres through Drizzle ORM over the Neon HTTP driver. Mutations go through Server Actions; reads happen in async Server Components. Authentication is a hand-rolled signed-JWT cookie (`jose`) with two enforcement layers: a cheap Edge-runtime check in `src/middleware.ts` and a database-backed `requireRole()` call inside every admin page, route handler and server action. The `voices` table has no column that can be traced back to a submitter.

**Tech Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Drizzle ORM + drizzle-kit · `@neondatabase/serverless` · `jose` · `bcryptjs` · `zod` v3 · Cloudflare Turnstile · `@upstash/ratelimit` + `@upstash/redis` · plain CSS (globals + CSS Modules) · Vitest

**Spec:** [project.md](../../../project.md), as amended by the decisions in "Spec Amendments" below.

---

## Spec Amendments

These were decided after `project.md` was written. Where they conflict with `project.md`, these win.

1. **Categories are final and there are exactly three.** `CATEGORIES = ["safety", "hr", "facility_improvement"]`. There is no `other`.
2. **`area` is removed entirely.** No `area` column, no `AREAS` constant, no `area` form field, no `area` filter. This removes §7.4 of `project.md` as a requirement — the attribute that could narrow down a submitter no longer exists.
3. **Code lives at the repository root.** `src/` and `package.json` sit next to `project.md`. The `member-voice/` prefix in §5 of `project.md` is the project name, not a directory.
4. **Next.js 15**, so the middleware file is `src/middleware.ts`, not `proxy.ts`.
5. **The master can permanently delete a single voice** (§14 retention decision). This is new scope, covered by Task 12. The deletion is a hard delete. Nothing that records the deleted message content is kept — an audit trail holding the text would resurrect exactly what the deletion was meant to remove.
6. **Branding uses TMMIN identity**, driven by CSS custom properties in one place plus a logo file in `public/`. The hex values in this plan are provisional placeholders, clearly marked, to be replaced with the official values.
7. **Low submission volume is a known residual risk.** A date alone can identify a submitter when only one voice arrives that day. The demo displays dates as-is and records this in the README as a decision management must make before the link is distributed widely.

## Global Constraints

- **All routes, file names, identifiers, comments and commit messages are in English. All user-facing UI copy is in Bahasa Indonesia.** No exceptions.
- **Never store an IP address, user agent, session id, or any fingerprint on a `voices` row, and never add a foreign key from `voices` to any user.**
- **Never `console.log`, `console.error`, or otherwise emit the request body or request headers anywhere in the submit path** (`src/app/actions.ts`, `src/lib/rate-limit.ts`, `src/lib/turnstile.ts`). Log a bare failure reason string or nothing.
- **The dashboard and the CSV show the date only (`YYYY-MM-DD`, Asia/Jakarta).** `created_at` keeps full timestamp precision in the database for sorting, and that precision must never reach the UI or the export.
- **No file uploads anywhere.**
- **Message length: 10 to 2000 characters after trimming.**
- **Session cookie:** name `mv_session`, HS256 JWT signed with `AUTH_SECRET`, payload `{ uid, role }`, `httpOnly`, `secure`, `sameSite=lax`, 8 hour expiry.
- **Password hashing:** `bcryptjs` with 12 rounds.
- **`bcryptjs`, `node:crypto`, and anything importing `src/db/client.ts` must never be imported by `src/middleware.ts`** — middleware runs on the Edge runtime. Only `jose` and Web APIs are allowed there.
- **Next.js 15 async APIs:** `cookies()`, `headers()`, and a page's `params`/`searchParams` props are Promises. Always `await` them.
- **Admin accounts are deactivated (`is_active = false`), never deleted.** A master cannot deactivate or demote themselves.
- **Every admin page, route handler, and server action calls `requireRole(...)` or `getAuthorizedUser(...)` itself.** Middleware is not sufficient — server actions can be invoked with a direct POST that never renders a page.
- **Never put a file-based metadata route under `src/app/`** — no `favicon.ico`, `icon.png`, `apple-icon.png`, `opengraph-image.*`, or `twitter-image.*`. Serve those from `public/` instead. The repository path contains an apostrophe (`Member's Voice`), and Next's metadata-route loader interpolates the absolute file path into a single-quoted JavaScript string without escaping it. The apostrophe closes the string early and the build dies with `Module parse failed: Unexpected token`, pointing at Next's own generated code rather than at anything you wrote. `public/favicon.ico` is served at `/favicon.ico` and never touches that loader. Renaming the repository directory to drop the apostrophe would remove the constraint entirely — worth doing if the directory is ever moved.

## File Structure

```
/
├─ src/
│  ├─ middleware.ts                    # Edge JWT gate for /admin/**
│  ├─ app/
│  │  ├─ layout.tsx                    # html/body shell, brand header
│  │  ├─ globals.css                   # brand tokens + base styles
│  │  ├─ page.tsx                      # public submission form (server)
│  │  ├─ actions.ts                    # submitVoice server action
│  │  ├─ thank-you/page.tsx
│  │  └─ admin/
│  │     ├─ login/                     # OUTSIDE the protected group
│  │     │  ├─ page.tsx
│  │     │  └─ actions.ts              # login, logout
│  │     └─ (protected)/               # route group: no effect on the URL
│  │        ├─ layout.tsx              # admin shell + nav + logout
│  │        ├─ page.tsx                # voice list            -> /admin
│  │        ├─ actions.ts              # deleteVoice (master only)
│  │        ├─ users/
│  │        │  ├─ page.tsx             #                       -> /admin/users
│  │        │  └─ actions.ts           # createUser, setUserActive, resetPassword
│  │        └─ export/route.ts         # CSV download          -> /admin/export
│  ├─ components/
│  │  ├─ voice-form.tsx                # client, useActionState
│  │  ├─ turnstile-widget.tsx          # client
│  │  ├─ login-form.tsx                # client, useActionState
│  │  ├─ voice-filters.tsx             # server, plain GET form
│  │  ├─ voice-table.tsx               # server
│  │  ├─ pagination.tsx                # server
│  │  ├─ confirm-button.tsx            # client, two-step confirm (shared)
│  │  ├─ delete-voice-button.tsx       # server, wraps confirm-button
│  │  └─ user-admin.tsx                # client forms for user management
│  ├─ db/
│  │  ├─ schema.ts                     # voices, adminUsers, roleEnum
│  │  └─ client.ts                     # drizzle + neon-http singleton
│  └─ lib/
│     ├─ constants.ts                  # CATEGORIES, labels, limits
│     ├─ validation.ts                 # zod schemas
│     ├─ format.ts                     # Jakarta date helpers
│     ├─ like.ts                       # ILIKE metacharacter escaping
│     ├─ query-string.ts               # filters -> query string
│     ├─ csv.ts                        # CSV builder + cell escaping
│     ├─ jwt.ts                        # EDGE-SAFE sign/verify only
│     ├─ session.ts                    # cookies + DB-backed authorization
│     ├─ password.ts                   # bcrypt wrappers
│     ├─ hash-ip.ts                    # salted SHA-256 of an IP
│     ├─ rate-limit.ts                 # Upstash, optional
│     ├─ turnstile.ts                  # Cloudflare verify, optional
│     └─ queries.ts                    # listVoices, listAdminUsers
├─ tests/
│  ├─ constants.test.ts
│  ├─ validation.test.ts
│  ├─ format.test.ts
│  ├─ like.test.ts
│  ├─ query-string.test.ts
│  ├─ csv.test.ts
│  ├─ hash-ip.test.ts
│  ├─ turnstile.test.ts
│  ├─ jwt.test.ts
│  └─ password.test.ts
├─ scripts/seed.ts
├─ public/logo.svg
├─ drizzle.config.ts
├─ vitest.config.ts
├─ .env.example
├─ project.md
└─ README.md
```

Every file under `src/lib/` that holds logic worth trusting is a pure module with no Next.js or database import, so Vitest can test it directly in a plain Node environment. Database access and framework glue live in `src/db/`, `src/app/`, and `src/lib/session.ts`, which are verified by running the app rather than by unit tests.

---

### Task 1: Project scaffold, tooling, and brand tokens

Infrastructure task. There is no behaviour to test yet, so it is verified by a successful production build and a passing (empty) test run rather than by TDD.

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `.gitignore` (all via `create-next-app`)
- Create: `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`
- Create: `vitest.config.ts`
- Create: `public/logo.svg`
- Create: `.env.example`

**Interfaces:**
- Consumes: nothing.
- Produces: the `@/*` import alias mapped to `src/*`; npm scripts `dev`, `build`, `start`, `lint`, `test`; the CSS custom properties `--brand-primary`, `--brand-primary-dark`, `--brand-ink`, `--brand-muted`, `--brand-surface`, `--brand-page`, `--brand-border`, `--brand-danger` on `:root`.

- [ ] **Step 1: Scaffold Next.js 15 into the repository root**

**This cannot be scaffolded in place.** `create-next-app` derives the package name from the target directory's name and validates it against npm's naming rules. The repository directory is `Member's Voice`, which fails those rules (spaces, uppercase, an apostrophe), so `.` as the target is rejected. Scaffold into a temporary subdirectory with a valid name, then move the contents up:

```bash
mkdir -p .scaffold-tmp
npx --yes create-next-app@15 .scaffold-tmp/members-voice \
  --typescript --app --src-dir --eslint --no-tailwind --no-turbopack \
  --import-alias "@/*" --use-npm --skip-install
cp -r .scaffold-tmp/members-voice/. .
rm -rf .scaffold-tmp
rm -f README.md                      # Task 13 writes the real one
rm -f src/app/page.module.css
rm -f public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg
```

Three details that will waste your time if you skip them:

- **Create `.scaffold-tmp` before running the command.** `create-next-app` checks whether the target's *parent* is writable and reports "The application path is not writable" when the parent does not yet exist — a misleading error that looks like a permissions problem.
- **`--skip-install`** avoids installing `node_modules` into a directory you are about to move.
- **`rm -rf .scaffold-tmp` may fail with "Device or resource busy"** on Windows if a shell still has that directory as its working directory. Change directory first, or remove it with PowerShell `Remove-Item -Recurse -Force`.

- [ ] **Step 2: Install runtime and dev dependencies**

```bash
npm install drizzle-orm @neondatabase/serverless jose bcryptjs zod@^3.23 @upstash/ratelimit @upstash/redis
npm install -D @types/node@^24 drizzle-kit tsx dotenv vitest
```

- **`zod` is pinned to v3 on purpose.** v4 moved the string format validators (`z.string().email()` became `z.email()`), and every schema in this plan is written in v3 syntax.
- **`@types/node@^24` must be raised explicitly.** `create-next-app` pins `^20`, but `vitest` 5 declares a peer range of `^22.0.0 || >=24.0.0`, so the dev install fails with `ERESOLVE` otherwise. Raising it is the correct fix, not `--legacy-peer-deps`; the runtime here is Node 24.
- **No `@types/bcryptjs`.** `bcryptjs` 3.x ships its own type definitions; the `@types` package is now a deprecated stub.
- **No `vite-tsconfig-paths`.** Vite 7, which `vitest` 5 builds on, resolves `tsconfig.json` paths natively.

Then close the one high-severity advisory. `next@15.5.26` pins `postcss` to exactly `8.4.31`, and no newer Next 15 release lifts it, so the fix has to be an override. `postcss` 8.5.x is semver-compatible, so this is safe — add to `package.json`:

```json
  "overrides": {
    "postcss": "^8.5.28"
  },
```

`npm audit` will still report four moderate findings, all one root cause: `drizzle-kit` depends on the deprecated `@esbuild-kit/*` packages. Leave them. The advisory concerns esbuild's *dev server*, which nothing here runs — `drizzle-kit` uses esbuild only to transpile its config file — and `drizzle-kit` is a dev dependency that never reaches the deployed bundle. Forcing an override risks breaking the CLI in a way that surfaces only at Task 3.

- [ ] **Step 3: Add the npm scripts**

Replace the `"scripts"` block in `package.json` with:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run --passWithNoTests",
    "test:watch": "vitest",
    "db:push": "drizzle-kit push",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "seed": "tsx scripts/seed.ts",
    "seed:demo": "tsx scripts/seed.ts --demo"
  },
```

- [ ] **Step 4: Configure Vitest**

Create `vitest.config.mts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Vite 7 resolves the "@/*" alias from tsconfig.json natively, so the
  // vite-tsconfig-paths plugin is no longer needed.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
```

The `.mts` extension matters. As `vitest.config.ts` the file is loaded as CommonJS while containing ESM syntax, and Vite warns about it on every run. `resolve.tsconfigPaths` is what makes `@/lib/...` imports resolve inside tests.

- [ ] **Step 5: Write the brand tokens and base styles**

Replace `src/app/globals.css` entirely:

```css
/*
 * Brand tokens. These are the ONLY place colors are defined.
 * PROVISIONAL VALUES - replace with the official TMMIN palette when it arrives.
 * Changing branding should require editing nothing but this block and public/logo.svg.
 */
:root {
  --brand-primary: #c8102e;
  --brand-primary-dark: #9c0c23;
  --brand-ink: #1a1a1a;
  --brand-muted: #6b7280;
  --brand-surface: #ffffff;
  --brand-page: #f5f6f8;
  --brand-border: #d8dbe0;
  --brand-danger: #b42318;
  --brand-radius: 8px;
  --brand-max-width: 720px;
  --brand-font: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
}

body {
  background: var(--brand-page);
  color: var(--brand-ink);
  font-family: var(--brand-font);
  font-size: 16px;
  line-height: 1.55;
}

a {
  color: var(--brand-primary);
}

.site-header {
  background: var(--brand-surface);
  border-bottom: 3px solid var(--brand-primary);
  padding: 12px 16px;
}

.site-header__inner {
  align-items: center;
  display: flex;
  gap: 12px;
  margin: 0 auto;
  max-width: var(--brand-max-width);
}

.site-header__logo {
  height: 32px;
  width: auto;
}

.site-header__title {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0;
}

.container {
  margin: 0 auto;
  max-width: var(--brand-max-width);
  padding: 20px 16px 64px;
}

.container--wide {
  max-width: 1040px;
}

.card {
  background: var(--brand-surface);
  border: 1px solid var(--brand-border);
  border-radius: var(--brand-radius);
  padding: 20px;
}

label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
}

input[type="text"],
input[type="email"],
input[type="password"],
input[type="date"],
select,
textarea {
  background: var(--brand-surface);
  border: 1px solid var(--brand-border);
  border-radius: var(--brand-radius);
  font: inherit;
  padding: 10px 12px;
  width: 100%;
}

textarea {
  min-height: 160px;
  resize: vertical;
}

button {
  background: var(--brand-primary);
  border: none;
  border-radius: var(--brand-radius);
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  min-height: 44px;
  padding: 11px 18px;
}

button:hover:not(:disabled) {
  background: var(--brand-primary-dark);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

button.secondary {
  background: var(--brand-surface);
  border: 1px solid var(--brand-border);
  color: var(--brand-ink);
}

button.danger {
  background: var(--brand-danger);
}

.field {
  margin-bottom: 18px;
}

.hint {
  color: var(--brand-muted);
  font-size: 0.875rem;
  font-weight: 400;
  margin: 4px 0 0;
}

.error {
  color: var(--brand-danger);
  font-size: 0.875rem;
  margin: 6px 0 0;
}

.ok {
  color: #027a48;
  font-size: 0.875rem;
  margin: 6px 0 0;
}

.notice {
  background: #fff8e6;
  border: 1px solid #f0d58c;
  border-radius: var(--brand-radius);
  font-size: 0.9rem;
  margin-bottom: 20px;
  padding: 12px 14px;
}

.honeypot {
  height: 0;
  opacity: 0;
  overflow: hidden;
  position: absolute;
  width: 0;
}

table {
  border-collapse: collapse;
  width: 100%;
}

th,
td {
  border-bottom: 1px solid var(--brand-border);
  padding: 10px 8px;
  text-align: left;
  vertical-align: top;
}

th {
  font-size: 0.8rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.table-scroll {
  overflow-x: auto;
}

.admin-nav {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin: 0 auto;
  max-width: 1040px;
  padding: 12px 16px;
}

.admin-nav__spacer {
  flex: 1;
}

.filters {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  margin-bottom: 20px;
}

.row-actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 560px) {
  .container {
    padding: 16px 12px 56px;
  }
}
```

- [ ] **Step 6: Write the root layout**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Member's Voice",
  description: "Kotak suara anonim untuk seluruh karyawan.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <header className="site-header">
          <div className="site-header__inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="site-header__logo" src="/logo.svg" alt="" />
            <p className="site-header__title">Member&apos;s Voice</p>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
```

The logo sits next to a text title, so it is decorative and `alt` is intentionally empty.

- [ ] **Step 7: Add a placeholder logo**

Create `public/logo.svg`. This is a neutral placeholder to be replaced with the official TMMIN logo file:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 32" role="img" aria-label="Logo">
  <rect width="120" height="32" rx="4" fill="#c8102e" />
  <text x="60" y="21" fill="#ffffff" font-family="system-ui, sans-serif" font-size="13" font-weight="700" text-anchor="middle">TMMIN</text>
</svg>
```

- [ ] **Step 8: Replace the default home page with a placeholder**

Replace `src/app/page.tsx`. Task 5 fills this in properly:

```tsx
export default function HomePage() {
  return (
    <main className="container">
      <div className="card">
        <p>Member&apos;s Voice</p>
      </div>
    </main>
  );
}
```

- [ ] **Step 9: Write `.env.example`**

```bash
# Neon connection string. On Vercel this is injected by the Neon integration.
DATABASE_URL=

# openssl rand -base64 32
AUTH_SECRET=

# Seed script only, local use. Never commit real values.
MASTER_EMAIL=
MASTER_PASSWORD=
MASTER_NAME=

# Optional locally, recommended for the deployed demo.
# Turnstile and rate limiting each switch on only when their keys are present.
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Random string used to salt the SHA-256 hash of IPs for rate limiting.
RATE_LIMIT_SALT=
```

- [ ] **Step 10: Confirm `.gitignore` covers local env files**

`create-next-app` already ignores `.env*`. Verify that `.env.local` and `.env` are ignored and that `.env.example` is **not**:

```bash
git check-ignore -v .env.local .env
git check-ignore .env.example || echo ".env.example is tracked - correct"
```

- [ ] **Step 11: Verify the build, tests, and lint**

```bash
npm run build
npm run test
npm run lint
```

Expected: the build completes and lists `/` as a static route; the test run reports no test files and exits 0; lint passes.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 app with brand tokens and Vitest"
```

---

### Task 2: Categories and validation schemas

**Files:**
- Create: `src/lib/constants.ts`
- Create: `src/lib/validation.ts`
- Test: `tests/constants.test.ts`, `tests/validation.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `CATEGORIES: readonly ["safety", "hr", "facility_improvement"]`
  - `type Category = "safety" | "hr" | "facility_improvement"`
  - `CATEGORY_LABELS: Record<Category, string>`
  - `categoryLabel(value: string): string`
  - `MESSAGE_MIN = 10`, `MESSAGE_MAX = 2000`, `PAGE_SIZE = 25`
  - `voiceSchema` → `{ category: Category; message: string }`
  - `loginSchema` → `{ email: string; password: string }`
  - `createUserSchema` → `{ email: string; name: string; role: "master" | "viewer"; password: string }`
  - `resetPasswordSchema` → `{ userId: string; password: string }`
  - `filtersSchema` → `{ category?: Category; from?: string; to?: string; q?: string; page: number }`, exported as `type VoiceFilters`
  - `fieldErrors(error: z.ZodError): Record<string, string>`

- [ ] **Step 1: Write the failing tests**

Create `tests/constants.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { CATEGORIES, CATEGORY_LABELS, categoryLabel } from "@/lib/constants";

describe("categories", () => {
  it("holds exactly the three agreed categories in order", () => {
    expect(CATEGORIES).toEqual(["safety", "hr", "facility_improvement"]);
  });

  it("has an Indonesian label for every category", () => {
    for (const category of CATEGORIES) {
      expect(CATEGORY_LABELS[category]).toBeTruthy();
    }
  });

  it("maps a known value to its Indonesian label", () => {
    expect(categoryLabel("facility_improvement")).toBe("Perbaikan Fasilitas");
  });

  it("falls back to the raw value for an unknown category", () => {
    expect(categoryLabel("legacy_value")).toBe("legacy_value");
  });
});
```

Create `tests/validation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  createUserSchema,
  fieldErrors,
  filtersSchema,
  loginSchema,
  voiceSchema,
} from "@/lib/validation";

describe("voiceSchema", () => {
  it("accepts a valid submission and trims the message", () => {
    const parsed = voiceSchema.parse({
      category: "safety",
      message: "  Lantai di area press licin setelah hujan.  ",
    });
    expect(parsed.message).toBe("Lantai di area press licin setelah hujan.");
    expect(parsed.category).toBe("safety");
  });

  it("rejects a category that is not in the list", () => {
    const result = voiceSchema.safeParse({ category: "other", message: "x".repeat(20) });
    expect(result.success).toBe(false);
  });

  it("rejects a message shorter than 10 characters after trimming", () => {
    const result = voiceSchema.safeParse({ category: "hr", message: "   short   " });
    expect(result.success).toBe(false);
  });

  it("rejects a message longer than 2000 characters", () => {
    const result = voiceSchema.safeParse({ category: "hr", message: "a".repeat(2001) });
    expect(result.success).toBe(false);
  });

  it("has no area field in its output", () => {
    const parsed = voiceSchema.parse({
      category: "hr",
      message: "a".repeat(20),
      area: "office",
    });
    expect(parsed).not.toHaveProperty("area");
  });
});

describe("loginSchema", () => {
  it("lowercases and trims the email", () => {
    const parsed = loginSchema.parse({ email: "  Budi@Example.COM ", password: "secret" });
    expect(parsed.email).toBe("budi@example.com");
  });

  it("rejects a malformed email", () => {
    expect(loginSchema.safeParse({ email: "budi", password: "secret" }).success).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ email: "budi@example.com", password: "" }).success).toBe(false);
  });
});

describe("createUserSchema", () => {
  it("accepts a valid viewer", () => {
    const parsed = createUserSchema.parse({
      email: "viewer@example.com",
      name: "Viewer Satu",
      role: "viewer",
      password: "correct horse battery",
    });
    expect(parsed.role).toBe("viewer");
  });

  it("rejects a password shorter than 12 characters", () => {
    const result = createUserSchema.safeParse({
      email: "viewer@example.com",
      name: "Viewer Satu",
      role: "viewer",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a role outside master and viewer", () => {
    const result = createUserSchema.safeParse({
      email: "viewer@example.com",
      name: "Viewer Satu",
      role: "admin",
      password: "correct horse battery",
    });
    expect(result.success).toBe(false);
  });
});

describe("filtersSchema", () => {
  it("defaults page to 1 and drops empty strings", () => {
    const parsed = filtersSchema.parse({ category: "", from: "", to: "", q: "", page: "" });
    expect(parsed).toEqual({ page: 1 });
  });

  it("keeps valid values and coerces page", () => {
    const parsed = filtersSchema.parse({
      category: "safety",
      from: "2026-01-01",
      to: "2026-01-31",
      q: "licin",
      page: "3",
    });
    expect(parsed).toEqual({
      category: "safety",
      from: "2026-01-01",
      to: "2026-01-31",
      q: "licin",
      page: 3,
    });
  });

  it("drops a malformed date instead of failing", () => {
    const parsed = filtersSchema.parse({ from: "01/01/2026", page: "1" });
    expect(parsed.from).toBeUndefined();
  });

  it("clamps a page below 1 up to 1", () => {
    expect(filtersSchema.parse({ page: "-4" }).page).toBe(1);
  });
});

describe("fieldErrors", () => {
  it("returns the first message per field, keyed by field name", () => {
    const result = voiceSchema.safeParse({ category: "nope", message: "" });
    if (result.success) throw new Error("expected a validation failure");
    const errors = fieldErrors(result.error);
    expect(Object.keys(errors).sort()).toEqual(["category", "message"]);
    expect(typeof errors.message).toBe("string");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/constants.test.ts tests/validation.test.ts`
Expected: FAIL — cannot resolve `@/lib/constants` and `@/lib/validation`.

- [ ] **Step 3: Write `src/lib/constants.ts`**

```ts
export const CATEGORIES = ["safety", "hr", "facility_improvement"] as const;

export type Category = (typeof CATEGORIES)[number];

/** UI copy is Bahasa Indonesia; the stored values stay English. */
export const CATEGORY_LABELS: Record<Category, string> = {
  safety: "Keselamatan (K3)",
  hr: "HR",
  facility_improvement: "Perbaikan Fasilitas",
};

export function categoryLabel(value: string): string {
  return CATEGORY_LABELS[value as Category] ?? value;
}

export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 2000;

/** Rows per page on the admin voice list. */
export const PAGE_SIZE = 25;
```

- [ ] **Step 4: Write `src/lib/validation.ts`**

```ts
import { z } from "zod";
import { CATEGORIES, MESSAGE_MAX, MESSAGE_MIN } from "@/lib/constants";

/** YYYY-MM-DD, as produced by <input type="date">. */
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const voiceSchema = z.object({
  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: "Pilih kategori terlebih dahulu." }),
  }),
  message: z
    .string()
    .trim()
    .min(MESSAGE_MIN, `Pesan minimal ${MESSAGE_MIN} karakter.`)
    .max(MESSAGE_MAX, `Pesan maksimal ${MESSAGE_MAX} karakter.`),
});

export type VoiceInput = z.infer<typeof voiceSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Format email tidak valid."),
  password: z.string().min(1, "Kata sandi wajib diisi."),
});

export const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email("Format email tidak valid."),
  name: z.string().trim().min(1, "Nama wajib diisi.").max(100, "Nama maksimal 100 karakter."),
  role: z.enum(["master", "viewer"], {
    errorMap: () => ({ message: "Peran tidak valid." }),
  }),
  password: z.string().min(12, "Kata sandi minimal 12 karakter."),
});

export const resetPasswordSchema = z.object({
  userId: z.string().uuid("Pengguna tidak valid."),
  password: z.string().min(12, "Kata sandi minimal 12 karakter."),
});

/**
 * Filters come from the query string, where anyone can type anything. A bad
 * value is dropped rather than raised, so the dashboard never 500s on a
 * hand-edited URL.
 */
export const filtersSchema = z.object({
  category: z.enum(CATEGORIES).optional().catch(undefined),
  from: isoDate.optional().catch(undefined),
  to: isoDate.optional().catch(undefined),
  q: z.string().trim().min(1).max(200).optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1),
});

export type VoiceFilters = z.infer<typeof filtersSchema>;

/** Flattens a ZodError into one message per field, for rendering next to inputs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!(key in result)) result[key] = issue.message;
  }
  return result;
}
```

`z.enum(...).optional().catch(undefined)` is what turns `?category=` and `?category=garbage` into "no category filter" instead of a thrown error. `z.coerce.number().int().min(1).catch(1)` does the same for `page`, which is why `page: "-4"` becomes `1`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/constants.test.ts tests/validation.test.ts`
Expected: PASS, all cases.

- [ ] **Step 6: Commit**

```bash
git add src/lib/constants.ts src/lib/validation.ts tests/constants.test.ts tests/validation.test.ts
git commit -m "feat: add categories and zod validation schemas"
```

---

### Task 3: Database schema, client, and Drizzle config

Schema and connection wiring. Verified by pushing the schema to a real Neon database and inspecting the result, not by unit tests.

**Files:**
- Create: `src/db/schema.ts`
- Create: `src/db/client.ts`
- Create: `drizzle.config.ts`

**Interfaces:**
- Consumes: `DATABASE_URL`.
- Produces:
  - `roleEnum` — pg enum `role`, values `master`, `viewer`
  - `voices` table: `id: string`, `category: string`, `message: string`, `createdAt: Date`
  - `adminUsers` table: `id: string`, `email: string`, `name: string`, `passwordHash: string`, `role: "master" | "viewer"`, `isActive: boolean`, `createdAt: Date`
  - `type Voice = typeof voices.$inferSelect`, `type AdminUser = typeof adminUsers.$inferSelect`
  - `db` — a Drizzle client bound to the Neon HTTP driver

- [ ] **Step 1: Write `src/db/schema.ts`**

```ts
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["master", "viewer"]);

/**
 * A submitted voice.
 *
 * ANONYMITY REQUIREMENT: this table has no relation to any user, IP address,
 * device or session, and must never gain one. Adding such a column would break
 * the promise the submission form makes to employees.
 */
export const voices = pgTable(
  "voices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Validated against CATEGORIES in application code, stored as text so the
    // list can change without a database migration.
    category: text("category").notNull(),
    message: text("message").notNull(),
    // Full precision is kept for stable sorting only. The UI and the CSV
    // export must show the date alone.
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("voices_created_at_idx").on(table.createdAt),
    index("voices_category_idx").on(table.category),
  ],
);

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("viewer"),
  // Accounts are deactivated, never deleted.
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Voice = typeof voices.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
```

- [ ] **Step 2: Write `src/db/client.ts`**

```ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL is not set");
}

export const db = drizzle(neon(url), { schema });
```

- [ ] **Step 3: Write `drizzle.config.ts`**

```ts
import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Vercel writes pulled variables to .env.local; a plain .env is the fallback.
loadEnv({ path: ".env.local" });
loadEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Run: vercel env pull .env.local");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL },
});
```

- [ ] **Step 4: Point the local environment at a development database**

Either pull it from Vercel once the Neon integration is attached:

```bash
npx vercel env pull .env.local
```

or create `.env.local` by hand from `.env.example`, with a Neon **development branch** URL and `AUTH_SECRET` generated by `openssl rand -base64 32`.

Never point local development at the production database.

- [ ] **Step 5: Push the schema and verify the tables exist**

```bash
npm run db:push
npx drizzle-kit studio
```

Expected: `db:push` reports the `role` enum plus the `voices` and `admin_users` tables created. In Studio, confirm `voices` has exactly four columns — `id`, `category`, `message`, `created_at` — with no `area`, no IP column, and no user reference.

- [ ] **Step 6: Commit**

```bash
git add src/db/schema.ts src/db/client.ts drizzle.config.ts
git commit -m "feat: add Drizzle schema for voices and admin users"
```

---

### Task 4: Anti-spam primitives — IP hashing, rate limiting, Turnstile

**Files:**
- Create: `src/lib/hash-ip.ts`
- Create: `src/lib/rate-limit.ts`
- Create: `src/lib/turnstile.ts`
- Test: `tests/hash-ip.test.ts`, `tests/turnstile.test.ts`

**Interfaces:**
- Consumes: `RATE_LIMIT_SALT`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `TURNSTILE_SECRET_KEY`.
- Produces:
  - `hashIp(ip: string, salt: string): string`
  - `clientIpFromHeaders(headers: Headers): string | null`
  - `isRateLimitEnabled(): boolean`
  - `checkRateLimit(ip: string | null): Promise<boolean>` — `true` means allowed; returns `true` when Upstash is not configured
  - `isTurnstileEnabled(): boolean`
  - `verifyTurnstile(token: string | null): Promise<boolean>` — returns `true` when Turnstile is not configured

- [ ] **Step 1: Write the failing tests**

Create `tests/hash-ip.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { clientIpFromHeaders, hashIp } from "@/lib/hash-ip";

describe("hashIp", () => {
  it("returns a 64 character hex digest", () => {
    expect(hashIp("203.0.113.9", "salt")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is stable for the same ip and salt", () => {
    expect(hashIp("203.0.113.9", "salt")).toBe(hashIp("203.0.113.9", "salt"));
  });

  it("produces a different digest for a different salt", () => {
    expect(hashIp("203.0.113.9", "a")).not.toBe(hashIp("203.0.113.9", "b"));
  });

  it("does not contain the raw ip", () => {
    expect(hashIp("203.0.113.9", "salt")).not.toContain("203.0.113.9");
  });
});

describe("clientIpFromHeaders", () => {
  it("takes the first entry of x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.9, 70.41.3.18" });
    expect(clientIpFromHeaders(headers)).toBe("203.0.113.9");
  });

  it("falls back to x-real-ip", () => {
    const headers = new Headers({ "x-real-ip": "203.0.113.10" });
    expect(clientIpFromHeaders(headers)).toBe("203.0.113.10");
  });

  it("returns null when no forwarding header is present", () => {
    expect(clientIpFromHeaders(new Headers())).toBeNull();
  });
});
```

Create `tests/turnstile.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstile } from "@/lib/turnstile";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.TURNSTILE_SECRET_KEY;
  vi.restoreAllMocks();
});

describe("verifyTurnstile", () => {
  it("allows the request when no secret key is configured", async () => {
    await expect(verifyTurnstile(null)).resolves.toBe(true);
  });

  it("rejects a missing token when a secret key is configured", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    await expect(verifyTurnstile(null)).resolves.toBe(false);
  });

  it("returns true when Cloudflare reports success", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    globalThis.fetch = vi.fn(
      async () => new Response(JSON.stringify({ success: true }), { status: 200 }),
    ) as unknown as typeof fetch;
    await expect(verifyTurnstile("token")).resolves.toBe(true);
  });

  it("returns false when Cloudflare reports failure", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    globalThis.fetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ success: false, "error-codes": ["invalid-input-response"] }), {
          status: 200,
        }),
    ) as unknown as typeof fetch;
    await expect(verifyTurnstile("token")).resolves.toBe(false);
  });

  it("returns false when the verify call throws", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    globalThis.fetch = vi.fn(async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;
    await expect(verifyTurnstile("token")).resolves.toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/hash-ip.test.ts tests/turnstile.test.ts`
Expected: FAIL — cannot resolve `@/lib/hash-ip` and `@/lib/turnstile`.

- [ ] **Step 3: Write `src/lib/hash-ip.ts`**

```ts
import { createHash } from "node:crypto";

/**
 * ANONYMITY REQUIREMENT: the result of this function is used only as a
 * short-lived Redis rate-limit key. It must never be written to Postgres and
 * must never appear on or near a voices row.
 */
export function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export function clientIpFromHeaders(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip")?.trim();
  return real ? real : null;
}
```

- [ ] **Step 4: Write `src/lib/rate-limit.ts`**

```ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { hashIp } from "@/lib/hash-ip";

export function isRateLimitEnabled(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN &&
      process.env.RATE_LIMIT_SALT,
  );
}

let limiter: Ratelimit | null = null;

function getLimiter(): Ratelimit {
  if (!limiter) {
    limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "10 m"),
      prefix: "mv:submit",
      analytics: false,
    });
  }
  return limiter;
}

/**
 * Returns true when the submission is allowed.
 *
 * Fails open: if Upstash is unreachable, a genuine employee must still be able
 * to submit. Losing spam protection for a moment is a smaller failure than
 * silently dropping real feedback.
 */
export async function checkRateLimit(ip: string | null): Promise<boolean> {
  if (!isRateLimitEnabled() || !ip) return true;

  try {
    const key = hashIp(ip, process.env.RATE_LIMIT_SALT!);
    const { success } = await getLimiter().limit(key);
    return success;
  } catch {
    // Deliberately logs nothing: every value in scope here derives from the
    // request, and the submit path stays silent.
    return true;
  }
}
```

- [ ] **Step 5: Write `src/lib/turnstile.ts`**

```ts
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function isTurnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

/**
 * Returns true when the request may proceed.
 *
 * Disabled (no secret key) means every request passes, which is what makes
 * local development work without Cloudflare keys. Enabled means a missing,
 * invalid, or unverifiable token fails closed.
 */
export async function verifyTurnstile(token: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    const response = await fetch(VERIFY_URL, { method: "POST", body });
    if (!response.ok) return false;
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    // No logging of the token or of Cloudflare's echoed request data.
    return false;
  }
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run tests/hash-ip.test.ts tests/turnstile.test.ts`
Expected: PASS, all cases.

- [ ] **Step 7: Commit**

```bash
git add src/lib/hash-ip.ts src/lib/rate-limit.ts src/lib/turnstile.ts tests/hash-ip.test.ts tests/turnstile.test.ts
git commit -m "feat: add ip hashing, rate limiting, and Turnstile verification"
```

---

### Task 5: Public submission form (M1)

**Files:**
- Create: `src/app/actions.ts`
- Create: `src/components/voice-form.tsx`
- Create: `src/components/turnstile-widget.tsx`
- Create: `src/app/thank-you/page.tsx`
- Modify: `src/app/page.tsx` — replace the Task 1 placeholder

**Interfaces:**
- Consumes: `voiceSchema`, `fieldErrors`, `CATEGORIES`, `CATEGORY_LABELS`, `MESSAGE_MIN`, `MESSAGE_MAX` (Task 2); `db`, `voices` (Task 3); `clientIpFromHeaders`, `checkRateLimit`, `verifyTurnstile` (Task 4).
- Produces:
  - `type SubmitState = { errors: Record<string, string> }`
  - `submitVoice(prevState: SubmitState, formData: FormData): Promise<SubmitState>` — redirects to `/thank-you` on success
  - `<VoiceForm turnstileSiteKey={string | undefined} />`

- [ ] **Step 1: Write the server action**

Create `src/app/actions.ts`:

```ts
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { voices } from "@/db/schema";
import { clientIpFromHeaders } from "@/lib/hash-ip";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { fieldErrors, voiceSchema } from "@/lib/validation";

export type SubmitState = { errors: Record<string, string> };

/**
 * ANONYMITY REQUIREMENT: nothing in this function may log formData, headers,
 * or the derived IP. Only the validated category and message are persisted.
 */
export async function submitVoice(
  _prevState: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  // 1. Honeypot. A filled hidden field means a bot: report success, store nothing.
  const honeypot = formData.get("website");
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    redirect("/thank-you");
  }

  // 2. Turnstile, when a secret key is configured.
  const turnstileToken = formData.get("cf-turnstile-response");
  const humanOk = await verifyTurnstile(
    typeof turnstileToken === "string" ? turnstileToken : null,
  );
  if (!humanOk) {
    return { errors: { _form: "Verifikasi gagal. Muat ulang halaman lalu coba lagi." } };
  }

  // 3. Rate limit, when Upstash is configured.
  const requestHeaders = await headers();
  const allowed = await checkRateLimit(clientIpFromHeaders(requestHeaders));
  if (!allowed) {
    return {
      errors: {
        _form: "Terlalu banyak pengiriman dari jaringan ini. Coba lagi beberapa menit lagi.",
      },
    };
  }

  // 4. Validation.
  const parsed = voiceSchema.safeParse({
    category: formData.get("category"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error) };
  }

  await db.insert(voices).values({
    category: parsed.data.category,
    message: parsed.data.message,
  });

  redirect("/thank-you");
}
```

`redirect()` works by throwing, so nothing after it runs. That is why the honeypot branch needs no `return`.

- [ ] **Step 2: Write the Turnstile widget component**

Create `src/components/turnstile-widget.tsx`:

```tsx
"use client";

import Script from "next/script";

/**
 * Renders the Cloudflare Turnstile widget. Cloudflare's script injects a hidden
 * input named cf-turnstile-response into the surrounding form, which is what
 * the server action reads.
 */
export function TurnstileWidget({ siteKey }: { siteKey: string }) {
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      <div className="cf-turnstile" data-sitekey={siteKey} data-language="id" />
    </>
  );
}
```

- [ ] **Step 3: Write the form component**

Create `src/components/voice-form.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { submitVoice, type SubmitState } from "@/app/actions";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { CATEGORIES, CATEGORY_LABELS, MESSAGE_MAX, MESSAGE_MIN } from "@/lib/constants";

const initialState: SubmitState = { errors: {} };

export function VoiceForm({ turnstileSiteKey }: { turnstileSiteKey?: string }) {
  const [state, formAction, pending] = useActionState(submitVoice, initialState);

  return (
    <form action={formAction} className="card" noValidate>
      {state.errors._form ? (
        <p className="error" role="alert">
          {state.errors._form}
        </p>
      ) : null}

      <div className="field">
        <label htmlFor="category">Kategori</label>
        <select id="category" name="category" defaultValue="" required>
          <option value="" disabled>
            Pilih kategori
          </option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
        {state.errors.category ? <p className="error">{state.errors.category}</p> : null}
      </div>

      <div className="field">
        <label htmlFor="message">Suara Anda</label>
        <textarea
          id="message"
          name="message"
          maxLength={MESSAGE_MAX}
          required
          placeholder="Tuliskan masukan, keluhan, atau ide Anda."
        />
        <p className="hint">
          {MESSAGE_MIN}&ndash;{MESSAGE_MAX} karakter. Hindari menyebut nama atau detail yang bisa
          menunjuk ke diri Anda, kecuali Anda memang ingin diketahui.
        </p>
        {state.errors.message ? <p className="error">{state.errors.message}</p> : null}
      </div>

      {/* Honeypot: hidden from people, tempting to bots. Never shown, never labelled. */}
      <div className="honeypot" aria-hidden="true">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {turnstileSiteKey ? (
        <div className="field">
          <TurnstileWidget siteKey={turnstileSiteKey} />
        </div>
      ) : null}

      <button type="submit" disabled={pending}>
        {pending ? "Mengirim..." : "Kirim"}
      </button>
    </form>
  );
}
```

`minLength` is deliberately left off the textarea: the server already enforces 10 characters with a message in Bahasa Indonesia, and the browser's native minLength bubble would speak English.

- [ ] **Step 4: Write the home page**

Replace `src/app/page.tsx`:

```tsx
import { VoiceForm } from "@/components/voice-form";

export default function HomePage() {
  return (
    <main className="container">
      <h1>Sampaikan Suara Anda</h1>
      <p>Kotak suara ini anonim. Anda tidak perlu masuk dan tidak perlu menuliskan nama.</p>

      <div className="notice">
        <strong>Yang dikirim:</strong> kategori dan isi pesan Anda.
        <br />
        <strong>Yang tidak disimpan aplikasi ini:</strong> nama, nomor karyawan, alamat IP, jenis
        perangkat, dan jam pengiriman. Manajemen hanya melihat kategori, isi pesan, dan tanggalnya.
      </div>

      <VoiceForm turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
    </main>
  );
}
```

That notice is a commitment, and it is worded as "this application does not store" rather than "nobody can know" because the hosting platform keeps its own access logs. If a future change starts storing any of those values, this copy must change in the same commit.

- [ ] **Step 5: Write the thank-you page**

Create `src/app/thank-you/page.tsx`:

```tsx
import Link from "next/link";

export default function ThankYouPage() {
  return (
    <main className="container">
      <div className="card">
        <h1>Terima kasih</h1>
        <p>
          Suara Anda sudah tersimpan secara anonim. Tidak ada data yang bisa dipakai untuk
          mengetahui siapa pengirimnya.
        </p>
        <p>
          <Link href="/">Kirim suara lain</Link>
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Verify the behaviour manually**

```bash
npm run dev
```

1. Open `http://localhost:3000`, pick a category, type at least 10 characters, submit. Expected: redirect to `/thank-you`.
2. Confirm the row landed — `npx drizzle-kit studio` → `voices` shows the new row with the right `category` and only the four expected columns.
3. Submit with a 3-character message. Expected: stays on `/`, shows "Pesan minimal 10 karakter."
4. Submit without choosing a category. Expected: stays on `/`, shows "Pilih kategori terlebih dahulu."
5. Fill the honeypot from the browser console, then submit:
   ```js
   document.querySelector('input[name="website"]').value = "http://spam.example";
   document.querySelector("form").requestSubmit();
   ```
   Expected: redirect to `/thank-you`, and **no** new row in `voices`.
6. Read the whole dev server output for that run. Expected: no request bodies, no headers, no IP addresses anywhere in it.

- [ ] **Step 7: Verify the build and lint**

```bash
npm run build
npm run lint
```

- [ ] **Step 8: Commit**

```bash
git add src/app/actions.ts src/app/page.tsx src/app/thank-you src/components/voice-form.tsx src/components/turnstile-widget.tsx
git commit -m "feat: add anonymous public submission form"
```

---

### Task 6: JWT and password primitives

**Files:**
- Create: `src/lib/jwt.ts`
- Create: `src/lib/password.ts`
- Test: `tests/jwt.test.ts`, `tests/password.test.ts`

**Interfaces:**
- Consumes: `AUTH_SECRET`.
- Produces:
  - `SESSION_COOKIE = "mv_session"`, `SESSION_TTL_SECONDS = 28800`
  - `type Role = "master" | "viewer"`, `type SessionPayload = { uid: string; role: Role }`
  - `signSessionToken(payload: SessionPayload): Promise<string>`
  - `verifySessionToken(token: string): Promise<SessionPayload | null>`
  - `BCRYPT_ROUNDS = 12`, `hashPassword(plain: string): Promise<string>`, `verifyPassword(plain: string, hash: string): Promise<boolean>`

`src/lib/jwt.ts` is the **only** auth module `src/middleware.ts` is allowed to import, so it must stay free of `next/headers`, `node:crypto`, `bcryptjs`, and any database import.

- [ ] **Step 1: Write the failing tests**

Create `tests/jwt.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { signSessionToken, verifySessionToken } from "@/lib/jwt";

beforeEach(() => {
  process.env.AUTH_SECRET = "test-secret-value-that-is-long-enough";
});

describe("session tokens", () => {
  it("round-trips a payload", async () => {
    const token = await signSessionToken({ uid: "abc-123", role: "master" });
    await expect(verifySessionToken(token)).resolves.toEqual({ uid: "abc-123", role: "master" });
  });

  it("returns null for a garbage token", async () => {
    await expect(verifySessionToken("not-a-jwt")).resolves.toBeNull();
  });

  it("returns null when the token was signed with another secret", async () => {
    const token = await signSessionToken({ uid: "abc-123", role: "viewer" });
    process.env.AUTH_SECRET = "a-completely-different-secret-value";
    await expect(verifySessionToken(token)).resolves.toBeNull();
  });

  it("throws when AUTH_SECRET is missing", async () => {
    delete process.env.AUTH_SECRET;
    await expect(signSessionToken({ uid: "abc-123", role: "viewer" })).rejects.toThrow(
      /AUTH_SECRET/,
    );
  });
});
```

Create `tests/password.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("passwords", () => {
  it("verifies a correct password", async () => {
    const hash = await hashPassword("correct horse battery");
    await expect(verifyPassword("correct horse battery", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("correct horse battery");
    await expect(verifyPassword("wrong horse battery", hash)).resolves.toBe(false);
  });

  it("produces a different hash for the same password each time", async () => {
    const a = await hashPassword("correct horse battery");
    const b = await hashPassword("correct horse battery");
    expect(a).not.toBe(b);
  });

  it("does not embed the plaintext in the hash", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash).not.toContain("correct horse battery");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/jwt.test.ts tests/password.test.ts`
Expected: FAIL — cannot resolve `@/lib/jwt` and `@/lib/password`.

- [ ] **Step 3: Write `src/lib/jwt.ts`**

```ts
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "mv_session";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

export type Role = "master" | "viewer";
export type SessionPayload = { uid: string; role: Role };

/**
 * EDGE-SAFE MODULE. src/middleware.ts imports this file, so it must never
 * import next/headers, node:crypto, bcryptjs, or the database client.
 */
function encodedSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.uid)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(encodedSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret(), { algorithms: ["HS256"] });
    const uid = payload.sub;
    const role = payload.role;
    if (typeof uid !== "string" || uid === "") return null;
    if (role !== "master" && role !== "viewer") return null;
    return { uid, role };
  } catch {
    return null;
  }
}
```

Pinning `algorithms: ["HS256"]` matters: without it, `jwtVerify` would honour whatever algorithm the token's own header names.

- [ ] **Step 4: Write `src/lib/password.ts`**

```ts
import bcrypt from "bcryptjs";

export const BCRYPT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/jwt.test.ts tests/password.test.ts`
Expected: PASS, all cases. The bcrypt tests take a couple of seconds at 12 rounds; that is expected.

- [ ] **Step 6: Commit**

```bash
git add src/lib/jwt.ts src/lib/password.ts tests/jwt.test.ts tests/password.test.ts
git commit -m "feat: add edge-safe session tokens and bcrypt password helpers"
```

---

### Task 7: Seed script

**Files:**
- Create: `scripts/seed.ts`

**Interfaces:**
- Consumes: `MASTER_EMAIL`, `MASTER_PASSWORD`, `MASTER_NAME`, `DATABASE_URL`; `hashPassword` (Task 6); `adminUsers`, `voices` (Task 3); `CATEGORIES` (Task 2).
- Produces: `npm run seed` and `npm run seed:demo`.

- [ ] **Step 1: Write the seed script**

Create `scripts/seed.ts`:

```ts
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
// Relative imports, not the @/ alias: this script runs under tsx rather than
// through the Next.js bundler, so it should not depend on tsconfig path
// resolution behaving the same way.
import { adminUsers, voices } from "../src/db/schema";
import { CATEGORIES } from "../src/lib/constants";
import { hashPassword } from "../src/lib/password";

/** Sample voices for the demo. Fictional, and written the way employees write. */
const DEMO_VOICES: { category: (typeof CATEGORIES)[number]; message: string; daysAgo: number }[] = [
  {
    category: "safety",
    message:
      "Lantai di jalur menuju gudang sering licin setelah hujan karena air masuk dari pintu samping. Mohon dipasang keset panjang atau karet anti slip.",
    daysAgo: 1,
  },
  {
    category: "safety",
    message:
      "Beberapa rekan masih bekerja di area press tanpa ear plug. Mungkin perlu pengingat rutin dari leader, bukan hanya poster.",
    daysAgo: 2,
  },
  {
    category: "facility_improvement",
    message:
      "Dispenser di lantai dua sudah lama tidak dingin. Kalau siang, air panasnya juga tidak keluar.",
    daysAgo: 3,
  },
  {
    category: "facility_improvement",
    message:
      "Tempat parkir motor kurang untuk shift dua. Banyak yang akhirnya parkir di luar dan tidak terlindung dari hujan.",
    daysAgo: 5,
  },
  {
    category: "facility_improvement",
    message:
      "Toilet dekat kantin perlu tambahan exhaust fan. Sirkulasi udaranya kurang, terutama jam istirahat.",
    daysAgo: 8,
  },
  {
    category: "hr",
    message:
      "Informasi perubahan jadwal shift sering terlambat sampai ke kami. Mungkin bisa diumumkan lebih awal supaya bisa mengatur urusan keluarga.",
    daysAgo: 9,
  },
  {
    category: "hr",
    message:
      "Proses klaim kesehatan terasa berbelit. Formulirnya masih manual padahal sistemnya sudah ada.",
    daysAgo: 12,
  },
  {
    category: "hr",
    message:
      "Sosialisasi program pelatihan kurang merata. Yang di produksi sering tahu setelah pendaftaran ditutup.",
    daysAgo: 15,
  },
];

function daysAgoAt(days: number, hour: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(hour, 17, 0, 0);
  return date;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Run: vercel env pull .env.local");

  const email = process.env.MASTER_EMAIL?.trim().toLowerCase();
  const password = process.env.MASTER_PASSWORD;
  const name = process.env.MASTER_NAME?.trim();

  if (!email || !password || !name) {
    throw new Error("MASTER_EMAIL, MASTER_PASSWORD and MASTER_NAME must all be set");
  }
  if (password.length < 12) {
    throw new Error("MASTER_PASSWORD must be at least 12 characters");
  }

  const db = drizzle(neon(url));

  const existing = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);

  if (existing.length > 0) {
    console.log(`Master account already exists: ${email}`);
  } else {
    await db.insert(adminUsers).values({
      email,
      name,
      passwordHash: await hashPassword(password),
      role: "master",
    });
    console.log(`Created master account: ${email}`);
  }

  if (process.argv.includes("--demo")) {
    const existingVoices = await db.select({ id: voices.id }).from(voices).limit(1);
    if (existingVoices.length > 0) {
      console.log("Voices already present, skipping demo data.");
    } else {
      await db.insert(voices).values(
        DEMO_VOICES.map((voice, index) => ({
          category: voice.category,
          message: voice.message,
          createdAt: daysAgoAt(voice.daysAgo, 2 + (index % 9)),
        })),
      );
      console.log(`Inserted ${DEMO_VOICES.length} demo voices.`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Seed failed");
  process.exit(1);
});
```

Two things in that file are deliberate and will look wrong otherwise:

- **The `loadEnv` calls sit above the other imports.** `src/db/client.ts` throws at import time when `DATABASE_URL` is missing, which is why this script builds its own Drizzle client rather than importing that one — the seed can then report a clear, actionable error instead of an import crash.
- **`loadEnv` is called twice**, first with `.env.local` (where `vercel env pull` writes) and then bare (`.env`). `dotenv` does not overwrite variables that are already set, so the first call wins where both files define the same key.

- [ ] **Step 2: Verify `npm run seed` is idempotent**

Set `MASTER_EMAIL`, `MASTER_PASSWORD` (12+ characters) and `MASTER_NAME` in `.env.local`, then:

```bash
npm run seed
npm run seed
```

Expected: the first run prints `Created master account: ...`; the second prints `Master account already exists: ...` and inserts nothing.

- [ ] **Step 3: Verify the guard rails**

```bash
MASTER_PASSWORD=short npx tsx scripts/seed.ts
```

Expected: exits non-zero with "MASTER_PASSWORD must be at least 12 characters". (On PowerShell: `$env:MASTER_PASSWORD="short"; npx tsx scripts/seed.ts`.)

- [ ] **Step 4: Verify `npm run seed:demo`**

```bash
npm run seed:demo
npx drizzle-kit studio
```

Expected: 8 demo voices inserted, spread across different dates, using all three categories. There is nowhere to log in yet — Task 8 builds that, and it uses these credentials.

Run it twice to confirm the demo data is not duplicated on a second run.

- [ ] **Step 5: Commit**

```bash
git add scripts/seed.ts
git commit -m "feat: add seed script for the master account and demo voices"
```

---

### Task 8: Login, session cookie, middleware, and the admin shell (M2)

**Files:**
- Create: `src/lib/session.ts`
- Create: `src/app/admin/login/actions.ts`
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/admin/(protected)/layout.tsx`
- Create: `src/app/admin/(protected)/page.tsx` — a placeholder; Task 9 fills it in
- Create: `src/middleware.ts`

**Interfaces:**
- Consumes: `SESSION_COOKIE`, `SESSION_TTL_SECONDS`, `signSessionToken`, `verifySessionToken`, `Role`, `SessionPayload` (Task 6); `verifyPassword` (Task 6); `loginSchema` (Task 2); `db`, `adminUsers`, `AdminUser` (Task 3).
- Produces:
  - `createSession(payload: SessionPayload): Promise<void>`
  - `destroySession(): Promise<void>`
  - `getSession(): Promise<SessionPayload | null>`
  - `getAuthorizedUser(allowed: Role[]): Promise<AdminUser | null>`
  - `requireRole(allowed: Role[]): Promise<AdminUser>` — redirects to `/admin/login` when not authorized
  - `type LoginState = { error?: string }`
  - `login(prevState: LoginState, formData: FormData): Promise<LoginState>`
  - `logout(): Promise<void>`

**Two structural decisions worth understanding before you start:**

1. **`/admin/login` lives outside a route group, the rest of `/admin` lives inside one.** A layout at `src/app/admin/layout.tsx` would wrap `/admin/login` too, so putting `requireRole` there would make the login page unreachable — you would be redirected to a page you cannot render. The `(protected)` route group solves it: route groups do not appear in the URL, so `src/app/admin/(protected)/page.tsx` still serves `/admin`, while `src/app/admin/login/page.tsx` sits outside the protected layout. This amends §5 of `project.md`.

2. **`requireRole` never writes to the cookie jar.** Next.js throws if a Server Component tries to modify cookies during render, and `requireRole` is called from pages. It only redirects. Clearing the cookie happens in `logout`, which is a Server Action and allowed to write.

- [ ] **Step 1: Write `src/lib/session.ts`**

```ts
import "server-only";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { adminUsers, type AdminUser } from "@/db/schema";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  signSessionToken,
  verifySessionToken,
  type Role,
  type SessionPayload,
} from "@/lib/jwt";

/** Only callable from a Server Action or Route Handler. */
export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await signSessionToken(payload);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    // Local development runs over http, where a Secure cookie is dropped.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

/** Only callable from a Server Action or Route Handler. */
export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  return token ? verifySessionToken(token) : null;
}

/**
 * Verifies the JWT AND re-reads the account from the database, so a
 * deactivated or demoted account loses access on its very next request even
 * though its cookie is still cryptographically valid.
 *
 * Returns null instead of redirecting, for callers that need to answer with a
 * status code (the CSV route handler) rather than a redirect.
 */
export async function getAuthorizedUser(allowed: Role[]): Promise<AdminUser | null> {
  const session = await getSession();
  if (!session) return null;

  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, session.uid))
    .limit(1);

  if (!user || !user.isActive) return null;
  if (!allowed.includes(user.role)) return null;
  return user;
}

/**
 * The authorization gate every admin page and server action must call.
 * Does not touch cookies: Next.js forbids cookie writes during a render.
 */
export async function requireRole(allowed: Role[]): Promise<AdminUser> {
  const user = await getAuthorizedUser(allowed);
  if (!user) redirect("/admin/login");
  return user;
}
```

- [ ] **Step 2: Write the login and logout actions**

Create `src/app/admin/login/actions.ts`:

```ts
"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { adminUsers } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/session";
import { loginSchema } from "@/lib/validation";

export type LoginState = { error?: string };

/**
 * A single generic message covers a wrong email, a wrong password, and a
 * deactivated account. Distinguishing them would tell an attacker which
 * emails are real.
 */
const GENERIC_ERROR = "Email atau kata sandi salah.";

/**
 * A bcrypt hash of a value nobody knows. Compared against when no account
 * matches, so a missing email takes the same time as a wrong password and
 * cannot be detected by timing.
 */
const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEe.O1Vc9Fa1hfLLlKvJ/OQKLbnBvVoTCPa";

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: GENERIC_ERROR };
  }

  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, parsed.data.email))
    .limit(1);

  const passwordOk = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !user.isActive || !passwordOk) {
    return { error: GENERIC_ERROR };
  }

  await createSession({ uid: user.id, role: user.role });
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}
```

- [ ] **Step 3: Write the login page**

Create `src/app/admin/login/page.tsx`:

```tsx
import { getAuthorizedUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";

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
```

- [ ] **Step 4: Write the login form component**

Create `src/components/login-form.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/admin/login/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="card">
      {state.error ? (
        <p className="error" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required />
      </div>

      <div className="field">
        <label htmlFor="password">Kata sandi</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      <button type="submit" disabled={pending}>
        {pending ? "Memproses..." : "Masuk"}
      </button>
    </form>
  );
}
```

- [ ] **Step 5: Write the protected admin layout**

Create `src/app/admin/(protected)/layout.tsx`:

```tsx
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
```

This layout is a convenience and a second line of defence, not the defence. Every page inside it still calls `requireRole` itself.

- [ ] **Step 6: Write a placeholder protected page**

Create `src/app/admin/(protected)/page.tsx`. Task 9 replaces this:

```tsx
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
```

- [ ] **Step 7: Write the middleware**

Create `src/middleware.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/jwt";

/**
 * First of the two protection layers: a cheap signature check that never
 * touches the database, so an unauthenticated request to /admin is turned away
 * before it can spin up a Neon connection.
 *
 * It deliberately does NOT check is_active or role. That requires the database,
 * and it is requireRole()'s job. This runs on the Edge runtime, so nothing here
 * may import bcryptjs, node:crypto, or the database client.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = token ? await verifySessionToken(token) : null;

  if (!payload) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
```

- [ ] **Step 8: Make sure a master account exists**

Task 7 built the seed script, so this needs no throwaway code:

```bash
npm run seed
```

Expected: either `Created master account: ...` or `Master account already exists: ...`. Either way you now have credentials to log in with.

- [ ] **Step 9: Verify the behaviour manually**

```bash
npm run dev
```

1. Visit `/admin` while logged out. Expected: redirected to `/admin/login`.
2. Log in with a wrong password. Expected: "Email atau kata sandi salah."
3. Log in with an email that does not exist. Expected: the identical message, and a visibly similar response time.
4. Log in correctly. Expected: redirected to `/admin`, the nav shows your name, and "Akun Manajemen" appears because you are a master.
5. Check the cookie in DevTools → Application → Cookies. Expected: `mv_session` present, `HttpOnly` ✓, `SameSite=Lax`, `Secure` unset (correct for local http).
6. Visit `/admin/login` while logged in. Expected: redirected to `/admin`.
7. Deactivate the account while the session is live. In a second terminal run `npx drizzle-kit studio`, open `admin_users`, set `is_active` to `false` for your account, and save. Then reload `/admin` in the browser that is still logged in. Expected: redirected to `/admin/login`, and **not** caught in a redirect loop — this is the whole point of the database re-check in `requireRole`. Set `is_active` back to `true` afterwards.
8. Click "Keluar". Expected: back at `/admin/login`, and `mv_session` gone.

- [ ] **Step 10: Verify the middleware bundle stays Edge-safe**

```bash
npm run build
```

Expected: the build succeeds with no "Module not found: Can't resolve 'crypto'" or `bcryptjs`/Node-API warning attributed to the middleware. If such an error appears, something in the `src/lib/jwt.ts` import chain pulled in a Node-only module — fix it there rather than adding a runtime override.

- [ ] **Step 11: Commit**

```bash
git add src/lib/session.ts src/middleware.ts src/app/admin src/components/login-form.tsx
git commit -m "feat: add admin login, session cookie, and middleware gate"
```

---

### Task 9: Voice list with filters, search, and pagination (M3, part 1)

**Files:**
- Create: `src/lib/format.ts`
- Create: `src/lib/like.ts`
- Create: `src/lib/query-string.ts`
- Create: `src/lib/queries.ts`
- Create: `src/components/voice-filters.tsx`
- Create: `src/components/voice-table.tsx`
- Create: `src/components/pagination.tsx`
- Modify: `src/app/admin/(protected)/page.tsx` — replace the Task 8 placeholder
- Test: `tests/format.test.ts`, `tests/like.test.ts`, `tests/query-string.test.ts`

**Interfaces:**
- Consumes: `filtersSchema`, `VoiceFilters`, `PAGE_SIZE`, `CATEGORIES`, `CATEGORY_LABELS`, `categoryLabel` (Task 2); `db`, `voices`, `Voice` (Task 3); `requireRole` (Task 8).
- Produces:
  - `formatDateJakarta(value: Date): string` → `YYYY-MM-DD`
  - `jakartaDayStart(isoDate: string): Date`
  - `jakartaDayEndExclusive(isoDate: string): Date`
  - `escapeLike(term: string): string`
  - `toQueryString(filters: VoiceFilters, overrides?: Partial<VoiceFilters>): string`
  - `voiceWhere(filters: VoiceFilters): SQL | undefined`
  - `listVoices(filters: VoiceFilters): Promise<{ rows: Voice[]; total: number; page: number; pageCount: number }>`
  - `listVoicesForExport(filters: VoiceFilters, limit?: number): Promise<Voice[]>`
  - `<VoiceFiltersForm filters={VoiceFilters} />`, `<VoiceTable rows={Voice[]} canDelete={boolean} />`, `<Pagination filters={VoiceFilters} pageCount={number} />`

- [ ] **Step 1: Write the failing tests**

Create `tests/format.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatDateJakarta, jakartaDayEndExclusive, jakartaDayStart } from "@/lib/format";

describe("formatDateJakarta", () => {
  it("formats as YYYY-MM-DD", () => {
    expect(formatDateJakarta(new Date("2026-03-15T04:00:00Z"))).toBe("2026-03-15");
  });

  it("uses the Jakarta day, not the UTC day", () => {
    // 18:00 UTC is already 01:00 the next day in Jakarta (UTC+7).
    expect(formatDateJakarta(new Date("2026-01-31T18:00:00Z"))).toBe("2026-02-01");
  });

  it("never leaks a time component", () => {
    expect(formatDateJakarta(new Date("2026-03-15T23:59:59Z"))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("jakartaDayStart", () => {
  it("resolves to 17:00 UTC the previous day", () => {
    expect(jakartaDayStart("2026-01-31").toISOString()).toBe("2026-01-30T17:00:00.000Z");
  });
});

describe("jakartaDayEndExclusive", () => {
  it("is exactly 24 hours after the day start", () => {
    const start = jakartaDayStart("2026-01-31").getTime();
    expect(jakartaDayEndExclusive("2026-01-31").getTime() - start).toBe(86_400_000);
  });

  it("includes a voice submitted late on the to-date", () => {
    const lateInJakarta = new Date("2026-01-31T16:30:00Z"); // 23:30 Jakarta time
    expect(lateInJakarta.getTime()).toBeLessThan(jakartaDayEndExclusive("2026-01-31").getTime());
  });
});
```

Create `tests/like.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { escapeLike } from "@/lib/like";

describe("escapeLike", () => {
  it("leaves ordinary text alone", () => {
    expect(escapeLike("licin")).toBe("licin");
  });

  it("escapes a percent sign so it is not a wildcard", () => {
    expect(escapeLike("100%")).toBe("100\\%");
  });

  it("escapes an underscore so it is not a single-character wildcard", () => {
    expect(escapeLike("shift_2")).toBe("shift\\_2");
  });

  it("escapes a backslash", () => {
    expect(escapeLike("a\\b")).toBe("a\\\\b");
  });
});
```

Create `tests/query-string.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { toQueryString } from "@/lib/query-string";

describe("toQueryString", () => {
  it("omits empty filters and page 1", () => {
    expect(toQueryString({ page: 1 })).toBe("");
  });

  it("keeps the filters that are set", () => {
    expect(toQueryString({ category: "safety", q: "licin", page: 1 })).toBe(
      "category=safety&q=licin",
    );
  });

  it("includes a page beyond the first", () => {
    expect(toQueryString({ page: 3 })).toBe("page=3");
  });

  it("applies overrides on top of the current filters", () => {
    expect(toQueryString({ category: "hr", page: 2 }, { page: 5 })).toBe("category=hr&page=5");
  });

  it("encodes values that need it", () => {
    expect(toQueryString({ q: "jam & shift", page: 1 })).toBe("q=jam+%26+shift");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/format.test.ts tests/like.test.ts tests/query-string.test.ts`
Expected: FAIL — cannot resolve `@/lib/format`, `@/lib/like`, `@/lib/query-string`.

- [ ] **Step 3: Write `src/lib/format.ts`**

```ts
const TIME_ZONE = "Asia/Jakarta";

/** en-CA renders as YYYY-MM-DD, which is what the dashboard and CSV both want. */
const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * ANONYMITY REQUIREMENT: date only. created_at keeps its full precision in the
 * database for sorting, and this is the only function allowed to render it.
 * Never format created_at with a time component anywhere in the UI or the CSV.
 */
export function formatDateJakarta(value: Date): string {
  return dateFormatter.format(value);
}

/** Midnight Jakarta time on the given YYYY-MM-DD, as an absolute instant. */
export function jakartaDayStart(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00+07:00`);
}

/**
 * Midnight Jakarta time on the following day, used as an exclusive upper bound
 * so a voice submitted at 23:30 on the "to" date is still included.
 */
export function jakartaDayEndExclusive(isoDate: string): Date {
  return new Date(jakartaDayStart(isoDate).getTime() + 86_400_000);
}
```

- [ ] **Step 4: Write `src/lib/like.ts`**

```ts
/**
 * Escapes the LIKE/ILIKE metacharacters so a search for "100%" matches the
 * literal text instead of becoming a wildcard that matches everything.
 */
export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (character) => `\\${character}`);
}
```

- [ ] **Step 5: Write `src/lib/query-string.ts`**

```ts
import type { VoiceFilters } from "@/lib/validation";

/**
 * Serialises the active filters back into a query string, so pagination links
 * and the CSV export link both carry exactly what the list is showing.
 * Page 1 is omitted because it is the default.
 */
export function toQueryString(
  filters: VoiceFilters,
  overrides: Partial<VoiceFilters> = {},
): string {
  const merged = { ...filters, ...overrides };
  const params = new URLSearchParams();

  if (merged.category) params.set("category", merged.category);
  if (merged.from) params.set("from", merged.from);
  if (merged.to) params.set("to", merged.to);
  if (merged.q) params.set("q", merged.q);
  if (merged.page && merged.page > 1) params.set("page", String(merged.page));

  return params.toString();
}
```

- [ ] **Step 6: Run the pure-function tests to verify they pass**

Run: `npx vitest run tests/format.test.ts tests/like.test.ts tests/query-string.test.ts`
Expected: PASS, all cases.

- [ ] **Step 7: Write `src/lib/queries.ts`**

```ts
import { and, count, desc, eq, gte, ilike, lt, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { voices, type Voice } from "@/db/schema";
import { PAGE_SIZE } from "@/lib/constants";
import { jakartaDayEndExclusive, jakartaDayStart } from "@/lib/format";
import { escapeLike } from "@/lib/like";
import type { VoiceFilters } from "@/lib/validation";

/** Shared by the list page and the CSV export so both apply identical filters. */
export function voiceWhere(filters: VoiceFilters): SQL | undefined {
  const conditions: SQL[] = [];

  if (filters.category) {
    conditions.push(eq(voices.category, filters.category));
  }
  if (filters.from) {
    conditions.push(gte(voices.createdAt, jakartaDayStart(filters.from)));
  }
  if (filters.to) {
    conditions.push(lt(voices.createdAt, jakartaDayEndExclusive(filters.to)));
  }
  if (filters.q) {
    conditions.push(ilike(voices.message, `%${escapeLike(filters.q)}%`));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

export async function listVoices(filters: VoiceFilters): Promise<{
  rows: Voice[];
  total: number;
  page: number;
  pageCount: number;
}> {
  const where = voiceWhere(filters);

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(voices)
    .where(where);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);

  const rows = await db
    .select()
    .from(voices)
    .where(where)
    .orderBy(desc(voices.createdAt))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  return { rows, total, page, pageCount };
}

/**
 * Rows for the CSV export. Capped so a runaway export cannot exhaust the
 * function's memory or time budget on the Hobby plan.
 */
export async function listVoicesForExport(
  filters: VoiceFilters,
  limit = 5000,
): Promise<Voice[]> {
  return db
    .select()
    .from(voices)
    .where(voiceWhere(filters))
    .orderBy(desc(voices.createdAt))
    .limit(limit);
}
```

`page` is clamped to `pageCount` so `?page=999` shows the last page instead of an empty table.

- [ ] **Step 8: Write the filters form**

Create `src/components/voice-filters.tsx`. This is a plain GET form, so it needs no client JavaScript:

```tsx
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";
import type { VoiceFilters } from "@/lib/validation";

export function VoiceFiltersForm({ filters }: { filters: VoiceFilters }) {
  return (
    <form action="/admin" method="get" className="card" style={{ marginBottom: 20 }}>
      <div className="filters">
        <div>
          <label htmlFor="filter-category">Kategori</label>
          <select id="filter-category" name="category" defaultValue={filters.category ?? ""}>
            <option value="">Semua kategori</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-from">Dari tanggal</label>
          <input id="filter-from" name="from" type="date" defaultValue={filters.from ?? ""} />
        </div>

        <div>
          <label htmlFor="filter-to">Sampai tanggal</label>
          <input id="filter-to" name="to" type="date" defaultValue={filters.to ?? ""} />
        </div>

        <div>
          <label htmlFor="filter-q">Cari isi pesan</label>
          <input
            id="filter-q"
            name="q"
            type="text"
            defaultValue={filters.q ?? ""}
            placeholder="kata kunci"
          />
        </div>
      </div>

      <div className="row-actions">
        <button type="submit">Terapkan</button>
        <a className="hint" href="/admin">
          Reset
        </a>
      </div>
    </form>
  );
}
```

Submitting resets to page 1 naturally, because the form has no `page` input.

- [ ] **Step 9: Write the table**

Create `src/components/voice-table.tsx`:

```tsx
import { DeleteVoiceButton } from "@/components/delete-voice-button";
import { categoryLabel } from "@/lib/constants";
import type { Voice } from "@/db/schema";
import { formatDateJakarta } from "@/lib/format";

export function VoiceTable({ rows, canDelete }: { rows: Voice[]; canDelete: boolean }) {
  if (rows.length === 0) {
    return (
      <div className="card">
        <p>Tidak ada suara yang cocok dengan filter ini.</p>
      </div>
    );
  }

  return (
    <div className="card table-scroll">
      <table>
        <thead>
          <tr>
            <th scope="col">Tanggal</th>
            <th scope="col">Kategori</th>
            <th scope="col">Pesan</th>
            {canDelete ? <th scope="col">Aksi</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {/* Date only. Never render row.createdAt with a time. */}
              <td style={{ whiteSpace: "nowrap" }}>{formatDateJakarta(row.createdAt)}</td>
              <td style={{ whiteSpace: "nowrap" }}>{categoryLabel(row.category)}</td>
              <td style={{ minWidth: 280, whiteSpace: "pre-wrap" }}>{row.message}</td>
              {canDelete ? (
                <td>
                  <DeleteVoiceButton voiceId={row.id} />
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

`DeleteVoiceButton` arrives in Task 12. Until then, create a stub so this task builds:

```tsx
// src/components/delete-voice-button.tsx - replaced in full by Task 12
export function DeleteVoiceButton({ voiceId }: { voiceId: string }) {
  return <span className="hint" data-voice-id={voiceId} />;
}
```

- [ ] **Step 10: Write the pagination control**

Create `src/components/pagination.tsx`:

```tsx
import Link from "next/link";
import { toQueryString } from "@/lib/query-string";
import type { VoiceFilters } from "@/lib/validation";

export function Pagination({
  filters,
  page,
  pageCount,
}: {
  filters: VoiceFilters;
  page: number;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;

  const hrefFor = (target: number) => {
    const query = toQueryString(filters, { page: target });
    return query ? `/admin?${query}` : "/admin";
  };

  return (
    <nav className="row-actions" style={{ alignItems: "center", marginTop: 16 }}>
      {page > 1 ? <Link href={hrefFor(page - 1)}>&larr; Sebelumnya</Link> : <span />}
      <span className="hint">
        Halaman {page} dari {pageCount}
      </span>
      {page < pageCount ? <Link href={hrefFor(page + 1)}>Berikutnya &rarr;</Link> : <span />}
    </nav>
  );
}
```

- [ ] **Step 11: Write the voice list page**

Replace `src/app/admin/(protected)/page.tsx`:

```tsx
import Link from "next/link";
import { Pagination } from "@/components/pagination";
import { VoiceFiltersForm } from "@/components/voice-filters";
import { VoiceTable } from "@/components/voice-table";
import { listVoices } from "@/lib/queries";
import { toQueryString } from "@/lib/query-string";
import { requireRole } from "@/lib/session";
import { filtersSchema } from "@/lib/validation";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireRole(["master", "viewer"]);

  const raw = await searchParams;
  const filters = filtersSchema.parse({
    category: raw.category,
    from: raw.from,
    to: raw.to,
    q: raw.q,
    page: raw.page,
  });

  const { rows, total, page, pageCount } = await listVoices(filters);
  const exportQuery = toQueryString(filters, { page: 1 });

  return (
    <main className="container container--wide">
      <div className="row-actions" style={{ alignItems: "baseline" }}>
        <h1 style={{ flex: 1 }}>Daftar Suara</h1>
        <Link href={exportQuery ? `/admin/export?${exportQuery}` : "/admin/export"}>
          Unduh CSV
        </Link>
      </div>

      <p className="hint">
        {total} suara ditemukan. Tanggal saja yang ditampilkan, tanpa jam, untuk menjaga
        anonimitas pengirim.
      </p>

      <VoiceFiltersForm filters={filters} />
      <VoiceTable rows={rows} canDelete={user.role === "master"} />
      <Pagination filters={filters} page={page} pageCount={pageCount} />
    </main>
  );
}
```

- [ ] **Step 12: Verify the behaviour manually**

```bash
npm run seed:demo
npm run dev
```

Log in, then check each of these at `/admin`:

1. All 8 demo voices are listed, newest first.
2. Every row shows a date in `YYYY-MM-DD` form with **no** time. Read a few rows closely — this is the requirement most easily broken by accident.
3. Filter by "Keselamatan (K3)". Expected: only the 2 safety voices, and the count text updates.
4. Set "Dari tanggal" to today and "Sampai tanggal" to today. Expected: only voices submitted today (submit one through `/` first if needed), which confirms the `to` bound is inclusive of the whole day.
5. Search `licin`. Expected: the matching voice only.
6. Search `%`. Expected: no rows (or only genuine matches), **not** every row — this is what `escapeLike` prevents.
7. Visit `/admin?page=999`. Expected: the last page renders, not an empty table.
8. Visit `/admin?category=bogus&from=not-a-date&page=abc`. Expected: the page renders unfiltered on page 1, no 500.
9. Narrow the browser to 390px wide. Expected: the table scrolls horizontally inside its card and the page itself does not scroll sideways.

- [ ] **Step 13: Run the full test suite, build, and lint**

```bash
npm run test
npm run build
npm run lint
```

- [ ] **Step 14: Commit**

```bash
git add src/lib/format.ts src/lib/like.ts src/lib/query-string.ts src/lib/queries.ts src/components src/app/admin tests
git commit -m "feat: add admin voice list with filters, search, and pagination"
```

---

### Task 10: CSV export (M3, part 2)

**Files:**
- Create: `src/lib/csv.ts`
- Create: `src/app/admin/(protected)/export/route.ts`
- Test: `tests/csv.test.ts`

**Interfaces:**
- Consumes: `formatDateJakarta` (Task 9); `listVoicesForExport` (Task 9); `categoryLabel` (Task 2); `filtersSchema` (Task 2); `getAuthorizedUser` (Task 8).
- Produces:
  - `escapeCsvCell(value: string): string`
  - `buildVoicesCsv(rows: { createdAt: Date; category: string; message: string }[]): string`
  - `GET /admin/export`

- [ ] **Step 1: Write the failing test**

Create `tests/csv.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildVoicesCsv, escapeCsvCell } from "@/lib/csv";

describe("escapeCsvCell", () => {
  it("leaves plain text unquoted", () => {
    expect(escapeCsvCell("Keselamatan")).toBe("Keselamatan");
  });

  it("quotes a value containing a comma", () => {
    expect(escapeCsvCell("a,b")).toBe('"a,b"');
  });

  it("quotes a value containing a newline", () => {
    expect(escapeCsvCell("baris satu\nbaris dua")).toBe('"baris satu\nbaris dua"');
  });

  it("doubles an embedded double quote", () => {
    expect(escapeCsvCell('dia bilang "aman"')).toBe('"dia bilang ""aman"""');
  });

  it("neutralises a leading equals sign so spreadsheets do not run it", () => {
    expect(escapeCsvCell("=1+1")).toBe("'=1+1");
  });

  it("neutralises leading plus, minus and at signs", () => {
    expect(escapeCsvCell("+1")).toBe("'+1");
    expect(escapeCsvCell("-1")).toBe("'-1");
    expect(escapeCsvCell("@SUM(A1)")).toBe("'@SUM(A1)");
  });
});

describe("buildVoicesCsv", () => {
  const rows = [
    {
      createdAt: new Date("2026-03-15T04:00:00Z"),
      category: "safety",
      message: "Lantai licin",
    },
    {
      createdAt: new Date("2026-03-14T04:00:00Z"),
      category: "facility_improvement",
      message: "Dispenser, tidak dingin",
    },
  ];

  it("starts with a UTF-8 BOM so Excel reads Indonesian text correctly", () => {
    expect(buildVoicesCsv(rows).startsWith("﻿")).toBe(true);
  });

  it("uses an Indonesian header row", () => {
    const lines = buildVoicesCsv(rows).replace("﻿", "").split("\r\n");
    expect(lines[0]).toBe("Tanggal,Kategori,Pesan");
  });

  it("renders the date only, never a time", () => {
    const lines = buildVoicesCsv(rows).replace("﻿", "").split("\r\n");
    expect(lines[1].startsWith("2026-03-15,")).toBe(true);
    expect(lines[1]).not.toMatch(/\d{2}:\d{2}/);
  });

  it("uses the Indonesian category label", () => {
    expect(buildVoicesCsv(rows)).toContain("Keselamatan (K3)");
  });

  it("quotes a message containing a comma", () => {
    expect(buildVoicesCsv(rows)).toContain('"Dispenser, tidak dingin"');
  });

  it("returns just the header for an empty result", () => {
    expect(buildVoicesCsv([])).toBe("﻿Tanggal,Kategori,Pesan\r\n");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/csv.test.ts`
Expected: FAIL — cannot resolve `@/lib/csv`.

- [ ] **Step 3: Write `src/lib/csv.ts`**

```ts
import { categoryLabel } from "@/lib/constants";
import { formatDateJakarta } from "@/lib/format";

const HEADER = ["Tanggal", "Kategori", "Pesan"];

/**
 * Escapes one CSV cell.
 *
 * The leading-character check is not cosmetic: a spreadsheet treats a cell
 * starting with = + - or @ as a formula, so a submitted message beginning with
 * one of those would execute when a manager opens the export. Prefixing an
 * apostrophe forces it to stay text.
 */
export function escapeCsvCell(value: string): string {
  const neutralised = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(neutralised) ? `"${neutralised.replace(/"/g, '""')}"` : neutralised;
}

/**
 * ANONYMITY REQUIREMENT: the first column is the date alone. Never add a time
 * column, and never widen this to include anything beyond these three fields.
 */
export function buildVoicesCsv(
  rows: { createdAt: Date; category: string; message: string }[],
): string {
  const lines = [HEADER.join(",")];

  for (const row of rows) {
    lines.push(
      [
        escapeCsvCell(formatDateJakarta(row.createdAt)),
        escapeCsvCell(categoryLabel(row.category)),
        escapeCsvCell(row.message),
      ].join(","),
    );
  }

  // The BOM is what makes Excel on Windows read this as UTF-8.
  return `﻿${lines.join("\r\n")}\r\n`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/csv.test.ts`
Expected: PASS, all cases.

- [ ] **Step 5: Write the export route handler**

Create `src/app/admin/(protected)/export/route.ts`:

```ts
import { buildVoicesCsv } from "@/lib/csv";
import { formatDateJakarta } from "@/lib/format";
import { listVoicesForExport } from "@/lib/queries";
import { getAuthorizedUser } from "@/lib/session";
import { filtersSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // A route handler answers with a status code rather than a redirect, so it
  // uses getAuthorizedUser instead of requireRole. The database re-check still
  // happens - middleware alone is not the authorization.
  const user = await getAuthorizedUser(["master", "viewer"]);
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const filters = filtersSchema.parse({
    category: params.get("category") ?? undefined,
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
    q: params.get("q") ?? undefined,
    page: params.get("page") ?? undefined,
  });

  const rows = await listVoicesForExport(filters);
  const filename = `members-voice-${formatDateJakarta(new Date())}.csv`;

  return new Response(buildVoicesCsv(rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
```

- [ ] **Step 6: Verify the behaviour manually**

```bash
npm run dev
```

1. Logged in, click "Unduh CSV" from an unfiltered `/admin`. Expected: a file downloads named `members-voice-<today>.csv`.
2. Open it in Excel or LibreOffice. Expected: Indonesian text renders correctly (no `Ã¬` mojibake), one header row, and the date column holds dates with **no** times.
3. Filter to one category, then click "Unduh CSV". Expected: the export contains only that category — the filters travel with the link.
4. Submit a voice whose message begins with `=1+1` through `/`, then export. Expected: the cell shows the literal `=1+1` and the spreadsheet does not evaluate it.
5. Log out, then request `/admin/export` directly (paste the URL). Expected: redirected to `/admin/login` by the middleware.
6. Test the second layer directly, bypassing middleware assumptions — with a valid cookie for a **deactivated** account, request the URL. Expected: `401 Unauthorized`, not a CSV.

- [ ] **Step 7: Run the full suite, build, and lint**

```bash
npm run test
npm run build
npm run lint
```

- [ ] **Step 8: Commit**

```bash
git add src/lib/csv.ts "src/app/admin/(protected)/export" tests/csv.test.ts
git commit -m "feat: add filtered CSV export for management"
```

---

### Task 11: Management account administration (M4)

**Files:**
- Create: `src/app/admin/(protected)/users/actions.ts`
- Create: `src/app/admin/(protected)/users/page.tsx`
- Create: `src/components/user-admin.tsx`
- Create: `src/components/confirm-button.tsx`
- Modify: `src/lib/queries.ts` — add `listAdminUsers`

**Interfaces:**
- Consumes: `createUserSchema`, `resetPasswordSchema`, `fieldErrors` (Task 2); `hashPassword` (Task 6); `requireRole` (Task 8); `db`, `adminUsers`, `AdminUser` (Task 3); `formatDateJakarta` (Task 9).
- Produces:
  - `listAdminUsers(): Promise<AdminUser[]>`
  - `type UserFormState = { errors: Record<string, string>; ok?: string }`
  - `createUser(prevState: UserFormState, formData: FormData): Promise<UserFormState>`
  - `resetPassword(prevState: UserFormState, formData: FormData): Promise<UserFormState>`
  - `setUserActive(formData: FormData): Promise<void>`
  - `<ConfirmButton label={string} confirmLabel={string} className?={string} />` — reused by Task 12
  - `<CreateUserForm />`, `<ResetPasswordForm userId={string} />`

There is no action that changes an existing account's role. "A master cannot demote themselves" is satisfied by there being no demotion path at all; roles are fixed at creation. If role editing is ever added, it must refuse to change the acting user's own role.

- [ ] **Step 1: Add `listAdminUsers` to `src/lib/queries.ts`**

Append to `src/lib/queries.ts`, and extend its existing import of `@/db/schema` to include `adminUsers` and the `AdminUser` type:

```ts
import { adminUsers, voices, type AdminUser, type Voice } from "@/db/schema";
import { asc } from "drizzle-orm";

// ... existing voice queries above ...

export async function listAdminUsers(): Promise<AdminUser[]> {
  return db.select().from(adminUsers).orderBy(asc(adminUsers.email));
}
```

Merge `asc` into the existing `drizzle-orm` import rather than adding a second import line.

- [ ] **Step 2: Write the user actions**

Create `src/app/admin/(protected)/users/actions.ts`:

```ts
"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { adminUsers } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { requireRole } from "@/lib/session";
import { createUserSchema, fieldErrors, resetPasswordSchema } from "@/lib/validation";

export type UserFormState = { errors: Record<string, string>; ok?: string };

export async function createUser(
  _prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  // Every action re-authorizes. A server action is a public POST endpoint:
  // rendering the page is not what protects it.
  await requireRole(["master"]);

  const parsed = createUserSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    role: formData.get("role"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error) };
  }

  const existing = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, parsed.data.email))
    .limit(1);

  if (existing.length > 0) {
    return { errors: { email: "Email ini sudah terdaftar." } };
  }

  await db.insert(adminUsers).values({
    email: parsed.data.email,
    name: parsed.data.name,
    role: parsed.data.role,
    passwordHash: await hashPassword(parsed.data.password),
  });

  revalidatePath("/admin/users");
  return { errors: {}, ok: `Akun ${parsed.data.email} dibuat.` };
}

export async function resetPassword(
  _prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  await requireRole(["master"]);

  const parsed = resetPasswordSchema.safeParse({
    userId: formData.get("userId"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error) };
  }

  await db
    .update(adminUsers)
    .set({ passwordHash: await hashPassword(parsed.data.password) })
    .where(eq(adminUsers.id, parsed.data.userId));

  revalidatePath("/admin/users");
  return { errors: {}, ok: "Kata sandi diganti. Sampaikan kata sandi baru lewat jalur pribadi." };
}

export async function setUserActive(formData: FormData): Promise<void> {
  const actor = await requireRole(["master"]);

  const userId = formData.get("userId");
  const nextActive = formData.get("active") === "true";
  if (typeof userId !== "string" || userId === "") return;

  // A master must not be able to lock themselves out. The UI hides the button
  // for the current user; this is the check that actually enforces it, because
  // the form can be POSTed directly.
  if (userId === actor.id) return;

  await db.update(adminUsers).set({ isActive: nextActive }).where(eq(adminUsers.id, userId));

  revalidatePath("/admin/users");
}
```

- [ ] **Step 3: Write the two-step confirm button**

Create `src/components/confirm-button.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

/**
 * A submit button that requires two clicks. Preferred over window.confirm,
 * which is styled by the browser and blocked in some embedded contexts.
 */
export function ConfirmButton({
  label,
  confirmLabel,
  className = "secondary",
}: {
  label: string;
  confirmLabel: string;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  const { pending } = useFormStatus();

  if (!armed) {
    return (
      <button type="button" className={className} onClick={() => setArmed(true)}>
        {label}
      </button>
    );
  }

  return (
    <span className="row-actions">
      <button type="submit" className="danger" disabled={pending}>
        {pending ? "Memproses..." : confirmLabel}
      </button>
      <button type="button" className="secondary" onClick={() => setArmed(false)}>
        Batal
      </button>
    </span>
  );
}
```

`useFormStatus` reads the state of the enclosing `<form>`, so this component must always be rendered inside one.

- [ ] **Step 4: Write the user administration forms**

Create `src/components/user-admin.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { createUser, resetPassword, type UserFormState } from "@/app/admin/(protected)/users/actions";

const initialState: UserFormState = { errors: {} };

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState(createUser, initialState);

  return (
    <form action={formAction} className="card" style={{ marginBottom: 24 }}>
      <h2>Buat Akun Baru</h2>

      {state.ok ? (
        <p className="ok" role="status">
          {state.ok}
        </p>
      ) : null}

      <div className="field">
        <label htmlFor="new-email">Email</label>
        <input id="new-email" name="email" type="email" required />
        {state.errors.email ? <p className="error">{state.errors.email}</p> : null}
      </div>

      <div className="field">
        <label htmlFor="new-name">Nama</label>
        <input id="new-name" name="name" type="text" required />
        {state.errors.name ? <p className="error">{state.errors.name}</p> : null}
      </div>

      <div className="field">
        <label htmlFor="new-role">Peran</label>
        <select id="new-role" name="role" defaultValue="viewer">
          <option value="viewer">Manajemen (hanya membaca)</option>
          <option value="master">Master (kelola akun)</option>
        </select>
        {state.errors.role ? <p className="error">{state.errors.role}</p> : null}
      </div>

      <div className="field">
        <label htmlFor="new-password">Kata sandi awal</label>
        <input
          id="new-password"
          name="password"
          type="text"
          autoComplete="off"
          required
          minLength={12}
        />
        <p className="hint">
          Minimal 12 karakter. Sampaikan kata sandi ini lewat jalur pribadi, bukan grup.
        </p>
        {state.errors.password ? <p className="error">{state.errors.password}</p> : null}
      </div>

      <button type="submit" disabled={pending}>
        {pending ? "Menyimpan..." : "Buat Akun"}
      </button>
    </form>
  );
}

export function ResetPasswordForm({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="userId" value={userId} />
      <div className="row-actions">
        <input
          name="password"
          type="text"
          autoComplete="off"
          placeholder="kata sandi baru"
          minLength={12}
          required
          style={{ minWidth: 180 }}
        />
        <button className="secondary" type="submit" disabled={pending}>
          {pending ? "..." : "Ganti"}
        </button>
      </div>
      {state.errors.password ? <p className="error">{state.errors.password}</p> : null}
      {state.errors.userId ? <p className="error">{state.errors.userId}</p> : null}
      {state.ok ? <p className="ok">{state.ok}</p> : null}
    </form>
  );
}
```

The initial password field is `type="text"` on purpose: the master is reading a value out to hand over, not typing their own secret, and a masked field invites transcription errors.

- [ ] **Step 5: Write the users page**

Create `src/app/admin/(protected)/users/page.tsx`:

```tsx
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
    </main>
  );
}
```

- [ ] **Step 6: Verify the behaviour manually**

```bash
npm run dev
```

As the master at `/admin/users`:

1. Create a `viewer` account with a 12+ character password. Expected: success message, the row appears.
2. Create another account with the same email. Expected: "Email ini sudah terdaftar." and no second row.
3. Create an account with an 8-character password. Expected: "Kata sandi minimal 12 karakter."
4. Log out, log in as the new viewer. Expected: `/admin` works, and "Akun Manajemen" is **absent** from the nav.
5. Still as the viewer, request `/admin/users` directly. Expected: redirected to `/admin/login` — `requireRole(["master"])` refuses, and this is the check that matters.
6. Back as the master, click "Nonaktifkan" on the viewer. Expected: two-step confirm, then status becomes "Nonaktif".
7. In the viewer's still-open browser session, reload `/admin`. Expected: redirected to `/admin/login`, immediately, without waiting for the 8-hour token to expire.
8. Reactivate the viewer, then reset its password from the master's screen and confirm the new password works and the old one does not.
9. Confirm your own row shows "Akun Anda" with no deactivate button.
10. Verify the server-side self-lockout guard, which the hidden button alone does not prove. As the master, from the browser console on `/admin/users`, POST the action against your own id by editing another row's hidden `userId` to your own id and submitting. Expected: nothing changes, your account stays active.

- [ ] **Step 7: Run the full suite, build, and lint**

```bash
npm run test
npm run build
npm run lint
```

- [ ] **Step 8: Commit**

```bash
git add "src/app/admin/(protected)/users" src/components/user-admin.tsx src/components/confirm-button.tsx src/lib/queries.ts
git commit -m "feat: add management account administration for the master"
```

---

### Task 12: Permanent deletion of a single voice

New scope beyond `project.md`, from the retention decision. The master can remove a voice that is abusive or that identifies its own sender.

**Files:**
- Create: `src/app/admin/(protected)/actions.ts`
- Modify: `src/components/delete-voice-button.tsx` — replace the Task 9 stub in full

**Interfaces:**
- Consumes: `requireRole` (Task 8); `db`, `voices` (Task 3); `ConfirmButton` (Task 11).
- Produces:
  - `deleteVoice(formData: FormData): Promise<void>`
  - `<DeleteVoiceButton voiceId={string} />` — the real implementation, same props as the Task 9 stub

- [ ] **Step 1: Write the delete action**

Create `src/app/admin/(protected)/actions.ts`:

```ts
"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { voices } from "@/db/schema";
import { requireRole } from "@/lib/session";

/**
 * Permanently removes one voice. Master only.
 *
 * A hard delete, with no audit record of the message content. An audit trail
 * storing the deleted text would preserve exactly what the deletion was meant
 * to destroy - usually a message that identified its own sender.
 */
export async function deleteVoice(formData: FormData): Promise<void> {
  await requireRole(["master"]);

  const voiceId = formData.get("voiceId");
  if (typeof voiceId !== "string" || voiceId === "") return;

  await db.delete(voices).where(eq(voices.id, voiceId));

  revalidatePath("/admin");
}
```

- [ ] **Step 2: Replace the delete button stub**

Replace `src/components/delete-voice-button.tsx` entirely:

```tsx
import { deleteVoice } from "@/app/admin/(protected)/actions";
import { ConfirmButton } from "@/components/confirm-button";

export function DeleteVoiceButton({ voiceId }: { voiceId: string }) {
  return (
    <form action={deleteVoice}>
      <input type="hidden" name="voiceId" value={voiceId} />
      <ConfirmButton label="Hapus" confirmLabel="Ya, hapus permanen" />
    </form>
  );
}
```

This is a Server Component that renders a client `ConfirmButton` inside a form — no `"use client"` needed here.

- [ ] **Step 3: Verify the behaviour manually**

```bash
npm run dev
```

1. As the master at `/admin`, the "Aksi" column shows "Hapus" on every row.
2. Click "Hapus". Expected: it becomes "Ya, hapus permanen" plus "Batal". Click "Batal" — nothing is deleted.
3. Click "Hapus" then "Ya, hapus permanen". Expected: the row disappears and the total count drops by one.
4. Confirm it is gone from the database: `npx drizzle-kit studio` → the row is absent from `voices`.
5. Log in as a `viewer`. Expected: the "Aksi" column is **absent** from the table.
6. Still as the viewer, invoke the action directly — copy the delete form's markup into the console on `/admin` and submit it with a real voice id. Expected: redirected to `/admin/login` and the voice still exists. This is the check that matters; hiding the column is only cosmetic.

- [ ] **Step 4: Run the full suite, build, and lint**

```bash
npm run test
npm run build
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add "src/app/admin/(protected)/actions.ts" src/components/delete-voice-button.tsx
git commit -m "feat: let the master permanently delete a single voice"
```

---

### Task 13: Anonymity audit, README, QR code, and deployment (M5)

**Files:**
- Create: `README.md`
- Create: `public/qr.png`
- Modify: `project.md` — tick the milestone checkboxes that are now done

**Interfaces:**
- Consumes: everything built so far.
- Produces: a deployed demo URL, a QR code image, and written documentation of the residual risks and open decisions.

- [ ] **Step 1: Audit the submit path for leaks**

Run each of these and read the output. This is the requirement that is easiest to break by accident and hardest to notice:

```bash
# No logging anywhere in the submit path.
grep -rn "console\." src/app/actions.ts src/lib/rate-limit.ts src/lib/turnstile.ts src/lib/hash-ip.ts

# The only place createdAt is rendered should be via formatDateJakarta.
grep -rn "createdAt" src --include="*.tsx"

# No time formatting anywhere.
grep -rniE "toLocaleTimeString|timeStyle|getHours|HH:mm" src

# Nothing resembling identifying columns reached the schema.
grep -rniE "ip_address|ipAddress|userAgent|user_agent|fingerprint|submittedBy|user_id" src
```

Expected: the first three produce no matches other than `formatDateJakarta(...)` uses in `voice-table.tsx` and `users/page.tsx`; the last produces nothing at all. Fix anything that turns up before continuing.

- [ ] **Step 2: Verify the schema one final time**

```bash
npx drizzle-kit studio
```

Expected: `voices` has exactly `id`, `category`, `message`, `created_at`. No `area`, no IP, no reference to `admin_users`.

- [ ] **Step 3: Write the README**

Create `README.md`:

````markdown
# Member's Voice

Kotak suara anonim untuk seluruh karyawan. Karyawan mengirim suara tanpa login.
Akun manajemen masuk untuk membaca, dan akun master mengelola akun manajemen.

Spesifikasi lengkap ada di [project.md](project.md). Rencana implementasi ada di
[docs/superpowers/plans](docs/superpowers/plans).

## Status

Demo. Berjalan di Vercel Hobby plan.

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env.local   # lalu isi nilainya
npm run db:push
npm run seed:demo
npm run dev
```

`AUTH_SECRET` dibuat dengan `openssl rand -base64 32`.
Turnstile dan rate limiting hanya aktif kalau kuncinya diisi, jadi pengembangan
lokal bisa jalan tanpa keduanya.

## Perintah

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Pengembangan lokal |
| `npm run build` | Build produksi |
| `npm run test` | Unit test (Vitest) |
| `npm run db:push` | Sinkronkan skema ke database |
| `npm run db:generate` / `db:migrate` | Migrasi berversi, dipakai setelah demo jadi resmi |
| `npm run seed` | Buat akun master |
| `npm run seed:demo` | Buat akun master + data contoh |

## Peran

| Peran | Login | Bisa apa |
|---|---|---|
| Karyawan | Tidak | Mengirim suara |
| `viewer` | Ya | Membaca, memfilter, mencari, mengekspor |
| `master` | Ya | Semua milik `viewer`, kelola akun, hapus satu suara |

## Yang menjaga anonimitas

- Tabel `voices` hanya punya `id`, `category`, `message`, `created_at`. Tidak ada
  relasi ke pengguna, alamat IP, atau perangkat, dan tidak boleh ditambahkan.
- Jalur pengiriman tidak pernah menulis body atau header request ke log.
- Dashboard dan CSV menampilkan tanggal saja, tanpa jam.
- Rate limiting memakai SHA-256 bergaram dari alamat IP dengan TTL singkat di
  Redis, dan tidak pernah dihubungkan ke baris `voices`.
- Tidak ada unggahan file, karena EXIF pada foto bisa membuka identitas pengirim.

## Batas yang harus disadari sebelum dipakai resmi

Empat hal ini bukan bug, melainkan konsekuensi dari desain demo. Semuanya perlu
keputusan manajemen.

1. **Log platform.** Aplikasi tidak menyimpan alamat IP, tetapi Vercel dan
   Cloudflare tetap menyimpan access log berisi IP di sisi mereka. Klaim di form
   karena itu berbunyi "aplikasi ini tidak menyimpan", bukan "tidak ada yang bisa
   tahu". Kalau ancaman yang dikhawatirkan termasuk pihak dengan akses ke log
   hosting, aplikasi ini harus pindah ke infrastruktur perusahaan.
2. **Volume rendah.** Kalau dalam sehari hanya masuk satu suara, tanggalnya saja
   sudah cukup untuk menduga pengirimnya. Opsi mitigasi: tampilkan minggu bukan
   tanggal, atau tahan suara sampai ada beberapa di periode yang sama.
3. **Urutan daftar.** Daftar diurutkan `created_at` menurun, jadi urutan dalam
   satu hari masih menunjukkan siapa yang mengirim lebih dulu meski jamnya
   disembunyikan.
4. **Isi pesan.** Pengirim bisa membuka identitasnya sendiri lewat isi pesan.
   Form sudah memperingatkan hal ini, tetapi tidak bisa mencegahnya.

## Vercel Hobby plan

Hobby plan hanya untuk penggunaan pribadi dan non-komersial. Demo ini memakai
identitas TMMIN, sehingga sebelum tautannya disebar luas aplikasi harus pindah ke
Vercel Pro atau ke infrastruktur perusahaan.

## Branding

Semua warna didefinisikan sebagai CSS custom property di blok `:root` paling atas
`src/app/globals.css`. Logo ada di `public/logo.svg`. Nilai yang ada sekarang
masih sementara — ganti keduanya dengan aset resmi, tanpa menyentuh file lain.

## Keputusan yang masih terbuka

- Retensi data: berapa lama suara disimpan, dan apakah perlu penghapusan otomatis.
- Rumah aplikasi setelah demo: Vercel Pro, hosting lain, atau infrastruktur
  perusahaan.
- Mitigasi untuk volume rendah (lihat poin 2 di atas).
- Apakah kategori `other` perlu ditambahkan untuk suara yang tidak masuk ketiga
  kategori yang ada.
````

- [ ] **Step 4: Deploy to Vercel**

```bash
git push -u origin main
```

Then, in the Vercel dashboard:
1. Import the GitHub repository.
2. **Storage → Marketplace → Neon.** `DATABASE_URL` is injected automatically.
3. **Project Settings → Environment Variables:** add `AUTH_SECRET`, and `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RATE_LIMIT_SALT` if you are enabling those.
4. Deploy.
5. Point local tooling at production once, to create the schema and the master account:
   ```bash
   npx vercel env pull .env.production.local
   DATABASE_URL="<production url>" npm run db:push
   DATABASE_URL="<production url>" npm run seed:demo
   ```
6. In the Cloudflare Turnstile widget settings, add the Vercel domain to the allowed hostnames — the widget silently fails on an unlisted host.

Use a separate Neon branch for development so local work never touches production data.

- [ ] **Step 5: Verify the deployed demo end to end**

On the production URL, using a phone on mobile data (not office Wi-Fi):

1. Submit a voice. Expected: the Turnstile widget appears and renders in Indonesian, then a redirect to `/thank-you`.
2. Submit six times in a row. Expected: the sixth is refused with the rate-limit message — this is the only proof that Upstash is wired up correctly.
3. Log in at `/admin/login`, confirm the new voices are listed with dates only.
4. Download the CSV on the phone and confirm it saves.
5. Confirm the cookie is `Secure` in production (DevTools on a desktop browser against the production URL).

- [ ] **Step 6: Mobile QA at three widths**

Check `/`, `/admin/login`, `/admin`, and `/admin/users` at 360px, 390px, and 768px:

- No horizontal scrolling of the page body anywhere. Wide tables scroll inside their own card.
- Every tap target is at least 44px tall.
- The message textarea is comfortable to type in, and the label is visible while typing.
- Text stays at 16px or larger in inputs, so iOS Safari does not zoom on focus.

- [ ] **Step 7: Generate the QR code**

```bash
npx qrcode -o public/qr.png "https://<your-deployment>.vercel.app/"
```

Print it, scan it with two different phones, and confirm both land on the form. Add the image to the README if it will be distributed from there.

- [ ] **Step 8: Tick the completed milestones in `project.md`**

Update §13 to check off M0 through M5, and update §6 and §7.4 to reflect that `area` no longer exists and that categories are final.

- [ ] **Step 9: Final verification**

```bash
npm run test
npm run build
npm run lint
```

Expected: all tests pass, the build succeeds, lint is clean.

- [ ] **Step 10: Commit**

```bash
git add README.md public/qr.png project.md
git commit -m "docs: add README, QR code, and updated milestones"
git push
```

---

## Milestone Mapping

| Milestone | Tasks |
|---|---|
| M0 Setup | 1, 3 |
| M1 Public form | 2, 4, 5 |
| M2 Auth | 6, 7, 8 |
| M3 Dashboard | 9, 10 |
| M4 User management | 11 |
| Retention (new scope) | 12 |
| M5 Demo polish | 13 |

## Notes for Whoever Executes This

- **The anonymity constraints are not style preferences.** If a task seems to need an IP address, a user reference, or a timestamp on screen, the task is wrong, not the constraint. Stop and raise it.
- **Two pieces of provisional content are waiting on input from the client:** the TMMIN colour values in `src/app/globals.css` and the logo in `public/logo.svg`. Both are isolated so a swap touches nothing else.
- **Every server action starts with `requireRole`.** If you add one that does not, you have added an unauthenticated POST endpoint.
- **Tasks 9 and 12 are coupled by a stub.** Task 9 creates a placeholder `delete-voice-button.tsx` purely so the table compiles; Task 12 replaces it. Do not skip Task 12 and leave the stub in place.
