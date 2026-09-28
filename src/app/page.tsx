import { Pillars } from "@/components/public/pillars";
import { VoiceForm } from "@/components/public/voice-form";
import "./public.css";

/**
 * Two artworks, one per shape of screen, and only one is ever downloaded:
 * <picture> picks by media query before the request goes out.
 *
 * The wide poster carries the five values and the closing line inside the
 * picture. The tall one does not, because at 390px those would render at
 * 8-10px - so on a phone they come back as HTML instead.
 */
const HERO_ALT =
  "PWPD Sunter Member's Voice - Your Voice for a Better Workplace. " +
  "Setiap suara Anda penting untuk menciptakan lingkungan kerja yang lebih aman, " +
  "nyaman, mudah, menyenangkan, dan penuh arti.";

export default function HomePage() {
  return (
    <main>
      <section className="poster">
        {/*
          A plain <img> inside <picture>, not next/image: these are two fixed
          illustrations whose bytes are already tuned, and the optimizer would
          add a Vercel runtime dependency and quota for them.
        */}
        <picture>
          <source media="(max-width: 860px)" srcSet="/brand/hero-mobile.webp" />
          <img
            className="poster__art"
            src="/brand/poster.webp"
            width={1536}
            height={930}
            alt={HERO_ALT}
            fetchPriority="high"
          />
        </picture>
        <div className="poster__card">
          <h1 className="sr-only">Sampaikan Suara Anda</h1>
          <VoiceForm turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
        </div>
      </section>

      {/* Phone only: on a wide screen both of these live inside the poster. */}
      <Pillars />
      <div className="band-mobile" aria-hidden="true" />
    </main>
  );
}
