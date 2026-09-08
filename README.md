# Quran Hafiz

Aplikasi Al-Qur'an digital interaktif dengan audio murottal berbagai Qari, mode
khusus hafalan (looping ayat, penutup teks/blur), perekam audio hafalan,
mode ujian (ikhtibar) tahfidz, bookmark,
dan cloud save Google Drive.

## Stack

- React 19 + Vite 6 + Tailwind CSS 4
- Teks Arab Uthmani, anotasi tajwid, dan terjemahan Indonesia dari
  [AlQuran Cloud](https://alquran.cloud); transliterasi/audio diperkaya dari
  [equran.id](https://equran.id), dengan fallback ke
  [api.quran.com](https://api.quran.com) dan [everyayah.com](https://everyayah.com)
- Semua state pengguna (settings, bookmark, progres hafalan) disimpan di
  `localStorage` browser

Tidak ada environment variable yang wajib diisi untuk menjalankan aplikasi ini.

## Menjalankan secara lokal

**Prasyarat:** Node.js 18+

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`.

## Dukungan offline (PWA)

Build produksi menyimpan HTML, JavaScript, CSS, dan logo menggunakan Service
Worker. Buka aplikasi dengan internet terlebih dahulu dan tunggu pemuatan selesai;
setelah itu aplikasi dapat dibuka ulang atau di-refresh tanpa internet.
Service Worker memerlukan HTTPS (atau localhost), dan tidak aktif di `npm run dev`.
Untuk mencoba lokal: `npm run build` lalu `npm run preview`.

### Menginstal aplikasi

Banner instalasi ditampilkan ketika browser dan perangkat mendukung instalasi PWA.
Banner tidak ditampilkan jika aplikasi sudah terpasang. Jika ditutup, banner akan
muncul kembali setelah tujuh hari; penyimpanan dismissal dipisahkan per versi aplikasi.

- Chrome/Edge desktop dan Chrome Android: pilih **Instal aplikasi** pada banner,
  lalu konfirmasi prompt instalasi browser.
- Safari iPhone/iPad: pilih tombol **Bagikan**, lalu **Tambahkan ke Layar Utama**.
  iOS tidak menyediakan prompt instalasi otomatis, sehingga banner menampilkan
  petunjuk tersebut.

- Buka surah saat online untuk menyimpan teks dan terjemahannya di IndexedDB.
  Surah tersimpan tetap dapat dibaca offline, termasuk cache lebih dari tujuh hari.
- Bookmark, pengaturan, progres hafalan, dan rekaman lokal tetap tersimpan di browser.
- Surah yang belum dibuka, audio murottal streaming, dan Google Drive memerlukan
  internet. Seluruh Al-Quran dan audio **tidak** diunduh otomatis.
- Font eksternal dicache setelah dimuat; jika belum tersedia, font sistem digunakan.
- Menghapus data situs/cache atau penggusuran penyimpanan oleh browser dapat
  menghilangkan data offline. Cache bukan pengganti backup.
- Pembaruan aplikasi diaktifkan setelah semua tab aplikasi lama ditutup dan aplikasi
  dibuka kembali, agar sesi hafalan/rekaman tidak terputus karena reload otomatis.

Pengujian browser (`npm run test:e2e`) memakai build produksi agar Service Worker
ikut diuji.

## Deploy ke Vercel

1. Install Vercel CLI (opsional, bisa juga lewat dashboard/import GitHub repo):
   ```bash
   npm i -g vercel
   ```
2. Dari root proyek:
   ```bash
   vercel
   ```
   atau `vercel --prod` untuk langsung deploy ke production.
3. Alternatif: push repo ini ke GitHub lalu import di
   [vercel.com/new](https://vercel.com/new) — Vercel akan otomatis mendeteksi
   framework Vite, menjalankan `npm run build`, men-deploy folder `dist/`
   sebagai static site, dan mem-publish semua file di `api/` sebagai
   Serverless Functions.

### Firebase Cloud Save

Cloud Save memakai Firebase Authentication (Google Provider) dan Cloud Firestore.
`VITE_GOOGLE_CLIENT_ID` dan Google Drive API tidak lagi digunakan.

1. Buat project Firebase dan daftarkan Web App di Firebase Console.
2. Aktifkan Authentication > Sign-in method > Google dan pilih support email.
3. Tambahkan domain aplikasi dan localhost ke Authentication > Settings > Authorized domains.
4. Buat database Cloud Firestore `(default)` dan publish isi `firestore.rules` melalui tab Rules.
   Alternatif: gunakan Firebase CLI `firebase deploy --only firestore:rules --project ID_PROJECT_ANDA`.
5. Salin `.env.example` ke `.env.local` dan isi keempat nilai dari konfigurasi Web App.
   Untuk Vercel, isi environment variables yang sama lalu redeploy.

Tanpa konfigurasi Firebase, fitur lokal tetap berjalan. Konfigurasi Web App bukan secret;
Security Rules wajib dipasang agar setiap akun hanya mengakses backup miliknya.
Jangan memasukkan service-account private key ke frontend.

Backup JSON disimpan di `users/{uid}/backups/current`, maksimal 900 KB (di bawah batas
Firestore 1 MiB). Custom API key tidak disertakan. Login dipersistenkan oleh Firebase Auth;
logout tidak menghapus data lokal atau backup. Transaksi memeriksa versi backup agar
perubahan perangkat lain tidak tertimpa diam-diam.

**Migrasi:** backup Drive lama tidak dihapus atau diimpor otomatis. Bila diperlukan,
pulihkan backup Drive memakai versi aplikasi lama terlebih dahulu. Setelah update,
login Google dan cadangkan data lokal ke Firebase. Hapus `VITE_GOOGLE_CLIENT_ID` dari deployment.

Firebase mengirim identitas login dan data backup ke layanan Google. Firestore memerlukan
internet dan menggunakan kuota baca/tulis/penyimpanan; biaya bergantung pada paket dan
pemakaian project. Uji login dan Security Rules pada project Firebase sebelum produksi.

Fitur lain (murottal, hafalan, ujian tahfidz, bookmark) berjalan
penuh tanpa konfigurasi tambahan.

## Mode pribadi dan guru (implementasi awal)

Spesifikasi dan status pekerjaan tersedia di `PRD.md`.
Login Google, pilih **Mode Guru**, lalu bagikan kode enam karakter huruf/angka.
Siswa memakai **Guru pembimbing** untuk hubung/ganti/putus guru. Guru dapat
kembali ke **Murojaah Pribadi** tanpa logout. Hafalan akun disimpan per ayat,
terpisah dari siswa manual. Gunakan **Impor Hafalan Lokal Lama** secara eksplisit
untuk menambahkan ayat lokal yang belum ada di akun.

Rules baru perlu diuji melalui emulator sebelum diterbitkan. Belum ada deployment
otomatis. Listener hanya membuka progres siswa yang dipilih; operasi Firestore
menggunakan kuota baca/tulis. Kode undangan bukan rahasia autentikasi.

Edit ayat offline yang sudah dimuat masuk antrean lokal berdasarkan UID. Antrean
mengandung catatan siswa: jangan gunakan perangkat bersama tanpa membersihkannya.
Konflik versi tidak ditimpa otomatis. Pembuatan siswa manual dan pergantian guru
masih memerlukan internet. Lihat PRD untuk keterbatasan cache, backup dan isolasi
penyimpanan lama yang belum selesai; fitur ini belum siap produksi.

## Struktur proyek

```
src/                  Aplikasi React (Vite)
```
