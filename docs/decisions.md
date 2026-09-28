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
| Branding TMMIN | Tampilan publik memakai satu ilustrasi utuh di `public/brand/poster.webp` dengan form mengambang di atasnya. Warna diambil dari mockup yang sama |

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
baris kode pertama, jadi modul yang melempar error saat dimuat tetap meledak
duluan. Dulu `src/db/client.ts` adalah modul semacam itu — dan satu baris itu
mengikat tiga hal yang tidak berhubungan ke sebuah secret: `next build` tidak
bisa mengompilasi tanpa `DATABASE_URL`, script apa pun di graf ini meledak
sebelum dotenv-nya jalan, dan lapisan query tidak bisa diuji sama sekali.
Sekarang client itu menyambung saat query pertama, bukan saat diimpor, jadi
jebakannya hilang. Aturannya tetap berlaku untuk modul lain: kalau sebuah modul
melempar error saat dimuat, pakai `await import(...)` setelah `loadEnv()`.

**Vercel menamai variabel Upstash `KV_REST_API_URL` / `_TOKEN`**, sedangkan SDK
Upstash mencari `UPSTASH_REDIS_REST_URL` / `_TOKEN`. `src/lib/rate-limit.ts`
menerima keduanya supaya tidak perlu menyalin token antar-kolom dashboard.

**Variabel dari integrasi Vercel bertanda Secret dan tidak bisa ditarik.**
`vercel env pull` menulis `[SENSITIVE]` sebagai ganti nilainya. Ambil dari
browser. Selain itu, saat impor, Vercel membaca `.env.example` di repo dan
membuat nama-nama variabel itu dengan **nilai kosong** — mudah dikira sudah terisi.

**`--window-size` Chrome tidak bisa dipakai menguji layar sempit.** Windows
memaksa lebar jendela minimum sekitar 540px, jadi Chrome me-layout halaman di
lebar itu lalu memotong gambarnya sesuai ukuran yang diminta. Hasilnya terlihat
persis seperti bug overflow horizontal: teks terpotong di kanan, grid tidak
turun ke satu kolom. Halamannya sendiri baik-baik saja. Ini berlaku di
`--headless=new` maupun `--headless=old`. Pakai
skrip screenshot yang mengatur viewport lewat
`Emulation.setDeviceMetricsOverride` di DevTools Protocol sehingga 390px benar-benar
390px. Skripnya ada di folder `design/` yang sengaja di luar repo. Cara membuktikannya kalau ragu: tempel sementara `body::before` yang
isinya berbeda per media query, lalu screenshot - halaman akan memberi tahu
breakpoint mana yang sebenarnya aktif.

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

Aturan otorisasi admin butuh server hidup, cookie sesi asli, dan database —
tidak bisa jadi unit test. Semuanya ada di `npm run verify:admin`, yang sengaja
disimpan di repo: sebelumnya pemeriksaan ini ditulis ulang setiap kali markup
admin berubah, dan itu cara paling pasti membuatnya akhirnya tidak pernah
dijalankan sama sekali.

Yang masih belum tertutup:

- **Penjaga "master tidak bisa menonaktifkan dirinya sendiri"** di
  `users/actions.ts`. Kodenya ada dan tombolnya disembunyikan, tapi belum ada
  test yang membuktikan POST langsung tertolak. Cara menutupnya: ekstrak
  logikanya jadi fungsi murni yang bisa di-unit-test.
- **Tampilan di ponsel sungguhan.** Sudah diverifikasi lewat emulasi CDP di
  390, 768, dan 1440px: tidak ada overflow horizontal, pilar turun ke satu
  kolom, form dan tombol muat. Yang juga diperiksa terukur: meta viewport ada,
  font input 16px (agar iOS tidak zoom), tombol minimal 44px, tabel dibungkus
  kontainer scroll. Yang belum: perangkat fisik - emulasi tidak menangkap
  perilaku keyboard iOS, kecepatan jaringan seluler, dan keterbacaan di bawah
  cahaya lantai produksi.
- **Alur kirim dari browser**, di luar satu kiriman manual yang diverifikasi
  masuk ke database.

## 6. Dua ilustrasi, satu per bentuk layar

Mockup v3 tidak menyediakan kotak kosong untuk form seperti v1 dan v2 —
bagian tengahnya ditempati pekerja berdiri penuh badan. Jadi di layar lebar
ilustrasinya dipakai utuh dan form diposisikan dalam persen di atasnya, dengan
isi kartu diukur `em` supaya ikut menyusut bersama posternya.

Cara itu tidak bisa dipakai di ponsel. Poster lanskap di lebar 390px menyusut
jadi pita setinggi 240px, dan teks di dalamnya — termasuk lima nilai PWPD —
hanya terender 8–10px. Diukur, bukan ditaksir.

Karena itu ada mockup potret terpisah untuk ponsel, dan dari situ hanya hero
dan pita bawah yang diambil sebagai gambar. Lima nilai disusun HTML supaya
terbaca dan ikut membesar di tablet lewat `clamp()`.

