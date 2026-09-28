import { Pillars } from "@/components/public/pillars";
import { VoiceForm } from "@/components/public/voice-form";
import "./public.css";

export default function HomePage() {
  return (
    <main>
      {/*
        The hero is one whole banner cropped from the mockup. The wordmark,
        subtitle and worker illustration are a single design lockup that breaks
        if split apart, so the text lives in the alt attribute instead. The
        mobile variant is cropped tighter so the title does not shrink to dust.
      */}
      <section className="hero">
        <picture>
          <source media="(max-width: 700px)" srcSet="/brand/hero-mobile.webp" />
          <img
            className="hero__img"
            src="/brand/hero.webp"
            width={1536}
            height={314}
            alt="PWPD Member's Voice - Your Voice for a Better Workplace. Setiap suara Anda penting untuk menciptakan lingkungan kerja yang lebih aman, nyaman, mudah, menyenangkan, dan penuh arti."
            fetchPriority="high"
          />
        </picture>
      </section>

      <section className="stage">
        <span className="stage__side stage__side--left" aria-hidden="true" />
        <span className="stage__side stage__side--right" aria-hidden="true" />
        <div className="stage__card">
          <h1 className="sr-only">Sampaikan Suara Anda</h1>
          <VoiceForm turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
        </div>
      </section>

      <Pillars />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="band" src="/brand/band.webp" width={1536} height={131} alt="" />
    </main>
  );
}
