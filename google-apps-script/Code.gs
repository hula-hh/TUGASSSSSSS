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

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return { ok: false, success: false, status: 'error', message: `Sheet '${SHEET_NAME}' tidak ditemukan.` };
    }

    const timezone = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone() || 'Asia/Jakarta';
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
