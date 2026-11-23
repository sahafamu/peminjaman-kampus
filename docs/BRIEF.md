# Sistem Peminjaman Kampus

## Tujuan
Sistem untuk meminjam ruang kelas, laboratorium, lapangan, dan auditorium,
serta melihat jadwal kelas dan lab. Barang inventaris dicatat admin (Sarpras),
bukan dipinjam lewat sistem. Dua peran: Admin dan Mahasiswa.

## Peran
- Mahasiswa: cek ketersediaan ruang, ajukan peminjaman ruang (dengan peringatan
  bentrok langsung dan unggah surat untuk lapangan dan auditorium), lihat status
  dan riwayat, lihat daftar barang yang masih tersedia.
- Admin (Sarpras): setujui/tolak pengajuan, lihat dan unduh surat pengajuan,
  kelola jadwal tetap, kelola inventaris barang, catat barang keluar dan kembali,
  lihat laporan.

## Aturan bisnis (sudah pasti)
- Status peminjaman: diajukan, disetujui, ditolak, berjalan, selesai,
  dibatalkan, terlambat.
- Booking ruang tidak boleh bentrok dengan jadwal kuliah tetap
  maupun peminjaman lain yang sudah disetujui. Peminjaman yang mulai tepat
  saat jam sebelumnya selesai dianggap tidak bentrok.
- Peminjaman ruang hanya Senin sampai Sabtu, pukul 07.00 sampai 18.00,
  dan tidak untuk tanggal yang sudah lewat.
- Peminjaman barang inventaris tidak lewat sistem: mahasiswa datang langsung ke
  Sarpras (admin), dan mengembalikan ke sana juga.
- Surat pengajuan berlaku untuk lapangan dan auditorium. Surat berupa PDF,
  maksimal 2 MB, wajib diunggah. Pengajuan tanpa surat tidak bisa disetujui.

## Aturan bisnis (BELUM pasti, asumsi sementara)
- Semua peminjaman ruang perlu persetujuan admin.
- Barang dipinjam per jumlah (stok), bukan per unit berkode.
- Status pengembalian barang diubah admin lewat tombol "Catat kembali".
  Rencana awal untuk menghubungkannya dengan dashboard mahasiswa dibatalkan.

## Catatan barang keluar dan kembali
- Satu peminjaman barang satu baris di satu tabel, dengan tanggal keluar,
  tanggal kembali, dan status (belum kembali / sudah kembali).
- Urutan otomatis: yang belum kembali di atas (paling lama keluar dulu),
  yang sudah kembali di bawah. Ada filter Semua, Belum kembali, Sudah kembali.
- Stok tersedia = total dikurangi barang yang sedang keluar.

## Sistem PHP + MySQL (XAMPP, PHP 8.6)
Struktur folder lengkap ada di `README.md`. Prototipe HTML lama (localStorage)
disimpan sebagai arsip di `docs/prototipe-ui/`.

- Beranda (`index.php`, tanpa login): ruang kosong sekarang, papan ketersediaan
  per hari, jenis ruang, dan jam; tombol Ajukan membawa pilihan ruang dan jam ke
  form pengajuan (lewat halaman masuk bila belum login). Nama dan keperluan
  peminjam tidak ditampilkan di beranda. Juga cara meminjam dan stok barang.
- Akun: `auth/login.php` (nama pengguna atau NIM), `auth/daftar.php` (mahasiswa
  dengan NIM), `auth/logout.php`.
- Mahasiswa: `mahasiswa/` (dashboard), `ketersediaan.php`, `pengajuan.php`, `barang.php`.
- Admin: `admin/` (Ringkasan, Persetujuan dengan NIM pemohon, Jadwal tetap,
  Inventaris, Barang keluar dan kembali, Laporan).
- Server: `app/bootstrap.php` (koneksi, sesi, CSRF, URL), `app/rules.php`
  (aturan bisnis), `api/aksi.php` (semua perubahan data, diperiksa ulang di
  server), `api/surat.php` (buka/unduh surat, hanya admin atau pemilik).
- Database `peminjaman_kampus`: users, mahasiswa (profil: NIM), rooms, classes,
  bookings, items, loans (`database/schema.sql`). Koneksi di `config/config.php`.
- Peran: data login di `users`, data khusus peran di tabel profil. Rencana peran
  pegawai kampus (fitur sama dengan mahasiswa): tambah nilai role, tabel profil
  `pegawai` (NIP), dan entri di `ROLE_HOME` pada `app/bootstrap.php`.
- Surat PDF disimpan di `storage/surat/` (tidak bisa dibuka langsung dari browser),
  dicek ekstensi, isi PDF, dan ukuran maksimal 2 MB.
- Status otomatis: disetujui menjadi berjalan saat jamnya tiba, lalu selesai
  setelah jam selesai. Pengajuan yang waktunya sudah lewat tidak bisa disetujui.
- Instalasi: buka `install/` di browser (data contoh hanya diisi bila database
  kosong; database lama dilengkapi tabel baru), atau
  `php install/index.php --reset` untuk mengisi ulang data contoh.
- Akun awal: admin / admin123, mahasiswa / mahasiswa123 (NIM 2201010001).
  Ganti sebelum dipakai sungguhan.

## Belum dibuat
- Peran pegawai kampus.
- Kelola akun (ganti kata sandi, admin menambah admin lain).
- Kelola daftar ruang dan jenis barang dari halaman admin (sekarang lewat database).

## Gaya tampilan
- Bersih, mudah dipelajari, Beranda berbentuk landing page yang interaktif (cek ketersediaan langsung di halaman, filter, tombol ajukan); halaman setelah login berupa UI aplikasi padat data.
- Warna dominan oranye (asumsi; ganti bila kampus punya identitas lain).
- Bahasa Indonesia.

## DATA DUMMY (akan diganti data riil)

### Ruang
R.101, R.102, R.103, Lab Komputer 1, Lab Komputer 2, Lapangan Serbaguna,
Auditorium

### Jadwal tetap
| Hari | Jam | Ruang | Mata kuliah |
| --- | --- | --- | --- |
| Senin | 07.30-09.10 | R.101 | Pemrograman Web |
| Senin | 09.20-11.00 | Lab Komputer 1 | Basis Data |
| Senin | 13.00-14.40 | R.102 | Sistem Informasi Manajemen |
| Selasa | 07.30-09.10 | R.103 | Statistika |
| Selasa | 10.00-11.40 | Lab Komputer 2 | Jaringan Komputer |
| Rabu | 08.00-09.40 | R.101 | Kapita Selekta |
| Rabu | 13.00-14.40 | Lab Komputer 1 | Praktikum Pemrograman Web |
| Kamis | 09.20-11.00 | R.102 | Rekayasa Perangkat Lunak |
| Kamis | 13.00-15.30 | Lab Komputer 2 | Praktikum Audit SI |
| Jumat | 08.00-09.40 | R.103 | Business Intelligence |

Lapangan dan auditorium tidak punya jadwal kuliah tetap.

### Barang
Proyektor (4), Kabel HDMI (6), Sound system portable (2), Mic wireless (3),
Laptop (5), Terminal kabel roll (6), Papan tulis portable (2),
Bola basket (4), Bola voli (4), Kursi lipat (30)
