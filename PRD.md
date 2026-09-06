# PRD — Mode Pribadi dan Halaqah

## Ringkasan dan tujuan
Quran Hafiz mendukung satu profil hafalan pribadi per akun serta ruang guru untuk memantau banyak siswa. Guru dapat kembali ke mode pribadi tanpa logout atau kehilangan daftar siswa. Keberhasilan diukur melalui pengujian isolasi data, pergantian guru, dan sinkronisasi dua arah, bukan janji latensi jaringan.

## Pengguna, masalah, dan ruang lingkup
- Pengguna pribadi tetap dapat membaca dan murojaah tanpa login.
- Akun Google dapat mengaktifkan fasilitas guru dan memakai kedua mode.
- Siswa berakun memiliki nol atau satu guru aktif dan dapat menggantinya.
- Guru mengelola siswa terhubung dan siswa manual tanpa akun.
- Guru dapat mengedit nama tampilan halaqah, status hafalan, pengulangan, dan catatan; bukan kredensial Google siswa.
- Kode guru tepat enam karakter A–Z/0–9, mencakup huruf dan angka, input tidak membedakan kapital.
- Di luar scope: video call, banyak guru aktif, transfer siswa manual menjadi akun, perubahan kredensial siswa.

## User stories dan alur
1. Guru login, mengaktifkan mode guru, membagikan kode, menambahkan siswa manual, dan membuka lembar setoran.
2. Siswa login, memasukkan kode, melihat nama guru dan mengonfirmasi pemberian akses baca/edit hafalan.
3. Siswa mengganti guru dengan konfirmasi. Pergantian atomik; guru lama kehilangan akses server dan hafalan tidak dipindah/dihapus.
4. Guru beralih ke mode pribadi untuk murojaah; seluruh data siswa tetap terpisah.
5. Perubahan hafalan tersinkron ke pihak yang berhak; perubahan offline dikirim setelah tersambung, konflik ditampilkan tanpa menimpa diam-diam.

## Acceptance criteria (terverifikasi)
- [x] Kode unik enam karakter huruf dan angka; kode sendiri/tidak valid ditolak.
- [x] Mode guru/pribadi dapat berganti tanpa logout.
- [x] Hubung, ganti, dan putus guru menjaga maksimal satu guru aktif.
- [x] Guru lama tidak dapat membaca/menulis setelah perpindahan.
- [x] CRUD siswa manual dan edit siswa terhubung tersedia.
- [x] Status empat kategori, pengulangan, dan catatan per ayat dapat diedit.
- [x] Sinkronisasi dua arah serta status offline/error terlihat.
- [x] Data lokal/antarmode/antarakun tidak tercampur.
- [x] Typecheck, unit test, build dan rules integration diuji.

## Model data dan arsitektur
React/TypeScript, Firebase Auth Google dan Firestore yang sudah tersedia. Backup lama tetap privat dan terpisah dari data kolaborasi.
- teacher_codes/{code}: teacherUid, teacherName; reservasi transaksi dan lookup exact, bukan list publik.
- halaqah_profiles/{uid}: name, teacherCode, linkedTeacherUid, linkedTeacherCode, linkedTeacherName.
- learner_records/{uid}/verses/{surah_ayat}: hafalan akun sebagai sumber kanonik, revision dan updatedBy untuk konflik.
- teachers/{uid}/manual_students/{id}: name; subkoleksi verses untuk hafalan manual.
Daftar siswa terhubung melalui query linkedTeacherUid. Tidak menyimpan seluruh hafalan Quran dalam satu dokumen (batas 1 MiB). Mode aktif hanya pilihan UI, bukan izin keamanan.

## API/service, autentikasi dan otorisasi
Service TypeScript menyediakan aktivasi guru, lookup kode, perubahan relasi transaksi, subscription daftar/progres, CRUD manual dan update ayat dengan pemeriksaan versi. Firebase Rules memvalidasi pemilik, guru aktif, field yang diizinkan, identitas immutable dan revision. Guru tidak dapat mengubah relasi guru siswa atau backup pribadi. Login bukan verifikasi profesi guru.

