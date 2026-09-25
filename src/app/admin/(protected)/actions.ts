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
