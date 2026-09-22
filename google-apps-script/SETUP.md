# ABSENSIQU — Google Sheets Sync

1. Buat Google Spreadsheet baru.
2. Buat sheet Students dan Attendance.
3. Students headers: id | nis | name | class | active
4. Attendance headers: id | date | time | studentId | nis | name | class | status | note
5. Extensions → Apps Script → paste Code.gs.
6. Deploy → New deployment → Web app → Execute as Me → Who has access: Anyone.
7. Copy URL /exec ke ABSENSIQU → Pengaturan.

Untuk produksi sekolah, tambahkan autentikasi dan pembatasan akses. Jangan menaruh service-account secret di frontend.
