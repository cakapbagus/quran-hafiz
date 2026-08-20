# Quran Hafiz

Aplikasi Al-Qur'an digital interaktif dengan audio murottal berbagai Qari, mode
khusus hafalan (looping ayat, penutup teks/blur), perekam audio hafalan,
mode ujian (ikhtibar) tahfidz, bookmark,
dan cloud save Google Drive.

## Stack

- React 19 + Vite 6 + Tailwind CSS 4
- Data ayat & audio dari [equran.id](https://equran.id) (dengan fallback ke
  [api.quran.com](https://api.quran.com) dan [everyayah.com](https://everyayah.com))
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

Tidak ada environment variable yang perlu diset di Vercel Project Settings
untuk fitur bawaan aplikasi ini.

### Catatan: Google Drive Cloud Sync

Fitur "Cloud Sync" memakai Google Identity Services (OAuth) dan Google Drive
API langsung dari browser (`src/services/googleDriveService.ts`). Client ID
default di file tersebut adalah placeholder dan **tidak akan berfungsi** di
domain produksi Anda. Untuk mengaktifkan fitur ini setelah deploy:

1. Buat OAuth 2.0 Client ID (tipe "Web application") di
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Tambahkan domain Vercel Anda (mis. `https://nama-app.vercel.app`) ke
   "Authorized JavaScript origins".
3. Ganti nilai `DEFAULT_CLIENT_ID` di
   `src/services/googleDriveService.ts` dengan Client ID Anda.

Fitur lain (murottal, hafalan, ujian tahfidz, bookmark) berjalan
penuh tanpa konfigurasi tambahan.

## Struktur proyek

```
src/                  Aplikasi React (Vite)
```
