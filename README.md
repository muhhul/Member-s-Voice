# Member's Voice

Kotak suara anonim untuk seluruh karyawan. Karyawan mengirim suara tanpa login.
Akun manajemen masuk untuk membaca, dan akun master mengelola akun manajemen.

- **Demo:** https://membersvoice-pwpd.vercel.app
- **Spesifikasi:** [project.md](project.md)
- **Catatan keputusan:** [docs/decisions.md](docs/decisions.md) — kenapa hal-hal
  dibangun seperti ini, jebakan lingkungan, dan yang belum teruji otomatis

QR code untuk disebar ke karyawan ada di [public/qr.png](public/qr.png).
Isinya sudah diverifikasi menunjuk ke URL demo di atas, tetapi **pindai dulu
dengan dua ponsel berbeda sebelum dicetak dan dibagikan**.

## Menjalankan di laptop

```bash
npm install
cp .env.example .env.local   # lalu isi nilainya
npm run db:push
npm run seed:demo
npm run dev
```

`AUTH_SECRET` dibuat dengan `openssl rand -base64 32`. Turnstile dan pembatas
spam hanya aktif kalau kuncinya diisi, jadi pengembangan lokal bisa jalan tanpa
keduanya.

**Jangan jalankan `npm run build` selagi `npm run dev` hidup.** Keduanya menulis
ke direktori `.next` yang sama, dan build produksi akan merusak state dev server
sampai `.next` dihapus dan dev server dijalankan ulang.

## Perintah

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Pengembangan lokal |
| `npm run build` | Build produksi |
| `npm run test` | Unit test (Vitest) |
| `npm run lint` | ESLint |
| `npm run db:push` | Sinkronkan skema ke database |
| `npm run db:generate` / `db:migrate` | Migrasi berversi, dipakai setelah demo jadi resmi |
| `npm run seed` | Buat akun master |
| `npm run seed:demo` | Buat akun master + data contoh |

## Peran

| Peran | Login | Bisa apa |
|---|---|---|
| Karyawan | Tidak | Mengirim suara |
| `viewer` | Ya | Membaca, memfilter, mencari, mengekspor CSV |
| `master` | Ya | Semua milik `viewer`, kelola akun, hapus satu suara |

Tidak ada halaman pendaftaran. Akun manajemen hanya dibuat oleh master, dan
akun master pertama dibuat oleh `npm run seed` dari environment variable.

## Yang menjaga anonimitas

Ini persyaratan, bukan saran. Setiap poin punya pemeriksaan yang bisa diulang.

- Tabel `voices` hanya punya `id`, `category`, `message`, `created_at`. Tidak
  ada relasi ke pengguna, alamat IP, atau perangkat, dan **tidak boleh
  ditambahkan**.
- Jalur pengiriman tidak pernah menulis body atau header request ke log.
- Dashboard dan CSV menampilkan tanggal saja. `created_at` menyimpan presisi
  penuh hanya untuk pengurutan, dan `formatDateJakarta` adalah satu-satunya
  fungsi yang boleh merendernya.
- Pembatas spam memakai SHA-256 bergaram dari alamat IP dengan TTL singkat di
  Redis, dan tidak pernah dihubungkan ke baris `voices`.
- Tidak ada unggahan file, karena EXIF pada foto bisa membuka identitas
  pengirim.
- Hapus suara oleh master adalah hard delete tanpa jejak isi pesan. Audit log
  yang menyimpan teksnya justru akan mengawetkan hal yang ingin dihapus.

Perintah untuk memeriksa ulang kapan saja:

```bash
# Tidak boleh ada keluaran dari tiga perintah pertama.
grep -rn "console\." src/app/actions.ts src/lib/rate-limit.ts src/lib/turnstile.ts src/lib/hash-ip.ts
grep -rniE "toLocaleTimeString|timeStyle|getHours|getMinutes" src
grep -rniE "ip_address|ipAddress|userAgent|user_agent|fingerprint|submittedBy" src scripts

# createdAt hanya boleh dirender lewat formatDateJakarta.
grep -rn "createdAt" src --include="*.tsx"
```

## Batas yang harus disadari sebelum dipakai resmi

