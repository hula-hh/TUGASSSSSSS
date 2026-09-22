const SPREADSHEET_ID = '1PVgC6t2f691SHqc2E1fcEckOmBYBD1P6Zf5gYE5yKvA';
const TZ = 'Asia/Jakarta';
const STUDENTS_SHEET = 'Siswa';
const ATTENDANCE_SHEET = 'Absensi';

function doGet(e) {
  const p = (e && e.parameter) || {};
  let result;
  try {
    switch (p.action) {
      case 'students': result = { success:true, students:listStudents() }; break;
      case 'addStudent': result = addStudent(p); break;
      case 'deleteStudent': result = deleteStudent(p); break;
      case 'attendance': result = recordAttendance(p); break;
      case 'attendanceRecords': result = { success:true, records:listAttendance() }; break;
      case 'summary': result = getSummary(p); break;
      case 'subjects': result = { success:true, subjects:getSubjects() }; break;
      default: result = { success:true, message:'Attendify API aktif', version:'2.0' };
    }
  } catch (err) {
    result = { success:false, message:err.message || String(err) };
  }
  return respond(result, p.callback);
}

function doPost(e) {
  let p = {};
  try { p = JSON.parse((e && e.postData && e.postData.contents) || '{}'); }
  catch (_) {}
  return doGet({parameter:p});
}

function respond(data, callback) {
  const output = JSON.stringify(data);
  if (callback) return ContentService.createTextOutput(callback + '(' + output + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(output).setMimeType(ContentService.MimeType.JSON);
}

function spreadsheet() { return SpreadsheetApp.openById(SPREADSHEET_ID); }

function getSheet(name, headers) {
  const ss = spreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0 && headers) sh.appendRow(headers);
  return sh;
}

function normalize(v) { return String(v == null ? '' : v).trim(); }
function safeQr(nis) { return 'SISWA-' + normalize(nis).replace(/\s+/g,'').toUpperCase(); }
function nowParts() {
  const now = new Date();
  return {
    date: Utilities.formatDate(now, TZ, 'yyyy-MM-dd'),
    time: Utilities.formatDate(now, TZ, 'HH:mm:ss'),
    timestamp: Utilities.formatDate(now, TZ, 'yyyy-MM-dd HH:mm:ss')
  };
}

function listStudents() {
  const sh = getSheet(STUDENTS_SHEET, ['NIS','Nama','Kelas','QR','Dibuat']);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  return values.slice(1).filter(r => normalize(r[0])).map(r => ({
    nis:normalize(r[0]), nama:normalize(r[1]), kelas:normalize(r[2]),
    qr:normalize(r[3]) || safeQr(r[0]),
    dibuat:r[4] instanceof Date ? Utilities.formatDate(r[4], TZ, 'yyyy-MM-dd HH:mm:ss') : normalize(r[4])
  }));
}

function addStudent(p) {
  const nis=normalize(p.nis), nama=normalize(p.nama), kelas=normalize(p.kelas);
  if (!nis || !nama || !kelas) return {success:false,message:'NIS, nama, dan kelas wajib diisi.'};
  const sh=getSheet(STUDENTS_SHEET,['NIS','Nama','Kelas','QR','Dibuat']);
  if (listStudents().some(s=>s.nis.toLowerCase()===nis.toLowerCase())) return {success:false,message:'NIS sudah terdaftar.'};
  const qr=safeQr(nis);
  sh.appendRow([nis,nama,kelas,qr,nowParts().timestamp]);
  return {success:true,message:'Siswa berhasil ditambahkan.',student:{nis,nama,kelas,qr}};
}

function deleteStudent(p) {
  const nis=normalize(p.nis);
  if (!nis) return {success:false,message:'NIS tidak ditemukan.'};
  const sh=getSheet(STUDENTS_SHEET,['NIS','Nama','Kelas','QR','Dibuat']);
  const values=sh.getDataRange().getValues();
  for (let i=values.length-1;i>=1;i--) {
    if (normalize(values[i][0])===nis) { sh.deleteRow(i+1); return {success:true,message:'Siswa dihapus.'}; }
  }
  return {success:false,message:'Siswa tidak ditemukan.'};
}

