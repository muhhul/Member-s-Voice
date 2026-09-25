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
  return { errors: {}, ok: "Kata sandi diganti. Sampaikan lewat jalur pribadi." };
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
