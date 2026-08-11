const SPREADSHEET_ID = '1PVgC6t2f691SHqc2E1fcEckOmBYBD1P6Zf5gYE5yKvA';
const SHEET_NAME = 'Absensi';

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  let result;

  if (params.action === 'attendance') {
    result = recordAttendance(params);
  } else {
    result = { ok: true, success: true, message: 'API absensi aktif' };
  }

  const output = JSON.stringify(result);
  const callback = params.callback;

  if (callback) {
    return ContentService
      .createTextOutput(`${callback}(${output})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
}

function recordAttendance(data) {
  try {
    const nis = String(data.nis || '').trim();
    const nama = String(data.nama || '').trim();
    const kelas = String(data.kelas || '').trim();
    const mapel = String(data.mapel || 'Umum').trim();

    if (!nis || !nama || !kelas) {
      return { ok: false, success: false, status: 'error', message: 'Data siswa tidak lengkap.' };
    }

    // Gunakan ID spreadsheet secara eksplisit supaya tidak salah spreadsheet.
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      sheet.appendRow(['NIS', 'Nama', 'Kelas', 'Mata Pelajaran', 'Tanggal', 'Waktu', 'Status']);
    } else if (sheet.getLastRow() === 0) {
      sheet.appendRow(['NIS', 'Nama', 'Kelas', 'Mata Pelajaran', 'Tanggal', 'Waktu', 'Status']);
    }

    const timezone = spreadsheet.getSpreadsheetTimeZone() || 'Asia/Jakarta';
    const now = new Date();
    const today = Utilities.formatDate(now, timezone, 'yyyy-MM-dd');
    const time = Utilities.formatDate(now, timezone, 'HH:mm:ss');

    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const values = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
      const duplicate = values.some(row => {
        const rowNis = String(row[0]).trim();
        const rowDate = row[4] instanceof Date
          ? Utilities.formatDate(row[4], timezone, 'yyyy-MM-dd')
          : String(row[4]).trim();
        return rowNis === nis && rowDate === today;
      });

      if (duplicate) {
        return {
          ok: false,
          success: false,
          duplicate: true,
          status: 'duplicate',
          message: `${nama} sudah absen hari ini.`
        };
      }
    }

    sheet.appendRow([nis, nama, kelas, mapel, today, time, 'Hadir']);

    return {
      ok: true,
      success: true,
      duplicate: false,
      status: 'success',
      message: `Absensi ${nama} berhasil disimpan.`,
      data: { nis, nama, kelas, mapel, tanggal: today, waktu: time, status: 'Hadir' }
    };
  } catch (error) {
    return { ok: false, success: false, status: 'error', message: error.message };
  }
}

function doPost(e) {
  return doGet({ parameter: JSON.parse(e.postData.contents) });
}
