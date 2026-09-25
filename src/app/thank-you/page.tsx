import Link from "next/link";

export default function ThankYouPage() {
  return (
    <main className="container">
      <div className="card">
        <h1>Terima kasih</h1>
        <p>
          Suara Anda sudah tersimpan secara anonim. Tidak ada data yang bisa dipakai untuk
          mengetahui siapa pengirimnya.
        </p>
        <p>
          <Link href="/">Kirim suara lain</Link>
        </p>
      </div>
    </main>
  );
}