Empat hal ini bukan bug, melainkan konsekuensi dari desain demo. Semuanya perlu
keputusan manajemen.

1. **Log platform.** Aplikasi tidak menyimpan alamat IP, tetapi Vercel dan
   Cloudflare tetap menyimpan access log berisi IP di sisi mereka. Klaim di form
   karena itu berbunyi "aplikasi ini tidak menyimpan", bukan "tidak ada yang
   bisa tahu". Kalau ancaman yang dikhawatirkan termasuk pihak dengan akses ke
   log hosting, aplikasi ini harus pindah ke infrastruktur perusahaan.
2. **Volume rendah.** Kalau dalam sehari hanya masuk satu suara, tanggalnya saja
   sudah cukup untuk menduga pengirimnya. Opsi mitigasi: tampilkan minggu bukan
   tanggal, atau tahan suara sampai ada beberapa di periode yang sama.
3. **Urutan daftar.** Daftar diurutkan `created_at` menurun, jadi urutan dalam
   satu hari masih menunjukkan siapa yang mengirim lebih dulu meski jamnya
   disembunyikan.
4. **Isi pesan.** Pengirim bisa membuka identitasnya sendiri lewat isi pesan.
   Form sudah memperingatkan hal ini, tetapi tidak bisa mencegahnya.

## Vercel Hobby plan

Hobby plan hanya untuk penggunaan pribadi dan non-komersial. Demo ini memakai
identitas TMMIN, sehingga sebelum tautannya disebar luas aplikasi harus pindah
ke Vercel Pro atau ke infrastruktur perusahaan.

## Branding

Tampilan halaman publik mengikuti [design/mockup.jpg](design/mockup.jpg).

Ilustrasinya dipotong dari mockup itu ke `public/brand/` oleh
[design/slice.mjs](design/slice.mjs). Teksnya **tidak** ikut jadi gambar - judul
besar dan ilustrasi pekerja memang satu lockup desain sehingga dibiarkan utuh
sebagai banner (isi teksnya ada di atribut `alt`), tetapi seluruh form, notice
anonim, dan lima pilar adalah HTML sungguhan yang ikut mengecil di ponsel.

```bash
npm i --no-save sharp && node design/slice.mjs   # potong ulang aset
node design/shot.mjs http://localhost:3000/ out.png 390 1500 2   # screenshot
```

Warna diambil langsung dari mockup, bukan ditebak, dan didefinisikan sebagai
CSS custom property di blok `:root` paling atas
[src/app/globals.css](src/app/globals.css).

Logo Toyota TMMIN dan mark "Always A Better Way" saat ini hasil potongan dari
mockup, jadi resolusinya terbatas dan akan pecah kalau diperbesar. Sebelum
dipakai resmi, minta file aslinya ke tim komunikasi - logo korporat biasanya
tersedia dalam SVG.

## Aturan sebelum menyentuh kode ini

Tiga hal yang tidak akan ketahuan dari membaca kodenya. Alasan lengkapnya ada
di [docs/decisions.md](docs/decisions.md).

- **Jangan letakkan file metadata di `src/app/`** — tidak `favicon.ico`,
  `icon.png`, maupun `opengraph-image.*`. Pakai `public/`.
- **`src/middleware.ts` hanya boleh mengimpor `src/lib/jwt.ts`.** Bukan
  `bcryptjs`, `node:crypto`, `server-only`, atau `src/db/client.ts`.
- **Jangan pernah `db.select()` polos pada `admin_users`.** Pakai
  `adminUserSafeColumns`. Ada test yang menegakkan ini.

## Keputusan yang masih terbuka

- Retensi data: berapa lama suara disimpan, dan apakah perlu penghapusan
  otomatis.
- Rumah aplikasi setelah demo: Vercel Pro, hosting lain, atau infrastruktur
  perusahaan.
- Mitigasi untuk volume rendah (lihat poin 2 di atas).
- Apakah kategori `other` perlu ditambahkan untuk suara yang tidak masuk ketiga
  kategori yang ada.
- Cloudflare Turnstile belum dipasang. Selama kuncinya kosong, form berjalan
  tanpa proteksi bot selain honeypot dan pembatas laju.