function listAttendance() {
  const sh=getSheet(ATTENDANCE_SHEET,['NIS','Nama','Kelas','Mata Pelajaran','Tanggal','Waktu','Status','Timestamp']);
  const values=sh.getDataRange().getValues();
  if (values.length<2) return [];
  return values.slice(1).filter(r=>normalize(r[0])).map(r=>({
    nis:normalize(r[0]), nama:normalize(r[1]), kelas:normalize(r[2]), mapel:normalize(r[3]),
    tanggal:r[4] instanceof Date ? Utilities.formatDate(r[4],TZ,'yyyy-MM-dd') : normalize(r[4]),
    waktu:r[5] instanceof Date ? Utilities.formatDate(r[5],TZ,'HH:mm:ss') : normalize(r[5]),
    status:normalize(r[6]) || 'Hadir',
    timestamp:r[7] instanceof Date ? Utilities.formatDate(r[7],TZ,'yyyy-MM-dd HH:mm:ss') : normalize(r[7])
  }));
}

function recordAttendance(p) {
  const nis=normalize(p.nis), nama=normalize(p.nama), kelas=normalize(p.kelas), mapel=normalize(p.mapel)||'Umum';
  if (!nis || !nama || !kelas) return {success:false,status:'error',message:'Data siswa tidak lengkap.'};
  const students=listStudents();
  const student=students.find(s=>s.nis===nis);
  if (!student) return {success:false,status:'error',message:'Siswa tidak terdaftar.'};
  const qr=normalize(p.qr);
  if (qr && qr.toUpperCase()!==student.qr.toUpperCase()) return {success:false,status:'error',message:'QR siswa tidak cocok.'};
  const sh=getSheet(ATTENDANCE_SHEET,['NIS','Nama','Kelas','Mata Pelajaran','Tanggal','Waktu','Status','Timestamp']);
  const t=nowParts();
  const lock=LockService.getScriptLock();
  lock.tryLock(5000);
  try {
    const records=listAttendance();
    const duplicate=records.find(r=>r.nis===nis && r.tanggal===t.date && r.mapel.toLowerCase()===mapel.toLowerCase());
    if (duplicate) return {success:false,duplicate:true,status:'duplicate',message:student.nama+' sudah absen untuk '+mapel+' hari ini.',data:duplicate};
    sh.appendRow([nis,student.nama,student.kelas,mapel,t.date,t.time,'Hadir',t.timestamp]);
    return {success:true,duplicate:false,status:'success',message:'Absensi '+student.nama+' berhasil disimpan.',data:{nis, nama:student.nama, kelas:student.kelas, mapel, tanggal:t.date, waktu:t.time, status:'Hadir'}};
  } finally { try { lock.releaseLock(); } catch (_) {} }
}

function getSubjects() {
  const defaults=['Informatika','Matematika','Biologi','Fisika','Kimia','Bahasa Indonesia','Bahasa Inggris'];
  const records=listAttendance().map(r=>r.mapel).filter(Boolean);
  return Array.from(new Set(defaults.concat(records)));
}

function getSummary(p) {
  const records=listAttendance(), students=listStudents(), today=nowParts().date;
  const date=normalize(p.date)||today;
  const mapel=normalize(p.mapel).toLowerCase();
  const filtered=records.filter(r=>(!date||r.tanggal===date)&&(!mapel||r.mapel.toLowerCase()===mapel));
  const uniqueToday=new Set(records.filter(r=>r.tanggal===today).map(r=>r.nis)).size;
  return {success:true,summary:{
    totalRecords:records.length,totalStudents:students.length,todayRecords:records.filter(r=>r.tanggal===today).length,
    uniqueToday,selectedRecords:filtered.length,selectedDate:date,selectedMapel:mapel||'Semua'
  }};
}