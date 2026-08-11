const scannerElement = document.getElementById('reader');
const resultElement = document.getElementById('result');
const resetButton = document.getElementById('reset-scanner');

let scanner;

function showResult(message, type = 'info') {
  resultElement.textContent = message;
  resultElement.className = `result ${type}`;
}

function handleScan(decodedText) {
  if (!decodedText) return;

  showResult(`QR terbaca: ${decodedText}`, 'success');
  scanner.clear().catch(() => {});
}

function startScanner() {
  showResult('Meminta akses kamera...', 'info');

  scanner = new Html5Qrcode('reader');
  scanner.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 250, height: 250 } },
    handleScan,
    () => {}
  ).then(() => {
    showResult('Kamera aktif. Arahkan QR Code ke kotak scanner.', 'info');
  }).catch(() => {
    showResult('Kamera tidak dapat diakses. Pastikan izin kamera diberikan.', 'error');
  });
}

resetButton.addEventListener('click', () => {
  window.location.reload();
});

startScanner();