`<picture>` memilih hero mana yang diunduh, jadi tidak ada perangkat yang
membayar file yang tidak ia tampilkan. Pita ponsel dipasang sebagai
`background-image` di dalam media query, yang juga tidak diunduh saat media
query-nya tidak cocok.

## 7. Latar foto di area admin

Halaman admin memakai foto lantai pabrik sebagai latar, dengan seluruh isi
halaman dalam satu kartu putih di atasnya.

Fotonya **dipaku ke layar, bukan ke halaman**. Versi pertama memasangnya
sebagai `background` pada `.admin-shell`, jadi ukurannya mengikuti tinggi
halaman dan makin diperbesar setiap ada baris tambahan: diukur pada lebar
1440px, sepuluh baris saja sudah memotongnya jadi 58% lebar foto, dan satu
halaman penuh 25 baris menyisakan sekitar sepertiga. Sekarang lapisannya
`position: fixed` seukuran layar — perbesaran tetap 1,11× dan 81% foto
terlihat, berapa pun panjang halamannya.

Lapisannya elemen sendiri, bukan `background-attachment: fixed`, yang tidak
andal di iOS Safari. `z-index`-nya **-1**, bukan 0: elemen ber-posisi menang
atas saudara tak-ber-posisi meski di z-index 0, dan itu sempat menenggelamkan
seluruh tabel di balik foto. `.admin-shell` membuat konteks penumpukan
sendiri, jadi -1 tetap berada di dalamnya dan tidak pernah lolos ke belakang
halaman.

Dari lebar 861px ke atas area admin **tepat satu layar** dan tabelnya yang
menggulir di dalam, bukan halamannya yang memanjang. Kepala halaman, filter,
dan paginasi tetap di tempat sehingga kontrolnya tidak pernah ikut hanyut
berapa pun jumlah barisnya; kepala tabel dibuat `sticky` di dalam area
gulirnya sendiri. Kartu putihnya `flex: 0 1 auto`, jadi ia setinggi isinya
dan baru menyusut saat layar habis — dipaksa memenuhi layar, daftar pendek
seperti dua akun jadi kartu yang hampir kosong.

Tingginya dipaku ke empat tepi, bukan dihitung `calc(100dvh - ...)`: `dvh`
dan viewport sebenarnya sempat berselisih 7px dan itu menyisakan scrollbar
nyasar di halaman.

Tata letak itu berlaku di semua lebar, termasuk ponsel, dan fotonya dipasang
di mana saja — atas permintaan, setelah versi sebelumnya melewatkan keduanya
di layar kecil.

Konsekuensinya diukur dan perlu diketahui: di layar 390x800 dengan label kolom
ditampilkan, tiap kartu suara setinggi rata-rata 241px sementara jendela
gulirnya 267px. Artinya sekitar **satu suara terlihat sekaligus**. Yang sudah
dilakukan untuk melebarkannya: subjudul halaman disembunyikan secara visual,
filter dirapatkan jadi dua kolom, dan label kolom dibuat sebaris dengan
nilainya kecuali Pesan yang tetap berlabel di atas agar teksnya dapat lebar
penuh. Kalau kepadatan itu terasa kurang, tiga tuas yang tersedia: sembunyikan
lagi label di ponsel (naik ke ~2,7 baris), lipat panel filter (naik sekitar
190px), atau kembalikan ponsel ke gulir halaman biasa. Admin di ponsel adalah alat
kerja untuk membaca masukan, dan foto di belakang tabel hanya menambah unduhan
sekaligus menurunkan kontras teks.

Catatan alat: `design/measure.mjs` menjalankan ekspresi JS di halaman lewat
DevTools Protocol. Dipakai saat latar tampak berhenti di tengah halaman —
ternyata bukan bug, yang terlihat putih itu lantai pabrik yang mengkilap di
bagian bawah foto. Mengukur lebih murah daripada menebak.

## 8. Aturan penulisan

- **Komentar dan nama ditulis dalam bahasa Inggris**, sesuai `project.md` §3.
  Yang Bahasa Indonesia hanya teks yang dilihat pengguna. Aturan ini sempat
  bocor selama pekerjaan UI dan diperbaiki serentak.
- **CSS dipecah tiga**: `globals.css` (token, dasar, bar atas, dan gaya bersama),
  `public.css` (halaman publik), `admin.css` (area admin). Masing-masing diimpor
  oleh rute yang memakainya, jadi halaman publik tidak mengunduh gaya admin.
- **Komponen dipisah `public/` dan `admin/`** supaya batas antara yang dilihat
  karyawan dan yang dilihat manajemen terbaca dari struktur folder.
- **Tidak ada `style={{...}}` untuk keputusan tata letak.** Yang tersisa hanya
  dua di `pillars.tsx`, dan itu warna yang datang dari data, bukan tata letak.

## 9. Yang masih terbuka

Lihat bagian "Keputusan yang masih terbuka" di [README.md](../README.md).
Yang paling mendesak: bila sehari hanya masuk satu suara, tanggalnya saja sudah
cukup untuk menduga pengirimnya. Aplikasi menyembunyikan jam, tapi tidak bisa
menyembunyikan kelangkaan. Itu keputusan kebijakan, bukan teknis.
