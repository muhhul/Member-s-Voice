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
