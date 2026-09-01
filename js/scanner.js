const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwlXsfOzHtXYSkQWeWPHRqx523TwplWugftV36teujhuS-bAOtY9HDKVYswdqbRW3T1Ug/exec';
const resultElement = document.getElementById('result');
const resetButton = document.getElementById('reset-scanner');

let scanner = null;
let processing = false;
let students = [];

function showResult(message, type = 'info') {
  resultElement.textContent = message;
  resultElement.className = `result ${type}`;
}

function jsonp(params) {
  return new Promise((resolve, reject) => {
    const callbackName = `studentCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    const query = new URLSearchParams({ ...params, callback: callbackName });
    let finished = false;

    const cleanup = () => {
      clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    };

    const timeout = setTimeout(() => {
      if (finished) return;
      finished = true;
      cleanup();
      reject(new Error('Server tidak merespons.'));
    }, 10000);

    window[callbackName] = (data) => {
      if (finished) return;
      finished = true;
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      if (finished) return;
      finished = true;
      cleanup();
      reject(new Error('Gagal terhubung ke server.'));
    };

    script.src = `${APPS_SCRIPT_URL}?${query.toString()}`;
    document.body.appendChild(script);
  });
}

async function loadStudents() {
  showResult('Memuat database siswa...', 'info');

  try {
    const response = await jsonp({ action: 'students' });

    if (!response.success) {
      throw new Error(response.message || 'Gagal mengambil data siswa.');
    }

    students = response.students || [];

    if (!students.length) {
      showResult('Belum ada siswa di database.', 'warning');
      return false;
    }

    showResult(`${students.length} siswa siap. Arahkan QR ke scanner.`, 'info');
    return true;
  } catch (error) {
    showResult(`Gagal memuat data siswa: ${error.message}`, 'error');
    return false;
  }
}

function sendAttendance(student) {
  const callbackName = `attendanceCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
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

  // Cari QR berdasarkan database Google Sheets, bukan data hard-code.
  const student = students.find(
    item => String(item.qr).trim().toUpperCase() === code
  );

  if (!student) {
    showResult('Barcode tidak valid. Siswa tidak terdaftar.', 'error');
    setTimeout(() => {
      processing = false;
    }, 1500);
    return;
  }

  showResult(`Memproses absensi ${student.nama}...`, 'info');
  sendAttendance(student);
}

async function startScanner() {
  const ready = await loadStudents();
  if (!ready) return;

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