# Catatan Keputusan

Apa yang diputuskan saat membangun Member's Voice, dan **kenapa**. Bagian "apa"
sudah ada di kode; yang hilang kalau tidak ditulis adalah alasannya.

Rencana implementasi asli (3.749 baris, berisi kode tiap task) sudah dihapus
setelah seluruhnya dieksekusi — isinya kini duplikat dari source, dan duplikat
yang melenceng lebih berbahaya daripada tidak ada sama sekali. Riwayatnya
tersimpan di git.

---

## 1. Perubahan dari spesifikasi awal

`project.md` ditulis sebelum implementasi. Yang berikut memutuskannya, dan bila
bertentangan, yang di sini yang berlaku.

| Perubahan | Alasan |
|---|---|
| Kategori final: `safety`, `hr`, `facility_improvement` | Ditetapkan manajemen. Tidak ada `other` |
| Kolom `area` **dihapus seluruhnya** | Menaikkan anonimitas: satu atribut yang bisa menyempitkan kandidat pengirim hilang. Ini juga mencoret §7.4 project.md |
| Kode di root repo | `member-voice/` di §5 adalah nama proyek, bukan folder |
| Next.js 15, bukan 16 | Dokumentasi lebih matang. File middleware bernama `middleware.ts`, bukan `proxy.ts` |
| Master bisa hapus satu suara | Scope tambahan dari keputusan retensi |
| Branding TMMIN | Warna dan logo masih placeholder |

## 2. Keputusan arsitektur yang tidak terbaca dari kode

**`/admin/login` di luar route group `(protected)`.** Layout di
`src/app/admin/layout.tsx` akan membungkus halaman login juga, sehingga
memasang `requireRole` di sana membuat halaman login tidak bisa dirender — kamu
dialihkan ke halaman yang butuh sesi yang justru belum ada. Route group tidak
muncul di URL, jadi `/admin` dan `/admin/users` tetap seperti semula.

**`requireRole` tidak pernah menulis cookie.** Next.js melempar error bila
Server Component mengubah cookie saat render, dan `requireRole` dipanggil dari
page. Ia hanya `redirect`. Penghapusan cookie hanya di aksi `logout`, yang
merupakan Server Action dan boleh menulis.

**Halaman login memakai `getAuthorizedUser`, bukan `getSession`.** Cek cookie
saja membuat akun yang sudah dinonaktifkan — tapi JWT-nya masih sah — dilempar
ke `/admin`, ditolak, lalu dikembalikan ke login: loop tak berujung.

**`src/lib/jwt.ts` terpisah dari `src/lib/session.ts`.** Middleware berjalan di
Edge runtime yang tidak punya `node:crypto` maupun `bcryptjs`. Hanya `jwt.ts`
yang boleh diimpor dari sana; `session.ts` menyentuh database dan `next/headers`.

**`zod` dipin ke v3.** v4 memindahkan validator format string
(`z.string().email()` menjadi `z.email()`); seluruh schema di sini sintaks v3.

**Hapus suara adalah hard delete tanpa audit isi.** Audit log yang menyimpan
teks pesan justru mengawetkan hal yang ingin dihapus — biasanya pesan yang
membuka identitas pengirimnya sendiri.

**Login membandingkan hash dummy saat email tidak ditemukan.** Tanpa itu,
email yang terdaftar bisa ditebak dari selisih waktu respons.

## 3. Jebakan lingkungan

Semuanya ditemukan dengan cara yang mahal. Ditulis supaya tidak terulang.

**Apostrof di path repo merusak build Next.js.** `Member's Voice` mengandung
apostrof, dan loader metadata Next menyisipkan path absolut ke string
ber-kutip-satu tanpa escape. Akibatnya: **jangan letakkan file metadata di
`src/app/`** — tidak `favicon.ico`, `icon.png`, maupun `opengraph-image.*`.
Letakkan di `public/`. Errornya menunjuk ke kode generated Next, bukan ke kodemu.

**`create-next-app` menolak nama direktori ini.** Nama target divalidasi sebagai
nama paket npm, dan `Member's Voice` tidak memenuhi syarat. Scaffold ke
subdirektori bernama valid, lalu pindahkan isinya. Buat direktori induknya
dulu — kalau belum ada, errornya berbunyi "path is not writable" yang menyesatkan.

