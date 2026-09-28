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
