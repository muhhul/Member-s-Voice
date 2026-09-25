import { VoiceForm } from "@/components/voice-form";

export default function HomePage() {
  return (
    <main className="container">
      <h1>Sampaikan Suara Anda</h1>
      <p>Kotak suara ini anonim. Anda tidak perlu masuk dan tidak perlu menuliskan nama.</p>

      <div className="notice">
        <strong>Yang dikirim:</strong> kategori dan isi pesan Anda.
        <br />
        <strong>Yang tidak disimpan aplikasi ini:</strong> nama, nomor karyawan, alamat IP, jenis
        perangkat, dan jam pengiriman. Manajemen hanya melihat kategori, isi pesan, dan tanggalnya.
      </div>

      <VoiceForm turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
    </main>
  );
}
