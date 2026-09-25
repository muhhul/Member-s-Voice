import { Pillars } from "@/components/pillars";
import { VoiceForm } from "@/components/voice-form";

export default function HomePage() {
  return (
    <main>
      {/*
        Hero adalah satu banner utuh hasil potongan mockup: wordmark, subjudul,
        dan ilustrasi pekerja adalah satu lockup desain yang akan rusak kalau
        dipisah. Teksnya dipindahkan ke alt supaya tetap terbaca screen reader.
        Varian ponsel dipersempit ke wordmark agar judulnya tidak jadi seuprit.
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
