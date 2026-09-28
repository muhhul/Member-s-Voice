import { VoiceForm } from "@/components/public/voice-form";
import "./public.css";

/**
 * The v3 artwork is used whole, with the form floating in the gap the poster
 * leaves for it: below the subtitle, above the five-value card, and between
 * the two photo columns.
 *
 * Everything the poster says is repeated in the alt text, because the wordmark,
 * the five values and the closing line are all part of the picture here and a
 * screen reader would otherwise get nothing from them.
 */
const POSTER_ALT =
  "PWPD Member's Voice - Your Voice for a Better Workplace. " +
  "Setiap suara Anda penting untuk menciptakan lingkungan kerja yang lebih aman, " +
  "nyaman, mudah, menyenangkan, dan penuh arti. " +
  "Lima nilai PWPD: SAFE, bekerja dengan aman. COMFORTABLE, lingkungan kerja yang nyaman. " +
  "EASY, proses kerja yang lebih mudah. ENJOY, suasana kerja yang menyenangkan. " +
  "YARIGAI, merasa bermakna dan bangga. Together for a Better PWPD.";

export default function HomePage() {
  return (
    <main>
      <section className="poster">
        {/*
          A plain <img>, not next/image: this is one fixed illustration whose
          bytes are already tuned, and the optimizer would add a Vercel runtime
          dependency and quota for a single file.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="poster__art"
          src="/brand/poster.webp"
          width={1536}
          height={930}
          alt={POSTER_ALT}
          fetchPriority="high"
        />
        <div className="poster__card">
          <h1 className="sr-only">Sampaikan Suara Anda</h1>
          <VoiceForm turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
        </div>
      </section>
    </main>
  );
}
