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
