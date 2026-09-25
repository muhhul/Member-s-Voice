# Member's Voice

An anonymous feedback box for all employees. Employees submit their voice without logging in. Management accounts log in to read the submissions, and a master account manages those management accounts.

> **Status:** Demo **built and deployed** at https://membersvoice-pwpd.vercel.app
> on Vercel's free (Hobby) plan. See [README.md](README.md) for how to run it,
> the residual anonymity risks, and the decisions still open.
> The Hobby plan is for non-commercial, personal use only. Before this app is used officially, it must move to Vercel Pro or to another host.

---

## 1. Scope

### In scope (demo)

- Public submission form: responsive, mobile-first, no login, anonymous.
- Management dashboard: list, filter, search, and CSV export.
- Master account: create, deactivate and reactivate management accounts, and reset their passwords.
- Basic spam protection that does not require login.

### Out of scope

- A follow-up workflow (statuses, assignment, replies). The app only collects voices.
- Employees viewing other people's submissions.
- File or photo uploads, because photo EXIF data can reveal the sender.
- Public sign-up for management.
- A native mobile app. A responsive web app is enough.

---

## 2. Roles

| Role | Login | Can do |
|---|---|---|
| `employee` (public) | No | Submit a voice |
| `viewer` (management) | Yes | Read, filter, search, and export voices |
| `master` | Yes | Everything `viewer` can do, plus manage `admin_users` |

---

## 3. Routes

All routes, file names and code are in English. User-facing UI copy is in Bahasa Indonesia.

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Submission form |
| `/thank-you` | Public | Confirmation after a successful submission |
| `/admin/login` | Public | Management login |
| `/admin` | `viewer`, `master` | Voice list with filters (`category`, `from`, `to`, `q`, `page`) |
| `/admin/users` | `master` | Manage management accounts |
| `/admin/export` | `viewer`, `master` | CSV download (route handler), same filters as `/admin` |

There is no sign-up route.

---

## 4. Tech Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Server Actions for mutations |
| Database | Postgres on Neon (via Vercel Marketplace) | Free tier; compute scales to zero and resumes on request |
| ORM | Drizzle ORM + drizzle-kit | Driver: `@neondatabase/serverless` (HTTP) |
| Auth | Custom: `jose` (signed JWT cookie) + `bcryptjs` | Only one credential type and two roles, so Auth.js is not needed |
| Validation | `zod` | Shared between form and server action |
| Bot protection | Cloudflare Turnstile | Optional in dev; enabled when keys are set |
| Rate limiting | `@upstash/ratelimit` + `@upstash/redis` | Optional in dev; enabled when keys are set |
| Styling | Plain CSS (`globals.css` + CSS Modules) | No UI library needed at this size |
| Hosting | Vercel | Hobby for the demo |

> Next.js 16 renamed `middleware.ts` to `proxy.ts`. Use whichever file name matches the installed major version.

---

## 5. Folder Structure

```
member-voice/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx
│  │  ├─ globals.css
│  │  ├─ page.tsx                  # public submission form
│  │  ├─ actions.ts                # submitVoice server action
│  │  ├─ thank-you/
│  │  │  └─ page.tsx
│  │  └─ admin/
│  │     ├─ layout.tsx             # admin shell + nav
│  │     ├─ page.tsx               # voice list
│  │     ├─ login/
│  │     │  ├─ page.tsx
│  │     │  └─ actions.ts          # login, logout
│  │     ├─ users/
│  │     │  ├─ page.tsx
│  │     │  └─ actions.ts          # createUser, setUserActive, resetPassword
│  │     └─ export/
│  │        └─ route.ts            # CSV export
│  ├─ components/
│  │  ├─ voice-form.tsx            # client component
│  │  └─ voice-table.tsx
│  ├─ db/
│  │  ├─ schema.ts
│  │  └─ client.ts
│  ├─ lib/
│  │  ├─ session.ts                # createSession, getSession, requireRole
│  │  ├─ rate-limit.ts
│  │  ├─ turnstile.ts
│  │  ├─ validation.ts             # zod schemas
│  │  └─ constants.ts              # CATEGORIES
│  └─ proxy.ts                     # (or middleware.ts on Next 15)
├─ scripts/
│  └─ seed.ts                      # creates master account (+ demo data with --demo)
├─ drizzle.config.ts
├─ .env.example
├─ PROJECT.md
└─ README.md
```

---

## 6. Data Model

