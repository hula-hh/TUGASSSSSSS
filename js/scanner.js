const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwlXsfOzHtXYSkQWeWPHRqx523TwplWugftV36teujhuS-bAOtY9HDKVYswdqbRW3T1Ug/exec';
const resultElement = document.getElementById('result');
const resetButton = document.getElementById('reset-scanner');

const students = [
  { id: 1, nis: '1001', nama: 'Andi Pratama', kelas: 'XII IPA 1', qr: 'SISWA-001' },
  { id: 2, nis: '1002', nama: 'Budi Santoso', kelas: 'XII IPA 1', qr: 'SISWA-002' },
  { id: 3, nis: '1003', nama: 'Citra Lestari', kelas: 'XII IPA 1', qr: 'SISWA-003' },
  { id: 4, nis: '1004', nama: 'Dimas Saputra', kelas: 'XII IPA 1', qr: 'SISWA-004' },
  { id: 5, nis: '1005', nama: 'Eka Putri', kelas: 'XII IPA 1', qr: 'SISWA-005' }
];

let scanner = null;
let processing = false;

function showResult(message, type = 'info') {
  resultElement.textContent = message;
  resultElement.className = `result ${type}`;
}

function sendAttendance(student) {
  const callbackName = `attendanceCallback_${Date.now()}`;
  const params = new URLSearchParams({
    action: 'attendance',
    nis: student.nis,
    nama: student.nama,
    kelas: student.kelas,
    mapel: 'Informatika',
    callback: callbackName
  });

  const script = document.createElement('script');
  let finished = false;

  const finish = (response, type = 'response') => {
    if (finished) return;
    finished = true;
    clearTimeout(timeout);
    delete window[callbackName];
    script.remove();
    processing = false;

    if (type === 'error') {
      showResult('Gagal terhubung ke Google Sheets.', 'error');
      return;
    }

    if (response && response.success) {
      showResult(response.message, 'success');
    } else if (response && response.duplicate) {
      showResult(response.message, 'warning');
    } else {
      showResult(response?.message || 'Absensi gagal disimpan.', 'error');
    }
  };

  const timeout = setTimeout(() => {
    if (finished) return;
    finished = true;
    delete window[callbackName];
    script.remove();
    processing = false;
    showResult('Server Google Sheets tidak merespons. Coba lagi.', 'error');
  }, 10000);

  window[callbackName] = (response) => finish(response);

  script.onerror = () => finish(null, 'error');
  script.src = `${APPS_SCRIPT_URL}?${params.toString()}`;
  document.body.appendChild(script);
}

function handleScan(decodedText) {
  if (processing || !decodedText) return;

  processing = true;

  const code = decodedText.trim().toUpperCase();
  const student = students.find(item => item.qr.toUpperCase() === code);

  if (!student) {
    showResult('Barcode tidak valid. Siswa tidak terdaftar.', 'error');
    processing = false;
    return;
  }

  showResult(`Memproses absensi ${student.nama}...`, 'info');
  sendAttendance(student);
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
