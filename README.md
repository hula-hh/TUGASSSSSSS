# Sistem Absensi QR Code

Aplikasi web absensi siswa berbasis QR Code untuk tugas sekolah.

## Fitur
- Dashboard
- Scanner QR Code menggunakan kamera browser
- Validasi QR siswa
- Penolakan QR yang tidak terdaftar
- Pencegahan absensi ganda pada tanggal yang sama
- Penyimpanan absensi menggunakan `localStorage` browser
- Rekap absensi
- Halaman QR Code siswa untuk pengujian

## Cara menjalankan
1. Buka repository menggunakan GitHub Pages atau server lokal.
2. Buka `index.html`.
3. Masuk ke **Daftar Siswa** untuk melihat QR Code contoh.
4. Buka **Scanner**, izinkan kamera, lalu scan QR siswa.
5. Buka **Rekap Absensi** untuk melihat hasil scan.

> Catatan: versi ini adalah prototype frontend. GitHub Pages tidak menjalankan PHP/MySQL, jadi data absensi disimpan di `localStorage` browser. `database/schema.sql` tetap disediakan sebagai rancangan untuk tahap backend/database.

## Struktur
- `index.html` — dashboard
- `scanner.html` — scanner QR
- `students.html` — QR Code siswa contoh
- `attendance.html` — rekap absensi
- `js/scanner.js` — validasi dan penyimpanan absensi
- `css/style.css` — tampilan
- `database/schema.sql` — rancangan database