**Jangan `npm run build` selagi `npm run dev` hidup.** Keduanya menulis ke
`.next` yang sama; build produksi merusak state dev server sampai `.next`
dihapus dan dev dijalankan ulang. Gejalanya: semua request jadi 500 dengan
`routes-manifest.json` tidak ditemukan.

**`pkill` tidak mematikan proses Next di Windows.** Server lama tetap memegang
port 3000 dan server baru diam-diam pindah ke 3001, sehingga pengujian menembak
server basi. Pakai PowerShell `Stop-Process`.

**`tsx` mengompilasi `.ts` sebagai CommonJS**, jadi top-level `await` ditolak.
Pakai ekstensi `.mts`, atau bungkus dalam `async function main()`.

**`loadEnv()` di atas `import` tidak berguna.** Semua import dievaluasi sebelum
baris kode pertama, jadi modul yang melempar error saat dimuat — seperti
`src/db/client.ts` tanpa `DATABASE_URL` — tetap meledak duluan. `scripts/seed.ts`
karena itu membangun client-nya sendiri. Kalau butuh modul semacam itu di script,
pakai `await import(...)` setelah `loadEnv()`.

**Vercel menamai variabel Upstash `KV_REST_API_URL` / `_TOKEN`**, sedangkan SDK
Upstash mencari `UPSTASH_REDIS_REST_URL` / `_TOKEN`. `src/lib/rate-limit.ts`
menerima keduanya supaya tidak perlu menyalin token antar-kolom dashboard.

**Variabel dari integrasi Vercel bertanda Secret dan tidak bisa ditarik.**
`vercel env pull` menulis `[SENSITIVE]` sebagai ganti nilainya. Ambil dari
browser. Selain itu, saat impor, Vercel membaca `.env.example` di repo dan
membuat nama-nama variabel itu dengan **nilai kosong** — mudah dikira sudah terisi.

**Backslash termakan shell heredoc.** File yang mengandung `\\` (regex,
escaping) harus ditulis langsung ke disk, bukan lewat `cat <<'EOF'`. Gejalanya
halus: `\\` menjadi `\`, yang diam-diam mengubah arti kode.

## 4. Dua temuan keamanan, dan apa yang menangkapnya

**Hash password bocor ke payload halaman.** `db.select()` polos pada
`admin_users` ikut menarik `password_hash`, dan React menyerialisasi data yang
dirender Server Component ke HTML. Seluruh akun bocor di `/admin/users`
(master-only); akun sendiri bocor di `/admin` untuk peran apa pun.

Yang menangkapnya: memeriksa HTML yang benar-benar terkirim, bukan unit test.
Sekarang dijaga dua lapis — `tests/columns.test.ts` membandingkan daftar kolom
aman dengan skema, dan `tests/no-bare-select.test.ts` memindai source agar tidak
ada `select` polos pada `admin_users` di mana pun. Penjaga kedua diuji dengan
mengembalikan bugnya dan memastikan test-nya merah.

**Formula injection di CSV.** Pesan yang diawali `=` `+` `-` `@` dieksekusi
Excel saat file ekspor dibuka. Ini **bukan** temuan — proteksinya dirancang dari
awal dan diuji unit sejak `src/lib/csv.ts` ditulis. Disebut di sini karena
mudah dihapus orang yang tidak tahu kenapa apostrofnya ada.

## 5. Yang belum teruji otomatis

- **Penjaga "master tidak bisa menonaktifkan dirinya sendiri"** di
  `users/actions.ts`. Kodenya ada dan tombolnya disembunyikan, tapi belum ada
  test yang membuktikan POST langsung tertolak. Cara menutupnya: ekstrak
  logikanya jadi fungsi murni yang bisa di-unit-test.
- **Tampilan di ponsel sungguhan.** Yang sudah diperiksa terukur: meta viewport
  ada, font input 16px (agar iOS tidak zoom), tombol minimal 44px, semua lebar
  memakai `max-width`, tabel dibungkus kontainer scroll. Sisanya butuh mata
  manusia di tiga lebar layar.
- **Alur kirim dari browser**, di luar satu kiriman manual yang diverifikasi
  masuk ke database.

## 6. Yang masih terbuka

Lihat bagian "Keputusan yang masih terbuka" di [README.md](../README.md).
Yang paling mendesak: bila sehari hanya masuk satu suara, tanggalnya saja sudah
cukup untuk menduga pengirimnya. Aplikasi menyembunyikan jam, tapi tidak bisa
menyembunyikan kelangkaan. Itu keputusan kebijakan, bukan teknis.
