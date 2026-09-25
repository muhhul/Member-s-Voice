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
