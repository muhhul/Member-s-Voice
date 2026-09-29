import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
// Relative imports, not the @/ alias: this script runs under tsx rather than
// through the Next.js bundler, so it should not depend on tsconfig path
// resolution behaving the same way. It also deliberately does NOT import
// src/db/client.ts, which throws at module-evaluation time when DATABASE_URL
// is unset - imports are hoisted above the loadEnv() calls above.
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
    category: "productivity",
    message:
      "Ganti dies di line 2 sering menunggu forklift karena hanya ada satu yang siaga saat shift malam.",
    daysAgo: 3,
  },
  {
    category: "productivity",
    message:
      "Briefing pagi kadang molor sampai 15 menit karena menunggu data dari sistem. Kalau datanya disiapkan malam sebelumnya, kita bisa mulai tepat waktu.",
    daysAgo: 4,
  },
  {
    category: "quality",
    message:
      "Hasil welding di titik B sering perlu perbaikan ulang saat cuaca lembap. Mungkin perlu dicek setelan mesinnya.",
    daysAgo: 6,
  },
  {
    category: "quality",
    message:
      "Lampu di area inspeksi kurang terang, jadi baret halus pada panel sering baru ketahuan di proses berikutnya.",
    daysAgo: 7,
  },
  {
    category: "cost",
    message:
      "Sarung tangan sering diganti padahal masih layak, karena tidak ada tempat penyimpanan per orang jadi mudah tertukar.",
    daysAgo: 9,
  },
  {
    category: "cost",
    message:
      "Kompresor di area press menyala terus saat istirahat panjang. Kalau dimatikan, lumayan menghemat listrik.",
    daysAgo: 10,
  },
  {
    category: "environment",
    message:
      "Tempat sampah pilah di dekat kantin sering tercampur karena labelnya sudah pudar dan sulit dibaca.",
    daysAgo: 12,
  },
  {
    category: "environment",
    message:
      "Ceceran oli di sekitar mesin press belum punya wadah khusus, jadi sering terserap majun lalu ikut terbuang.",
    daysAgo: 13,
  },
  {
    category: "delivery",
    message:
      "Informasi perubahan jadwal pengiriman sering terlambat sampai ke line, jadi kami sempat menyiapkan part yang salah.",
    daysAgo: 15,
  },
  {
    category: "delivery",
    message:
      "Label part di rak sementara kadang tidak terbaca, jadi loading ke truk perlu pengecekan dua kali.",
    daysAgo: 16,
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
    // Keyed off one known demo message rather than "is the table empty", so
    // real submissions sitting in the table do not block the demo data, and a
    // second run still does not duplicate it.
    const marker = DEMO_VOICES[0].message;
    const seeded = await db
      .select({ id: voices.id })
      .from(voices)
      .where(eq(voices.message, marker))
      .limit(1);

    if (seeded.length > 0) {
      console.log("Demo voices already seeded, skipping.");
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
