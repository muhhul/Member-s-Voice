import Link from "next/link";

export default function ThankYouPage() {
  return (
    <main>
      <section className="stage" style={{ paddingTop: 40 }}>
        <div className="stage__card" style={{ maxWidth: 640, textAlign: "center" }}>
          <span
            className="anon-notice__icon anon-notice__icon--ok"
            aria-hidden="true"
            style={{ margin: "0 auto 14px" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="m5 12.5 4.5 4.5L19 7.5"
                stroke="#fff"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <h1 style={{ marginTop: 0 }}>Terima kasih</h1>
          <p>
            Suara Anda sudah tersimpan secara anonim. Tidak ada data yang bisa dipakai untuk
            mengetahui siapa pengirimnya.
          </p>
          <p style={{ marginBottom: 0 }}>
            <Link href="/">Kirim suara lain</Link>
          </p>
        </div>
      </section>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="band" src="/brand/band.webp" width={1536} height={131} alt="" />
    </main>
  );
}