```ts
// src/db/schema.ts (sketch)
export const roleEnum = pgEnum("role", ["master", "viewer"]);

export const voices = pgTable("voices", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: text("category").notNull(),   // validated against CATEGORIES
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("viewer"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

`voices` has **no relation** to any user, IP address or device. This is intentional.

### Constants (to be confirmed with management)

```ts
export const CATEGORIES = ["safety", "hr", "facility_improvement"] as const;
```

The values are stored in English. The UI maps them to Indonesian labels, for example `facility` → "Fasilitas" and `safety` → "K3".

---

## 7. Anonymity Requirements

These are requirements, not suggestions.

1. Never store the IP address, user agent, or any fingerprint alongside a voice.
2. Never `console.log` request bodies or headers in the submit path.
3. The dashboard and CSV show **date only**, not the exact time. `created_at` keeps full precision only for sorting. Exact times make it easy to guess who was on their phone at that moment.
4. ~~`area` is optional and coarse.~~ **Dropped.** `area` was removed entirely before implementation, which removes the attribute that could have narrowed down a submitter.
5. No uploads in the demo.
6. Rate limiting uses a **salted SHA-256 hash of the IP** with a short TTL in Redis. It is never linked to a voice row.
7. The form states plainly what is and is not collected. That statement must stay true.

---

## 8. Spam Protection (no login)

The submit action applies these checks in order:

1. **Honeypot:** a hidden `website` field. If it is filled, pretend success and drop the request.
2. **Turnstile:** verify the token on the server when `TURNSTILE_SECRET_KEY` is set.
3. **Rate limit:** 5 submissions per 10 minutes per hashed IP, when Upstash keys are set.
4. **Validation (zod):** `category` must be in `CATEGORIES`, and `message` must be 10 to 2000 characters after trimming.

Access is restricted to "employees only" by distributing the link or QR code only through internal channels. Without login, the app cannot enforce this technically.

---

## 9. Auth and Authorization

- **Login:** email + password, compared with `bcryptjs`. On failure, show a generic error ("Email atau kata sandi salah").
- **Session:** an HS256 JWT signed with `AUTH_SECRET`, stored in an `httpOnly`, `secure`, `sameSite=lax` cookie named `mv_session` that expires after 8 hours. The payload is `{ uid, role }`.
- **Two layers of protection:**
  1. `proxy.ts` blocks `/admin/**` (except `/admin/login`) when there is no valid JWT. This check is cheap and does not touch the database.
  2. Every admin page, route handler and server action calls `requireRole(...)`. It verifies the JWT **and** re-checks the user in the database, so a deactivated account loses access immediately. This layer is required because server actions can be called directly with a POST request, which skips the page (and its UI checks) entirely.
- **Master rules:**
  - The first master is created by `scripts/seed.ts` from environment variables. It is never hard-coded.
  - A master cannot deactivate or demote themselves.
  - Accounts are deactivated (`is_active = false`), never deleted.

---

## 10. Environment Variables

```bash
# .env.example
DATABASE_URL=              # Neon connection string (set by the Vercel integration)
AUTH_SECRET=               # openssl rand -base64 32

# Seed only (local)
MASTER_EMAIL=
MASTER_PASSWORD=
MASTER_NAME=

# Optional in dev, recommended for the deployed demo
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
RATE_LIMIT_SALT=           # random string used to hash IPs
```

---

## 11. Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev` | Local development |
| `build` | `next build` | Production build |
| `db:push` | `drizzle-kit push` | Sync the schema to the database (fine for the demo) |
| `db:generate` / `db:migrate` | `drizzle-kit generate` / `migrate` | Versioned migrations, used once the demo becomes official |
| `seed` | `tsx scripts/seed.ts` | Create the master account |
| `seed:demo` | `tsx scripts/seed.ts --demo` | Create the master account and sample voices for the demo |

---

## 12. Deployment (Vercel Hobby)

1. Push the repo to GitHub.
2. Import the repo on Vercel.
3. Add Neon from **Storage / Marketplace**. `DATABASE_URL` is injected automatically.
4. Add `AUTH_SECRET` (plus the Turnstile and Upstash keys if used) in **Project Settings → Environment Variables**.
5. Locally, pull the env with `vercel env pull .env.local`, then run `npm run db:push` and `npm run seed:demo`.
6. Deploy. Pushes to `main` go to production, and other branches get preview URLs.
7. Add the Vercel domain to the allowed hostnames in the Turnstile widget settings.

Use separate databases (or Neon branches) for development and production.

---

## 13. Milestones

- [x] **M0: Setup.** Next.js, Drizzle, and Neon connected; a "hello world" deployed to Vercel.
- [x] **M1: Public form.** `/` and `/thank-you`, with validation, honeypot, and optional Turnstile and rate limiting.
- [x] **M2: Auth.** `/admin/login`, session, proxy, `requireRole`, and the seed script.
- [x] **M3: Dashboard.** `/admin` list with filters, search, and pagination; `/admin/export` for CSV.
- [x] **M4: User management.** `/admin/users` for the master.
- [x] **M5: Demo polish.** Demo seed data, mobile QA, and the QR code for the link.

---

## 14. Open Questions

- ~~Final list of categories and areas.~~ **Settled:** three categories (`safety`, `hr`, `facility_improvement`); `area` dropped entirely.
- Branding: company name, logo, and colors.
- Where the app lives after the demo (Vercel Pro, another host, or company infrastructure).
- Data retention: how long voices are kept.