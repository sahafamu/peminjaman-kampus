<?php
/* Instalasi: membuat database, tabel, akun awal, dan data contoh.
   Browser : buka http://localhost/peminjaman-kampus/install/ (hanya mengisi data bila database masih kosong).
   Terminal: php install/index.php          (sama)
             php install/index.php --reset  (HAPUS semua data lalu isi ulang data contoh)
   Database lama yang sudah berisi tetap aman: tabel baru dibuat dan data yang kurang dilengkapi. */
declare(strict_types=1);

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone']);
$cli = PHP_SAPI === 'cli';
$reset = $cli && in_array('--reset', $argv ?? [], true);
$log = [];
$say = function (string $m) use (&$log, $cli) { if ($cli) echo $m, PHP_EOL; else $log[] = $m; };

try {
    $c = $cfg['db'];
    $root = new PDO("mysql:host={$c['host']};port={$c['port']};charset=utf8mb4", $c['user'], $c['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $root->exec("CREATE DATABASE IF NOT EXISTS `{$c['name']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $db = new PDO("mysql:host={$c['host']};port={$c['port']};dbname={$c['name']};charset=utf8mb4", $c['user'], $c['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    if ($reset) {
        $db->exec('SET FOREIGN_KEY_CHECKS = 0');
        foreach (['loans', 'items', 'bookings', 'classes', 'rooms', 'mahasiswa', 'users'] as $t) $db->exec("DROP TABLE IF EXISTS `$t`");
        $db->exec('SET FOREIGN_KEY_CHECKS = 1');
        foreach (glob($cfg['storage'] . '/*.pdf') ?: [] as $f) unlink($f);
        $say('Tabel lama dihapus.');
    }

    foreach (array_filter(array_map('trim', explode(';', preg_replace('/^--.*$/m', '', file_get_contents(__DIR__ . '/../database/schema.sql'))))) as $sql) $db->exec($sql);
    $say('Tabel siap di database ' . $c['name'] . '.');

    if ((int) $db->query('SELECT COUNT(*) FROM users')->fetchColumn() > 0) {
        /* pembaruan: akun mahasiswa lama yang belum punya NIM. Nama pengguna berupa angka dipakai sebagai NIM. */
        $n = $db->exec("INSERT IGNORE INTO mahasiswa (user_id, nim) SELECT u.id, u.username FROM users u LEFT JOIN mahasiswa m ON m.user_id = u.id
            WHERE u.role = 'mahasiswa' AND m.user_id IS NULL AND u.username REGEXP '^[0-9]{5,20}$'");
        if ($n) $say("$n akun mahasiswa dilengkapi NIM dari nama penggunanya.");
        $missing = $db->query("SELECT u.username FROM users u LEFT JOIN mahasiswa m ON m.user_id = u.id WHERE u.role = 'mahasiswa' AND m.user_id IS NULL")->fetchAll(PDO::FETCH_COLUMN);
        if ($missing) $say('Akun mahasiswa tanpa NIM (isi lewat phpMyAdmin, tabel mahasiswa): ' . implode(', ', $missing));
        $say('Database sudah berisi data, data contoh tidak diisi ulang.' . ($cli ? ' Pakai --reset untuk mengisi ulang data contoh.' : ''));
    } else {
        $db->beginTransaction();
        $u = $db->prepare('INSERT INTO users (username, nama, role, password_hash) VALUES (?, ?, ?, ?)');
        $u->execute(['admin', 'Admin Sarpras', 'admin', password_hash('admin123', PASSWORD_DEFAULT)]);
        $adminId = (int) $db->lastInsertId();
        $u->execute(['mahasiswa', 'Mahasiswa Contoh', 'mahasiswa', password_hash('mahasiswa123', PASSWORD_DEFAULT)]);
        $mhsId = (int) $db->lastInsertId();
        $db->prepare('INSERT INTO mahasiswa (user_id, nim) VALUES (?, ?)')->execute([$mhsId, '2201010001']);

        $r = $db->prepare('INSERT INTO rooms (id, nama, jenis, urutan) VALUES (?, ?, ?, ?)');
        foreach ([['r101', 'R.101', 'kelas'], ['r102', 'R.102', 'kelas'], ['r103', 'R.103', 'kelas'], ['lk1', 'Lab Komputer 1', 'lab'],
            ['lk2', 'Lab Komputer 2', 'lab'], ['lap', 'Lapangan Serbaguna', 'lapangan'], ['aud', 'Auditorium', 'auditorium']] as $i => $x) $r->execute([...$x, $i]);

        $k = $db->prepare('INSERT INTO classes (hari, jam_mulai, jam_selesai, room_id, mata_kuliah) VALUES (?, ?, ?, ?, ?)');
        foreach ([[0, '07:30', '09:10', 'r101', 'Pemrograman Web'], [0, '09:20', '11:00', 'lk1', 'Basis Data'], [0, '13:00', '14:40', 'r102', 'Sistem Informasi Manajemen'],
            [1, '07:30', '09:10', 'r103', 'Statistika'], [1, '10:00', '11:40', 'lk2', 'Jaringan Komputer'],
            [2, '08:00', '09:40', 'r101', 'Kapita Selekta'], [2, '13:00', '14:40', 'lk1', 'Praktikum Pemrograman Web'],
            [3, '09:20', '11:00', 'r102', 'Rekayasa Perangkat Lunak'], [3, '13:00', '15:30', 'lk2', 'Praktikum Audit SI'],
            [4, '08:00', '09:40', 'r103', 'Business Intelligence']] as $x) $k->execute($x);

        /* peminjaman contoh relatif terhadap Senin minggu ini, seperti di prototipe */
        $mon = new DateTimeImmutable('monday this week');
        $b = $db->prepare('INSERT INTO bookings (tanggal, jam_mulai, jam_selesai, room_id, keperluan, status, pemohon, user_id, surat_nama) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $me = 'Mahasiswa Contoh';
        foreach ([[0, '13:00', '15:00', 'lk2', 'Latihan lomba pemrograman', 'disetujui', $me], [1, '13:00', '15:00', 'r102', 'Rapat himpunan', 'disetujui', 'Himpunan Mahasiswa SI'],
            [1, '13:00', '15:00', 'lk1', 'Pelatihan spreadsheet', 'disetujui', 'Panitia Pelatihan'], [2, '10:00', '12:00', 'r103', 'Seminar proposal', 'disetujui', $me],
            [2, '15:30', '17:30', 'lap', 'Latihan basket', 'disetujui', 'UKM Basket', 'surat-latihan-basket.pdf'], [2, '15:00', '17:00', 'r102', 'Rapat pengurus', 'diajukan', 'BEM Fakultas'],
            [3, '13:00', '15:00', 'r101', 'Diskusi kelompok', 'disetujui', 'Kelompok Riset'], [3, '16:00', '18:00', 'lap', 'Futsal angkatan', 'diajukan', $me, 'surat-futsal-angkatan.pdf'],
            [4, '07:00', '09:00', 'lap', 'Senam pagi', 'disetujui', 'UKM Senam', 'surat-senam-pagi.pdf'], [5, '08:00', '11:00', 'lap', 'Turnamen voli antarkelas', 'diajukan', 'Panitia Turnamen', 'surat-turnamen-voli.pdf'],
            [3, '08:00', '12:00', 'aud', 'Seminar nasional', 'disetujui', 'BEM Fakultas', 'surat-seminar-nasional.pdf'], [4, '13:00', '16:00', 'aud', 'Wisuda internal', 'diajukan', 'Panitia Wisuda', 'surat-wisuda-internal.pdf'],
            [-7, '13:00', '15:00', 'r101', 'Diskusi kelompok', 'selesai', $me], [-6, '15:30', '17:30', 'lap', 'Latihan basket', 'ditolak', $me, 'surat-latihan-basket.pdf'],
            [-5, '10:00', '12:00', 'lk1', 'Praktik mandiri', 'dibatalkan', $me], [-4, '15:00', '17:00', 'lk2', 'Pengerjaan tugas akhir', 'terlambat', $me],
            [-3, '09:00', '11:00', 'r103', 'Rapat panitia', 'selesai', 'Panitia Turnamen']] as $x) {
            $b->execute([$mon->modify("{$x[0]} day")->format('Y-m-d'), $x[1], $x[2], $x[3], $x[4], $x[5], $x[6], $x[6] === $me ? $mhsId : null, $x[7] ?? null]);
        }

        $it = $db->prepare('INSERT INTO items (nama, total) VALUES (?, ?)');
        $ids = [];
        foreach ([['Proyektor', 4], ['Kabel HDMI', 6], ['Sound system portable', 2], ['Mic wireless', 3], ['Laptop', 5], ['Terminal kabel roll', 6],
            ['Papan tulis portable', 2], ['Bola basket', 4], ['Bola voli', 4], ['Kursi lipat', 30]] as $x) { $it->execute($x); $ids[$x[0]] = (int) $db->lastInsertId(); }

        $l = $db->prepare('INSERT INTO loans (item_id, jumlah, peminjam, tanggal_keluar, tanggal_kembali, status, dicatat_oleh) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $d = fn(int $o) => $mon->modify("$o day")->format('Y-m-d');
        foreach ([['Proyektor', 1, 'Himpunan Mahasiswa SI', 0, null, 'keluar'], ['Sound system portable', 1, 'UKM Basket', 0, null, 'keluar'],
            ['Bola basket', 2, 'UKM Basket', 0, null, 'keluar'], ['Kursi lipat', 10, 'Panitia Turnamen', 0, null, 'keluar'],
            ['Laptop', 2, 'Panitia Pelatihan', -3, -1, 'kembali']] as $x) {
            $l->execute([$ids[$x[0]], $x[1], $x[2], $d($x[3]), $x[4] === null ? null : $d($x[4]), $x[5], $adminId]);
        }
        $db->commit();
        $say('Data contoh dan akun awal dibuat.');
        $say('Admin     : admin / admin123');
        $say('Mahasiswa : mahasiswa / mahasiswa123 (atau masuk dengan NIM 2201010001)');
    }
    if (!is_dir($cfg['storage'])) mkdir($cfg['storage'], 0775, true);
    $ok = true;
} catch (Throwable $ex) {
    $ok = false;
    $say('Gagal: ' . $ex->getMessage());
}

if ($cli) exit($ok ? 0 : 1);
?>
<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Instalasi</title>
  <link href="https://fonts.googleapis.com/css2?family=Epilogue:wght@400;600;700&family=IBM+Plex+Mono:wght@400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../assets/css/app.css">
</head>
<body class="auth">
  <main class="well panel auth__card">
    <h1>Instalasi database</h1>
    <ul class="list" style="margin-top:var(--space-md)">
      <?php foreach ($log as $m): ?><li><?= htmlspecialchars($m) ?></li><?php endforeach; ?>
    </ul>
    <?php if ($ok): ?><p style="margin-top:var(--space-md)"><a class="btn btn--primary" href="../auth/login.php">Ke halaman masuk</a></p><?php endif; ?>
  </main>
</body>
</html>
