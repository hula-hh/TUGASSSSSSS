const resultElement = document.getElementById('result');
const resetButton = document.getElementById('reset-scanner');

const students = [
  { id: 1, nis: '1001', nama: 'Andi Pratama', kelas: 'XII IPA 1', qr: 'SISWA-001' },
  { id: 2, nis: '1002', nama: 'Budi Santoso', kelas: 'XII IPA 1', qr: 'SISWA-002' },
  { id: 3, nis: '1003', nama: 'Citra Lestari', kelas: 'XII IPA 1', qr: 'SISWA-003' },
  { id: 4, nis: '1004', nama: 'Dimas Saputra', kelas: 'XII IPA 1', qr: 'SISWA-004' },
  { id: 5, nis: '1005', nama: 'Eka Putri', kelas: 'XII IPA 1', qr: 'SISWA-005' }
];

const STORAGE_KEY = 'absensi_qr_records';
let scanner = null;
let processing = false;

function getRecords() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function showResult(message, type = 'info') {
  resultElement.textContent = message;
  resultElement.className = `result ${type}`;
}

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function recordAttendance(student) {
  const records = getRecords();
  const today = todayKey();
  const alreadyPresent = records.some(record => record.studentId === student.id && record.tanggal === today);

  if (alreadyPresent) {
    showResult(`${student.nama} sudah absen hari ini.`, 'warning');
    return;
  }

  const now = new Date();
  const waktu = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  records.push({
    id: Date.now(),
    studentId: student.id,
    nis: student.nis,
    nama: student.nama,
    kelas: student.kelas,
    tanggal: today,
    waktu,
    status: 'Hadir'
  });

  saveRecords(records);
  showResult(`Absensi berhasil: ${student.nama} • ${waktu}`, 'success');
}

function handleScan(decodedText) {
  if (processing || !decodedText) return;
  processing = true;

  const code = decodedText.trim().toUpperCase();
  const student = students.find(item => item.qr.toUpperCase() === code);

  if (!student) {
    showResult('Barcode tidak valid. Siswa tidak terdaftar.', 'error');
  } else {
    recordAttendance(student);
  }

  setTimeout(() => {
    processing = false;
  }, 2500);
}

async function startScanner() {
  showResult('Meminta akses kamera...', 'info');
  scanner = new Html5Qrcode('reader');

  try {
    await scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      handleScan,
      () => {}
    );
    showResult('Kamera aktif. Arahkan QR Code ke kotak scanner.', 'info');
  } catch (error) {
    showResult('Kamera tidak dapat diakses. Izinkan kamera dan gunakan HTTPS/localhost.', 'error');
  }
}

resetButton.addEventListener('click', () => {
  window.location.reload();
});

startScanner();
