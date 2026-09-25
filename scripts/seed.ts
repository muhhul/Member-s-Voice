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
