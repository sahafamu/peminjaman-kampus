# Peminjaman Kampus

Sistem peminjaman ruang kelas, laboratorium, lapangan, dan auditorium. PHP 8.6 + MySQL (XAMPP).
Aturan bisnis dan latar belakang ada di [docs/BRIEF.md](docs/BRIEF.md).

## Menjalankan

1. Nyalakan Apache dan MySQL di XAMPP.
2. Salin `config/config.example.php` menjadi `config/config.php`, lalu isi user dan password MySQL-mu.
3. Buka http://localhost/peminjaman-kampus/install/ sekali untuk membuat database dan data contoh.
4. Buka http://localhost/peminjaman-kampus/

Akun contoh: `admin` / `admin123`, `mahasiswa` / `mahasiswa123` (bisa juga masuk dengan NIM `2201010001`).
Isi ulang data contoh: `php install/index.php --reset` (menghapus semua data).

## Struktur folder

```
peminjaman-kampus/
├── index.php              Beranda (tanpa login): papan ketersediaan, cara meminjam, barang
├── admin/index.php        Dashboard admin
├── mahasiswa/             Halaman mahasiswa
│   ├── index.php            dashboard, status, dan riwayat
│   ├── ketersediaan.php     kalender mingguan per ruang
│   ├── pengajuan.php        form pengajuan
│   └── barang.php           barang yang tersedia
├── auth/                  login.php, daftar.php, logout.php
├── api/                   aksi.php (semua perubahan data), surat.php (buka/unduh surat PDF)
├── assets/
│   ├── css/                 app.css (tema bersama), beranda.css, pengajuan.css
│   └── js/                  data.js (data dan aturan bersama), shell.js (menu samping)
│       └── pages/           skrip per halaman
├── app/                   bootstrap.php (koneksi, sesi, CSRF), rules.php (aturan bisnis)   [tertutup]
├── config/config.php      pengaturan database dan aplikasi (salin dari config.example.php)  [tertutup, tidak di-commit]
├── database/schema.sql    skema tabel                                                       [tertutup]
├── install/index.php      instalasi dan pembaruan database
├── storage/surat/         berkas surat PDF yang diunggah                                    [tertutup]
└── docs/                  BRIEF.md dan prototipe-ui/ (arsip prototipe HTML)
```

Folder bertanda [tertutup] tidak bisa dibuka dari browser (`.htaccess`).
