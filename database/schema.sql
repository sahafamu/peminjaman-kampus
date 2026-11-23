-- Skema database Sistem Peminjaman Kampus (MySQL / MariaDB)
-- Dipakai oleh setup.php. Bisa juga diimpor manual lewat phpMyAdmin.

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(40) NOT NULL UNIQUE,
  nama VARCHAR(100) NOT NULL,
  role ENUM('admin','mahasiswa') NOT NULL DEFAULT 'mahasiswa',
  password_hash VARCHAR(255) NOT NULL,
  dibuat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- profil peran mahasiswa (satu baris per akun mahasiswa).
-- Peran lain dengan nomor induk sendiri, misalnya pegawai kampus (NIP), cukup dibuatkan tabel profil serupa.
CREATE TABLE IF NOT EXISTS mahasiswa (
  user_id INT UNSIGNED PRIMARY KEY,
  nim VARCHAR(20) NOT NULL UNIQUE,
  CONSTRAINT fk_mahasiswa_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rooms (
  id VARCHAR(10) PRIMARY KEY,
  nama VARCHAR(60) NOT NULL,
  jenis ENUM('kelas','lab','lapangan','auditorium') NOT NULL,
  urutan SMALLINT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- jadwal kuliah tetap; hari 0 = Senin ... 4 = Jumat
CREATE TABLE IF NOT EXISTS classes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hari TINYINT UNSIGNED NOT NULL,
  jam_mulai TIME NOT NULL,
  jam_selesai TIME NOT NULL,
  room_id VARCHAR(10) NOT NULL,
  mata_kuliah VARCHAR(120) NOT NULL,
  KEY idx_room_hari (room_id, hari),
  CONSTRAINT fk_classes_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bookings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  room_id VARCHAR(10) NOT NULL,
  tanggal DATE NOT NULL,
  jam_mulai TIME NOT NULL,
  jam_selesai TIME NOT NULL,
  keperluan VARCHAR(160) NOT NULL,
  pemohon VARCHAR(100) NOT NULL,
  user_id INT UNSIGNED NULL,
  status ENUM('diajukan','disetujui','ditolak','berjalan','selesai','dibatalkan','terlambat') NOT NULL DEFAULT 'diajukan',
  surat_nama VARCHAR(255) NULL,
  surat_file VARCHAR(80) NULL,
  diputus_oleh INT UNSIGNED NULL,
  diputus_pada DATETIME NULL,
  dibuat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_room_tanggal (room_id, tanggal),
  KEY idx_user (user_id),
  KEY idx_status (status),
  CONSTRAINT fk_bookings_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON UPDATE CASCADE,
  CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_bookings_admin FOREIGN KEY (diputus_oleh) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL UNIQUE,
  total INT UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- barang keluar dan kembali (dicatat admin)
CREATE TABLE IF NOT EXISTS loans (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  item_id INT UNSIGNED NOT NULL,
  jumlah INT UNSIGNED NOT NULL,
  peminjam VARCHAR(100) NOT NULL,
  tanggal_keluar DATE NOT NULL,
  tanggal_kembali DATE NULL,
  status ENUM('keluar','kembali') NOT NULL DEFAULT 'keluar',
  dicatat_oleh INT UNSIGNED NULL,
  KEY idx_item_status (item_id, status),
  CONSTRAINT fk_loans_item FOREIGN KEY (item_id) REFERENCES items(id) ON UPDATE CASCADE,
  CONSTRAINT fk_loans_admin FOREIGN KEY (dicatat_oleh) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
