/**
 * Lima nilai PWPD di bawah form.
 *
 * Ikonnya SVG inline, bukan potongan dari mockup: bentuknya sederhana, jadi
 * hasilnya tajam di ukuran mana pun dan warnanya ikut token merek.
 */

type Pillar = {
  title: string;
  desc: string;
  color: string;
  icon: React.ReactNode;
};

const PILLARS: Pillar[] = [
  {
    title: "SAFE",
    desc: "Bekerja dengan aman",
    color: "var(--pillar-safe)",
    icon: (
      <>
        <path d="M12 2.5 4 5.6v6c0 4.6 3.4 8.4 8 9.9 4.6-1.5 8-5.3 8-9.9v-6Z" fill="currentColor" />
        <path d="M12 8v7M8.5 11.5h7" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: "COMFORTABLE",
    desc: "Lingkungan kerja yang nyaman",
    color: "var(--pillar-comfortable)",
    icon: (
      <>
        <rect x="6" y="3" width="12" height="9" rx="2.5" fill="currentColor" />
        <path d="M12 12v5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M6.5 21c0-2.2 2.5-4 5.5-4s5.5 1.8 5.5 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      </>
    ),
  },
  {
    title: "EASY",
    desc: "Proses kerja yang lebih mudah",
    color: "var(--pillar-easy)",
    icon: (
      <>
        <path
          d="M12 2.6l2 1.2 2.3-.4 1 2.1 2.1 1-.4 2.3 1.2 2-1.2 2 .4 2.3-2.1 1-1 2.1-2.3-.4-2 1.2-2-1.2-2.3.4-1-2.1-2.1-1 .4-2.3-1.2-2 1.2-2-.4-2.3 2.1-1 1-2.1 2.3.4Z"
          fill="currentColor"
        />
        <circle cx="12" cy="12" r="3.4" fill="#fff" />
      </>
    ),
  },
  {
    title: "ENJOY",
    desc: "Suasana kerja yang menyenangkan",
    color: "var(--pillar-enjoy)",
    icon: (
      <>
        <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="2.4" fill="none" />
        <circle cx="9" cy="10" r="1.5" fill="currentColor" />
        <circle cx="15" cy="10" r="1.5" fill="currentColor" />
        <path d="M8 14.5c1.1 1.4 2.4 2.1 4 2.1s2.9-.7 4-2.1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      </>
    ),
  },
  {
    title: "YARIGAI",
    desc: "Merasa bermakna dan bangga",
    color: "var(--pillar-yarigai)",
    icon: (
      <>
        <circle cx="12" cy="7" r="3.2" fill="currentColor" />
        <circle cx="5" cy="9.5" r="2.4" fill="currentColor" />
        <circle cx="19" cy="9.5" r="2.4" fill="currentColor" />
        <path d="M6.4 20c0-3 2.5-5.2 5.6-5.2s5.6 2.2 5.6 5.2Z" fill="currentColor" />
        <path d="M1.6 19c0-2.2 1.5-3.8 3.4-3.8M22.4 19c0-2.2-1.5-3.8-3.4-3.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      </>
    ),
  },
];

export function Pillars() {
  return (
    <section className="pillars" aria-label="Nilai kerja PWPD">
      <div className="pillars__inner">
        {PILLARS.map((pillar) => (
          <div className="pillar" key={pillar.title}>
            <svg
              className="pillar__icon"
              width="34"
              height="34"
              viewBox="0 0 24 24"
              style={{ color: pillar.color }}
              aria-hidden="true"
            >
              {pillar.icon}
            </svg>
            <div>
              <p className="pillar__title" style={{ color: pillar.color }}>
                {pillar.title}
              </p>
              <p className="pillar__desc">{pillar.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
