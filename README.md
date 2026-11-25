# Peminjaman Kampus

Sistem peminjaman ruang kelas, laboratorium, lapangan, dan auditorium, lengkap dengan jadwal kuliah tetap dan pencatatan barang inventaris. Dibuat dengan PHP + MySQL dan dijalankan di XAMPP. Ada dua peran: **Mahasiswa** dan **Admin (Sarpras)**.

README ini untuk anggota tim. Ikuti urutannya dari atas, dan kamu akan punya aplikasi yang jalan di komputermu sendiri. Aturan bisnis dan latar belakang proyek ada di [docs/BRIEF.md](docs/BRIEF.md).

## Daftar isi

1. [Fitur](#fitur)
2. [Aturan peminjaman](#aturan-peminjaman)
3. [Yang perlu disiapkan](#yang-perlu-disiapkan)
4. [Pasang dan jalankan (pertama kali)](#pasang-dan-jalankan-pertama-kali)
5. [Akun contoh](#akun-contoh)
6. [Cara memakai aplikasi](#cara-memakai-aplikasi)
7. [Mengganti data contoh dengan data riil](#mengganti-data-contoh-dengan-data-riil)
8. [Bekerja bersama di tim (Git)](#bekerja-bersama-di-tim-git)
9. [Mau mengubah apa, buka file mana](#mau-mengubah-apa-buka-file-mana)
10. [Struktur folder](#struktur-folder)
11. [Pemecahan masalah](#pemecahan-masalah)
12. [Keamanan sebelum dipasang di server kampus](#keamanan-sebelum-dipasang-di-server-kampus)
13. [Belum dibuat](#belum-dibuat)

## Fitur

**Tanpa login (Beranda)**
- Ruang yang kosong sekarang, papan ketersediaan per hari, jenis ruang, dan jam.
- Cara meminjam dan stok barang yang tersedia.
- Nama dan keperluan peminjam tidak ditampilkan.

**Mahasiswa**
- Daftar dengan NIM, masuk dengan NIM atau nama pengguna.
- Melihat kalender mingguan per ruang (jadwal kuliah dan peminjaman).
- Mengajukan peminjaman ruang, dengan peringatan bentrok langsung dan unggah surat PDF untuk lapangan dan auditorium.
- Melihat status dan riwayat pengajuan, membatalkan pengajuan yang belum lewat waktunya.
- Melihat daftar barang yang masih tersedia.

**Admin (Sarpras)**
- **Ringkasan**: antrean persetujuan dan barang yang belum kembali.
- **Persetujuan**: setujui atau tolak pengajuan, lihat NIM pemohon, buka dan unduh surat.
- **Jadwal tetap**: tambah dan hapus jadwal kuliah dan praktikum mingguan.
- **Inventaris barang**: atur stok barang.
- **Barang keluar dan kembali**: catat barang yang dibawa dan dikembalikan.
- **Laporan**: rekap pengajuan menurut status dan ruang, serta barang yang paling sering keluar.

## Aturan peminjaman

Aturan ini diperiksa di server (`app/rules.php`), jadi tidak bisa dilewati lewat browser.

| Aturan | Isi |
| --- | --- |
| Hari dan jam | Senin sampai Sabtu, pukul 07.00 sampai 18.00. Tidak untuk hari Minggu dan tanggal yang sudah lewat. |
| Bentrok | Tidak boleh bentrok dengan jadwal kuliah tetap atau peminjaman lain yang sudah disetujui. Peminjaman yang mulai tepat saat jam sebelumnya selesai tidak dianggap bentrok. |
| Surat | Wajib untuk lapangan dan auditorium. Berupa PDF, maksimal 2 MB. Tanpa surat, pengajuan tidak bisa disetujui. |
| Persetujuan | Semua peminjaman ruang perlu persetujuan admin. |
| Status | diajukan, disetujui, ditolak, berjalan, selesai, dibatalkan, terlambat. Status disetujui berubah otomatis menjadi berjalan saat jamnya tiba, lalu selesai setelah jam selesai. |
| Barang | Barang inventaris **tidak** dipinjam lewat sistem. Mahasiswa datang langsung ke Sarpras, lalu admin mencatat barang keluar dan kembali. Stok tersedia = total dikurangi barang yang sedang keluar. |

Beberapa aturan di [docs/BRIEF.md](docs/BRIEF.md) masih berstatus asumsi sementara, karena belum dikonfirmasi pihak kampus.

## Yang perlu disiapkan

| Kebutuhan | Keterangan |
| --- | --- |
| XAMPP | Berisi Apache, MySQL (MariaDB), PHP, dan phpMyAdmin. Unduh dari apachefriends.org. |
| PHP 8.1 atau lebih baru | Sudah termasuk di XAMPP. Cek dengan `php -v` (lihat catatan di bawah). |
| Git | Untuk mengambil dan mengirim kode. Unduh dari git-scm.com. |
| Editor kode | Misalnya VS Code. |
| Browser | Chrome, Edge, atau Firefox. |
| Internet | Hanya untuk memuat font dari Google Fonts. Tanpa internet, aplikasi tetap jalan dengan font cadangan. |

**Cek versi PHP.** Buka PowerShell lalu jalankan:

```powershell
C:\xampp\php\php.exe -v
```

Ganti `C:\xampp` kalau XAMPP-mu terpasang di drive lain. Kode memakai fitur PHP 8.1 (misalnya tipe `never`), jadi versi di bawah 8.1 tidak akan jalan. Aplikasi ini baru diuji di **PHP 8.6.0**. Batas 8.1 didasarkan pada fitur bahasa yang dipakai, bukan pengujian di 8.1 sampai 8.5. Kalau ada error aneh di versi lain, sebutkan versi PHP-mu saat melapor.

## Pasang dan jalankan (pertama kali)

Contoh di bawah memakai Windows dan XAMPP di `C:\xampp`. Kalau drive C penuh, pasang XAMPP di drive lain (misalnya `D:\xampp`) saat instalasi, lalu ganti `C:\xampp` di semua langkah dengan lokasi barumu.

### Langkah 1. Ambil kodenya

Folder proyek harus berada di dalam `htdocs` milik XAMPP, supaya Apache bisa menyajikannya.

```powershell
cd C:\xampp\htdocs
git clone https://github.com/sahafamu/peminjaman-kampus.git
```

Kalau repo ini private, minta pemilik repo menambahkan akun GitHub-mu sebagai collaborator dulu. Setelah itu clone akan meminta login GitHub.

Hasilnya adalah folder `C:\xampp\htdocs\peminjaman-kampus`. Nama folder ini ikut menjadi bagian alamat di browser, jadi jangan diganti kalau kamu ingin mengikuti alamat di README ini.

### Langkah 2. Nyalakan Apache dan MySQL

1. Buka **XAMPP Control Panel**.
2. Klik **Start** pada baris **Apache** dan baris **MySQL**.
3. Tunggu sampai kedua nama berwarna hijau.

Kalau salah satu gagal menyala, lihat [Pemecahan masalah](#pemecahan-masalah).

### Langkah 3. Buat file pengaturan

File `config/config.php` berisi password database dan **tidak ikut Git**, jadi setiap orang membuatnya sendiri dari contoh.

```powershell
cd C:\xampp\htdocs\peminjaman-kampus
copy config\config.example.php config\config.php
```

Buka `config/config.php` dengan editor. Pada XAMPP bawaan, isinya sudah cocok dan tidak perlu diubah:

```php
'db' => [
    'host' => '127.0.0.1',
    'port' => 3306,
    'name' => 'peminjaman_kampus',
    'user' => 'root',
    'pass' => '',
],
```

Ubah `user` dan `pass` hanya kalau kamu sudah mengatur password MySQL sendiri. Bagian lain yang bisa diatur: `timezone` (bawaan `Asia/Jakarta`), `surat_max` (batas ukuran surat, bawaan 2 MB), dan `base_url` (kosongkan, dihitung otomatis).

### Langkah 4. Buat database dan data contoh

Buka alamat ini di browser, **sekali saja**:

```
http://localhost/peminjaman-kampus/install/
```

Kalau berhasil, muncul halaman "Instalasi database" dengan daftar seperti ini:

- Tabel siap di database peminjaman_kampus.
- Data contoh dan akun awal dibuat.
- Admin : admin / admin123
- Mahasiswa : mahasiswa / mahasiswa123

Installer membuat database `peminjaman_kampus`, semua tabel, dua akun awal, 7 ruang, 10 jadwal kuliah, beberapa peminjaman contoh, dan 10 jenis barang. Data contoh hanya diisi kalau database masih kosong, jadi membuka halaman ini lagi tidak merusak data yang sudah ada.

Alternatif lewat terminal (hasilnya sama):

```powershell
C:\xampp\php\php.exe install\index.php
```

### Langkah 5. Buka aplikasinya

```
http://localhost/peminjaman-kampus/
```

Masuk dengan salah satu [akun contoh](#akun-contoh). Selesai.

### Alternatif: tanpa menaruh folder di htdocs

Kalau kamu lebih suka menyimpan proyek di drive lain (misalnya `D:\projek-baru\peminjaman-kampus`), jalankan server bawaan PHP dari folder proyek. MySQL di XAMPP tetap harus menyala.

```powershell
cd D:\projek-baru\peminjaman-kampus
C:\xampp\php\php.exe -S localhost:8000
```

Lalu buka `http://localhost:8000/install/` dan `http://localhost:8000/`. Catatan: server bawaan PHP tidak membaca `.htaccess`, jadi folder yang seharusnya tertutup (`app/`, `config/`, `database/`, `storage/`, `docs/`) bisa dibuka dari browser. Berkas SQL dan dokumen bisa diunduh, dan **surat PDF di `storage/surat/` bisa dibuka lewat alamat langsung** oleh siapa saja yang tahu namanya. Karena itu:

- Pakai cara ini hanya untuk pengembangan di komputermu sendiri, jangan untuk server.
- Jangan mengunggah surat asli saat memakai cara ini, cukup berkas PDF percobaan.

Yang sudah dicoba: Beranda, halaman masuk, dan pengalihan ke halaman masuk berjalan di cara ini. Halaman lain belum diuji, jadi kalau ada yang aneh, kembali ke cara htdocs.

## Akun contoh

| Peran | Nama pengguna | Kata sandi | Keterangan |
| --- | --- | --- | --- |
| Admin | `admin` | `admin123` | Admin Sarpras |
| Mahasiswa | `mahasiswa` | `mahasiswa123` | Bisa juga masuk dengan NIM `2201010001` |

Mahasiswa baru bisa mendaftar sendiri lewat halaman **Daftar** (NIM 5 sampai 20 angka, kata sandi minimal 8 karakter). Akun admin tidak bisa dibuat dari halaman daftar. Untuk saat ini admin tambahan harus dibuat lewat database.

## Cara memakai aplikasi

### Sebagai mahasiswa

1. **Cek ketersediaan.** Dari Beranda (tanpa login) atau menu **Cek ketersediaan** setelah masuk. Kalender mingguan menampilkan jadwal kuliah dan peminjaman per ruang. Filter jenis ruang tersedia untuk kelas, lab, lapangan, dan auditorium.
2. **Masuk.** Klik **Masuk** (di Beranda) dan pakai NIM atau nama pengguna. Belum punya akun? Klik **Daftar**.
3. **Ajukan peminjaman.** Klik **Ajukan peminjaman** di menu (atau tombol Ajukan pada ruang yang kosong di Beranda, yang membawa ruang dan jam pilihanmu ke form). Isi ruang, tanggal, jam mulai, jam selesai, dan keperluan.
4. **Perhatikan peringatan bentrok.** Kalau waktunya bentrok, form langsung memberi tahu kuliah atau peminjaman mana yang menabrak. Pilih jam lain.
5. **Unggah surat untuk lapangan dan auditorium.** Berkas PDF, maksimal 2 MB. Tanpa surat, form tidak bisa dikirim.
6. **Pantau status** di **Dashboard** dan **Status dan riwayat**: peminjaman berikutnya, ruang yang kosong sekarang, serta status dan riwayat pengajuan. Pengajuan berstatus diajukan atau disetujui bisa dibatalkan lewat tombol **Batalkan** selama waktunya belum lewat.
7. **Barang.** Menu **Barang tersedia** hanya menampilkan stok. Untuk meminjam, datang langsung ke Sarpras.

### Sebagai admin

1. **Masuk** dengan akun admin. Kamu langsung masuk ke Dashboard Admin.
2. **Persetujuan.** Pengajuan baru muncul di antrean (jumlahnya tampil di menu). Setiap pengajuan menampilkan nama, NIM, ruang, waktu, dan keperluan. Klik surat untuk membukanya. Tombol **Setujui** ditolak sistem jika pengajuan bentrok, jika ruangnya perlu surat tetapi belum ada, atau jika waktunya sudah lewat. Dalam kasus terakhir, tolak saja.
3. **Jadwal tetap.** Tambah atau hapus jadwal kuliah dan praktikum. Jadwal hanya untuk ruang kelas dan lab, hari Senin sampai Jumat, pukul 07.00 sampai 18.00, dan tidak boleh bentrok dengan jadwal lain di ruang yang sama. Ruang pada jam itu otomatis tidak bisa dipinjam.
4. **Inventaris barang.** Tambah atau kurangi stok per satu. Total stok tidak boleh lebih rendah dari jumlah yang sedang keluar.
5. **Barang keluar dan kembali.** Saat ada yang membawa barang, isi nama peminjam, barang, dan jumlah, lalu klik **Catat keluar**. Saat barang dikembalikan, klik **Catat kembali** pada barisnya. Barang yang belum kembali selalu tampil di atas.
6. **Laporan.** Rekap otomatis dari semua data.

## Mengganti data contoh dengan data riil

Data jadwal dan barang saat ini hanya contoh dan harus diganti ketika data kampus sudah ada.

| Data | Cara mengganti |
| --- | --- |
| Jadwal kuliah | Menu **Jadwal tetap** di halaman admin. |
| Stok barang | Menu **Inventaris barang** di halaman admin. |
| Daftar ruang dan jenis barang baru | Belum ada halamannya. Ubah lewat phpMyAdmin (`http://localhost/phpmyadmin`), database `peminjaman_kampus`, tabel `rooms` dan `items`. |
| Akun admin dan mahasiswa contoh | Ganti kata sandinya, atau hapus barisnya di tabel `users`. |
| Semua data contoh sekaligus | Jalankan `C:\xampp\php\php.exe install\index.php --reset`. **Perintah ini menghapus semua data** (tabel, peminjaman, dan surat PDF) lalu mengisi ulang data contoh. |

Peminjaman ruang dan catatan barang contoh yang dibuat installer mengikuti hari Senin minggu itu, jadi tanggalnya selalu terlihat segar setelah `--reset`. Jadwal kuliah tetap sama setiap minggu, karena memang jadwal mingguan.

## Bekerja bersama di tim (Git)

Kode dibagikan lewat GitHub, tetapi **database tidak**. Setiap anggota punya database lokal sendiri di komputernya, jadi data contoh tiap orang bisa berbeda.

### Alur harian

```powershell
cd C:\xampp\htdocs\peminjaman-kampus

git pull                          # ambil perubahan terbaru sebelum mulai
git checkout -b fitur-nama-fitur  # buat cabang sendiri, jangan kerja langsung di main

# ... ubah kode, tes di browser ...

git status                        # lihat file yang berubah
git add .
git commit -m "Tambah filter jenis ruang di kalender"
git push -u origin fitur-nama-fitur
```

Setelah itu buka GitHub dan buat **Pull Request** dari cabangmu ke `main`. Minta satu anggota lain memeriksanya sebelum digabung. Setelah digabung, kembali ke `main` dan `git pull` lagi.

### Aturan tim

- **Jangan commit `config/config.php`.** Sudah masuk `.gitignore`, tetapi periksa `git status` sebelum `git add .`.
- **Jangan commit surat PDF** di `storage/surat/` (juga sudah di `.gitignore`).
- **Jangan menaruh data riil mahasiswa (NIM, nama) di repo.** Kalau repo-nya publik, data itu terbuka untuk semua orang.
- **Satu cabang untuk satu pekerjaan**, dan commit kecil dengan pesan yang menjelaskan apa yang berubah.
- **Perubahan database harus diberi tahu ke tim.** Kalau kamu mengubah `database/schema.sql`, ingat bahwa installer memakai `CREATE TABLE IF NOT EXISTS`. Tabel baru otomatis dibuat di komputer teman saat mereka membuka `install/`, tetapi **kolom baru pada tabel yang sudah ada tidak ditambahkan otomatis**. Tulis perintah `ALTER TABLE`-nya di deskripsi Pull Request, supaya teman bisa menjalankannya lewat phpMyAdmin (tab SQL), atau pakai `--reset` kalau data contoh boleh hilang.
- **Konflik saat `git pull`** itu wajar. Buka file yang ditandai, pilih isi yang benar, hapus tanda `<<<<<<<`, `=======`, `>>>>>>>`, lalu `git add` dan `git commit`. Kalau ragu, tanyakan ke tim sebelum memilih.

## Mau mengubah apa, buka file mana

| Mau mengubah | Buka |
| --- | --- |
| Aturan bisnis (jam, bentrok, surat, status) | `app/rules.php` |
| Aksi yang mengubah data (ajukan, setujui, stok, dll.) | `api/aksi.php` |
| Koneksi database, sesi login, CSRF, peran | `app/bootstrap.php` |
| Struktur tabel | `database/schema.sql` (lalu beri tahu tim, lihat aturan tim di atas) |
| Data contoh dan akun awal | `install/index.php` |
| Tampilan umum dan warna tema | `assets/css/app.css` |
| Tampilan Beranda atau form pengajuan | `assets/css/beranda.css`, `assets/css/pengajuan.css` |
| Perilaku halaman (kalender, tabel, tombol) | `assets/js/pages/*.js`, sesuai nama halamannya |
| Menu samping | `assets/js/shell.js` |
| Halaman admin | `admin/index.php` dan `assets/js/pages/admin.js` |
| Halaman mahasiswa | `mahasiswa/*.php` |
| Masuk, daftar, keluar | `auth/*.php` |
| Aturan dan latar belakang proyek | `docs/BRIEF.md` |

Pengecekan aturan selalu ada di sisi server (`app/rules.php` dan `api/aksi.php`), sedangkan JavaScript di `assets/js` hanya memberi peringatan lebih awal. Kalau kamu mengubah aturan, ubah di server dulu, lalu samakan peringatannya di JavaScript.

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

Folder bertanda [tertutup] tidak bisa dibuka dari browser (`.htaccess`). `docs/prototipe-ui/` adalah arsip prototipe HTML lama dari tahap desain dan tidak dipakai aplikasi.

Database `peminjaman_kampus` berisi tabel `users`, `mahasiswa` (NIM), `rooms`, `classes` (jadwal kuliah tetap), `bookings` (peminjaman ruang), `items`, dan `loans` (barang keluar dan kembali).

## Pemecahan masalah

| Gejala | Penyebab umum | Tindakan |
| --- | --- | --- |
| Apache tidak mau menyala di XAMPP | Port 80 atau 443 dipakai program lain (misalnya Skype, IIS, atau server web lain) | Tutup program itu, atau di XAMPP klik **Config** lalu **Service and Port Settings** dan ganti port Apache. Jika port diganti, alamatnya menjadi `http://localhost:8080/peminjaman-kampus/` (sesuaikan nomor port). |
| MySQL tidak mau menyala | Port 3306 dipakai MySQL lain | Matikan MySQL lain, atau ubah port di XAMPP lalu samakan `port` di `config/config.php`. |
| Halaman install menampilkan "Gagal: ... Connection refused" atau "[2002]" | MySQL belum menyala | Start MySQL di XAMPP Control Panel, lalu muat ulang. |
| "Gagal: ... Access denied for user" | `user` atau `pass` di `config/config.php` salah | Pada XAMPP bawaan: user `root`, pass dikosongkan. |
| Error "Failed opening required ... config.php" | `config/config.php` belum dibuat | Ulangi Langkah 3. |
| "404 Not Found" atau halaman tidak ditemukan | Folder tidak berada di `htdocs`, atau nama foldernya berbeda | Pastikan lokasinya `...\htdocs\peminjaman-kampus` dan alamatnya sama dengan nama folder. |
| Halaman tampil tanpa gaya (polos) | Alamat dibuka lewat file langsung (`file:///...`) atau Apache belum jalan | Selalu buka lewat `http://localhost/...`. |
| Font terlihat berbeda | Tidak ada internet, font Google tidak termuat | Tidak masalah, font cadangan dipakai. |
| "Token keamanan tidak cocok. Muat ulang halaman." atau "Sesi habis" | Halaman terbuka terlalu lama atau sesi berakhir | Muat ulang halaman, dan masuk lagi bila diminta. |
| Surat PDF ditolak | Bukan PDF asli, atau lebih dari 2 MB | Pakai berkas PDF yang benar dan kompres bila perlu. Kalau muncul error `finfo`, aktifkan `extension=fileinfo` di `php.ini` (di XAMPP: **Config** lalu **PHP (php.ini)**), lalu restart Apache. |
| Pengajuan tidak bisa disetujui | Bentrok, surat belum ada, atau waktunya sudah lewat | Baca pesan yang tampil. Tolak pengajuan yang waktunya sudah lewat. |
| Lupa kata sandi | Belum ada fitur ganti kata sandi | Buat hash baru dengan `C:\xampp\php\php.exe -r "echo password_hash('katasandibaru', PASSWORD_DEFAULT);"`, lalu tempel hasilnya ke kolom `password_hash` pada baris akun itu di tabel `users` lewat phpMyAdmin. |
| Data berantakan dan ingin mulai dari awal | | `C:\xampp\php\php.exe install\index.php --reset` (menghapus semua data). |

Kalau masalahmu tidak ada di tabel ini, salin pesan error lengkapnya ke grup tim, beserta langkah yang sudah kamu coba.

## Keamanan sebelum dipasang di server kampus

Untuk dipakai di komputer sendiri, semua aman. Sebelum aplikasi ini dipasang di server yang bisa diakses orang lain, lakukan:

1. **Ganti kata sandi akun contoh** `admin` dan `mahasiswa`, atau hapus akun mahasiswa contoh.
2. **Hapus atau blokir folder `install/`** setelah instalasi selesai.
3. **Jangan memakai user `root` tanpa password.** Buat user MySQL khusus untuk aplikasi ini, lalu isi di `config/config.php`.
4. **Pastikan Apache membaca `.htaccess`** (`AllowOverride` aktif untuk folder aplikasi), karena itulah yang menutup `app/`, `config/`, `database/`, dan `storage/` dari browser.
5. **Jangan commit `config/config.php`** dan jangan menaruh data riil di repo.

## Belum dibuat

- Peran pegawai kampus (fitur sama dengan mahasiswa). Rencananya: tambah nilai peran, tabel profil `pegawai` (NIP), dan entri di `ROLE_HOME` pada `app/bootstrap.php`.
- Kelola akun: ganti kata sandi, admin menambah admin lain.
- Kelola daftar ruang dan jenis barang dari halaman admin (sekarang lewat database).
