# Attendify — Sistem Absensi QR

Aplikasi absensi siswa berbasis QR Code dengan UI modern, Google Sheets sebagai database, dan Google Apps Script sebagai API.

## Fitur

- Dashboard modern, responsif, dan dark mode.
- Scanner QR menggunakan kamera HP/laptop.
- Pilihan mata pelajaran.
- Validasi QR hanya untuk siswa terdaftar.
- Anti-duplikasi berdasarkan **NIS + mata pelajaran + tanggal**.
- Kelola siswa: tambah, hapus, cari, tampilkan QR, dan cetak QR.
- Rekap absensi live dari Google Sheets.
- Statistik total catatan, absensi hari ini, siswa unik hari ini, dan total siswa.
- Filter tanggal, mapel, nama/NIS/kelas.
- Export hasil filter ke CSV.
- Google Apps Script API dengan lock untuk mengurangi risiko race condition saat dua scan masuk bersamaan.
- Struktur data dipisah menjadi sheet **Siswa** dan **Absensi**.

## Struktur

- `index.html` — dashboard.
- `scanner.html` — scanner QR.
- `manage-students.html` — admin siswa.
- `students.html` — galeri QR siswa.
- `rekap.html` — rekap + statistik + CSV.
- `attendance.html` — redirect kompatibilitas ke rekap.
- `js/api.js` — utilitas API, tema, toast.
- `js/scanner.js` — logika scanner.
- `css/style.css` — UI responsive.
- `google-apps-script/Code.gs` — backend Google Sheets.

## Google Sheets

Backend memakai Spreadsheet ID yang sudah ada di `Code.gs`.

Saat pertama kali dipakai, Apps Script akan membuat dua sheet:

### Siswa

`NIS | Nama | Kelas | QR | Dibuat`

### Absensi

`NIS | Nama | Kelas | Mata Pelajaran | Tanggal | Waktu | Status | Timestamp`

Jangan mengubah nama kolom utama kalau ingin kompatibilitas penuh dengan API.

## Deploy Google Apps Script

Setelah perubahan pada `google-apps-script/Code.gs`:

1. Buka project Google Apps Script yang terhubung ke Spreadsheet.
2. Paste isi `google-apps-script/Code.gs`.
3. Pastikan `SPREADSHEET_ID` menunjuk ke spreadsheet yang benar.
4. **Deploy → Manage deployments**.
5. Edit deployment Web app dan buat/deploy versi terbaru.
6. Pilih akses yang sesuai untuk kebutuhan sekolah. Untuk aplikasi yang dibuka siswa tanpa login Google, web app perlu dapat diakses oleh pengguna tersebut.
7. Salin URL `/exec` terbaru ke `js/api.js` pada konstanta `API_URL`.
8. Jika URL deployment tetap sama, cukup pastikan deployment sudah memakai versi kode terbaru.

## GitHub Pages

Repository ini bisa dipublish sebagai GitHub Pages karena frontend berupa HTML/CSS/JS.

Kamera browser membutuhkan secure context, jadi gunakan HTTPS (GitHub Pages) atau localhost. Jangan mengandalkan `file://` untuk scanner.

## Catatan keamanan

Versi ini sengaja memakai Google Apps Script + Google Sheets supaya sederhana untuk proyek sekolah. Untuk penggunaan skala besar, tambahkan autentikasi admin, rate limiting, audit log, dan backend dengan kontrol akses yang lebih ketat.