## Keamanan, privasi dan error
Kode undangan bukan password; tidak memublikasikan daftar kode. Konfirmasi menampilkan nama guru dan cakupan akses. Penolakan izin, offline, konflik, kode bentrok/tidak ditemukan dan kegagalan penyimpanan harus terlihat. Data yang sudah diunduh guru tidak dapat ditarik kembali secara absolut. Jangan cache data siswa di perangkat bersama tanpa kebijakan pembersihan. Penghapusan data di cloud (unlink & delete) menghapus seluruh cadangan `users/{uid}/backups/current`, profil halaqah `halaqah_profiles/{uid}`, kode guru `teacher_codes/{code}`, rekaman hafalan `learner_records/{uid}/verses`, serta siswa manual `teachers/{uid}/manual_students` dan ayat-ayatnya secara permanen dari Firestore sebelum memutuskan sesi. Firestore memakai kuota/biaya Google. Pembatasan brute force server perlu disiapkan sebelum penggunaan publik berskala besar.

## Kebutuhan nonfungsional dan migrasi
Tidak menghapus backup/data lokal lama. Impor hafalan lama harus eksplisit dan hanya ke akun yang dipilih. Antrean offline dipisahkan UID; konflik tidak diselesaikan berdasarkan jam perangkat. Nama maksimal 100 karakter, catatan maksimal 2000. Tampilan responsif, label input, loading/empty/error state.

## Tahapan implementasi dan pengujian
1. Service model/kode/relasi dan rules.
2. Mode switcher, pembimbing dan dashboard siswa manual/terhubung.
3. Lembar setoran, sinkronisasi pribadi dan antrean konflik.
4. Unit test validasi, typecheck/build; emulator rules dan uji dua akun untuk perpindahan/offline/konflik.
5. Dokumentasi deployment rules (tidak deploy otomatis).

## Risiko dan pertanyaan terbuka
- Konflik offline: revision optimistic concurrency, tampilkan kegagalan dan minta muat versi terbaru.
- Biaya listener: hanya subscribe progres siswa yang dibuka.
- Penyalahgunaan kode: lookup exact tidak menggantikan rate limiting server.
- Asumsi: catatan hafalan dibawa bersama akun; tidak ada arsip yang dapat diakses guru lama setelah putus.
- Semua checkbox menunjukkan verifikasi aktual, bukan sekadar rancangan.

## Status implementasi
Tersedia: service kode guru/relasi, switch mode, daftar siswa linked/manual, arsip manual, edit nama, setoran per ayat, subscription realtime, antrean edit ayat offline dengan revision, impor eksplisit hafalan lokal yang belum ada di cloud, serta fitur unlink & delete yang menghapus seluruh data cloud pengguna dari Firestore secara bersih.

Validasi lokal: `npm run lint`, `npm run test` (45 test), dan `npm run build` lulus. Build memberi peringatan chunk >500 KB.

Belum selesai/terverifikasi:
- Emulator Security Rules dan alur dua akun belum diuji; jangan anggap rules siap produksi.
- Offline-first penuh (memuat ulang cache siswa, tambah siswa manual offline) belum tersedia; antrean hanya untuk edit ayat yang sudah dimuat.
- Isolasi bookmark/settings/riwayat baca antar login masih mengikuti penyimpanan lokal lama dan perlu migrasi UID.
- Ringkasan progres pada setiap kartu siswa, tampilan mushaf setoran, dan riwayat audit belum tersedia; ringkasan ada pada editor siswa terpilih.
- Antrean offline memerlukan pengujian multitab dan konflik; jika konflik pengguna dapat membuang antrean setelah konfirmasi dan memakai versi server.
- Backup lama belum terintegrasi penuh dengan sumber kanonik baru; restore harus ditinjau sebelum produksi.
