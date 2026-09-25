import { and, asc, count, desc, eq, gte, ilike, lt, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { adminUsers, voices, type Voice } from "@/db/schema";
import { adminUserSafeColumns, type AdminUserSummary } from "@/db/columns";
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

export type VoiceListResult = {
  rows: Voice[];
  total: number;
  page: number;
  pageCount: number;
};

export async function listVoices(filters: VoiceFilters): Promise<VoiceListResult> {
  const where = voiceWhere(filters);

  const [{ value: total }] = await db.select({ value: count() }).from(voices).where(where);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // Clamp, so ?page=999 shows the last page instead of an empty table.
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

export async function listAdminUsers(): Promise<AdminUserSummary[]> {
  // Never db.select() bare here - see the note on adminUserSafeColumns.
  return db.select(adminUserSafeColumns).from(adminUsers).orderBy(asc(adminUsers.email));
}
