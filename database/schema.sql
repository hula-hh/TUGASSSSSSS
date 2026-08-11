-- Database schema for the QR attendance app
CREATE TABLE students (
  id INTEGER PRIMARY KEY,
  nis VARCHAR(30) NOT NULL UNIQUE,
  nama VARCHAR(100) NOT NULL,
  kelas VARCHAR(30) NOT NULL,
  qr_code VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE attendance (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL,
  tanggal DATE NOT NULL,
  waktu TIME NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Hadir',
  FOREIGN KEY (student_id) REFERENCES students(id)
);
