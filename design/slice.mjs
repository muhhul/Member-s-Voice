// Memotong aset ilustrasi dari design/mockup.jpg ke public/brand/.
//
// Sumbernya JPEG datar tanpa transparansi, jadi setiap potongan membawa
// latarnya sendiri. Supaya tidak ada sambungan yang terlihat, setiap potongan
// dipakai secara full-bleed (menempel ke tepi halaman) atau tepi dalamnya
// disembunyikan di balik kartu form.
//
// Jalankan ulang: npm i --no-save sharp && node design/slice.mjs
import sharp from "sharp";

const SRC = "design/mockup.jpg";
const OUT = "public/brand";

const crops = [
  // Header: keduanya di atas latar putih, jadi menyatu dengan bar putih HTML.
  { name: "logo",        left: 46,   top: 13,  width: 184,  height: 47  },
  { name: "tagline",     left: 1360, top: 12,  width: 154,  height: 54  },

  // Hero: selebar halaman, tidak ada sambungan.
  { name: "hero",        left: 0,    top: 80,  width: 1536, height: 314 },
  // Varian ponsel: dipersempit ke wordmark + beberapa karakter supaya
  // judulnya tetap terbaca di layar 390px.
  { name: "hero-mobile", left: 55,   top: 80,  width: 900,  height: 314 },

  // Panel dekoratif kiri-kanan. Tepi luar = tepi halaman, tepi dalam
  // tersembunyi di belakang kartu form.
  { name: "side-left",   left: 0,    top: 394, width: 285,  height: 420 },
  { name: "side-right",  left: 1251, top: 394, width: 285,  height: 420 },

  // Pita bawah, selebar halaman.
  { name: "band",        left: 0,    top: 893, width: 1536, height: 131 },
];

for (const c of crops) {
  await sharp(SRC)
    .extract({ left: c.left, top: c.top, width: c.width, height: c.height })
    .webp({ quality: 88 })
    .toFile(`${OUT}/${c.name}.webp`);
  console.log(`  ${c.name.padEnd(13)} ${c.width}x${c.height}`);
}
