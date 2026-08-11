const SHEET_NAME = 'Absensi';

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, message: 'API absensi aktif' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    if (!sheet) throw new Error(`Sheet '${SHEET_NAME}' tidak ditemukan.`);
    if (!data.nis || !data.nama || !data.kelas) throw new Error('Data siswa tidak lengkap.');

    const values = sheet.getDataRange().getValues();
    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

    const duplicate = values.slice(1).some(row =>
      String(row[0]) === String(data.nis) && String(row[4]) === today
    );

    if (duplicate) {
      return json({ ok: false, status: 'duplicate', message: 'Siswa sudah absen hari ini.' });
    }

    const now = new Date();
    const date = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const time = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm:ss');

    sheet.appendRow([
      data.nis,
      data.nama,
      data.kelas,
      data.mapel || 'Umum',
      date,
      time,
      data.status || 'Hadir'
    ]);

    return json({ ok: true, status: 'success', message: 'Absensi berhasil disimpan.' });
  } catch (error) {
    return json({ ok: false, status: 'error', message: error.message });
  }
}

function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
