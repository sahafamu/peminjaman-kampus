<?php
declare(strict_types=1);
require __DIR__ . '/../app/bootstrap.php';

$next = (string) ($_GET['lanjut'] ?? '');
if ($u = current_user()) redirect(safe_next($next, $u));

$err = '';
$username = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim((string) ($_POST['username'] ?? ''));
    $pass = (string) ($_POST['password'] ?? '');
    if (!csrf_ok($_POST['csrf'] ?? null)) {
        $err = 'Halaman kedaluwarsa. Coba masuk lagi.';
    } elseif ($username === '' || $pass === '') {
        $err = 'Isi nama pengguna atau NIM, dan kata sandi.';
    } else {
        /* jeda kecil setelah beberapa kali gagal, untuk memperlambat tebakan kata sandi */
        $fails = $_SESSION['gagal'] ?? 0;
        if ($fails >= 5) usleep(min($fails, 15) * 200000);
        /* bisa masuk dengan nama pengguna atau NIM; nama pengguna yang sama persis didahulukan */
        $st = db()->prepare('SELECT u.id, u.username, u.nama, u.role, u.password_hash FROM users u LEFT JOIN mahasiswa m ON m.user_id = u.id
            WHERE u.username = ? OR m.nim = ? ORDER BY (u.username = ?) DESC LIMIT 1');
        $st->execute([$username, $username, $username]);
        $row = $st->fetch();
        if ($row && password_verify($pass, $row['password_hash'])) {
            if (password_needs_rehash($row['password_hash'], PASSWORD_DEFAULT)) {
                db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([password_hash($pass, PASSWORD_DEFAULT), $row['id']]);
            }
            unset($_SESSION['gagal']);
            login_user($row);
            redirect(safe_next($next, $row));
        }
        $_SESSION['gagal'] = $fails + 1;
        $err = 'Nama pengguna, NIM, atau kata sandi salah.';
    }
}
$sesi = (string) ($_GET['sesi'] ?? '');
$ok = match (true) {
    isset($_GET['daftar']) => 'Akun dibuat. Silakan masuk dengan NIM-mu.',
    isset($_GET['keluar']) => 'Kamu sudah keluar. Untuk membuka dashboard lagi, kamu harus masuk lagi.',
    $sesi === 'keluar' => 'Kamu sudah keluar dari sesi sebelumnya. Silakan masuk lagi untuk membuka halaman itu.',
    $sesi === 'habis' => 'Sesimu sudah berakhir. Silakan masuk lagi untuk membuka halaman itu.',
    default => '',
};
$hint = str_starts_with($next, 'mahasiswa/pengajuan.php') ? 'Masuk dulu untuk melanjutkan pengajuan. Isian ruang dan jam yang kamu pilih tetap terbawa.'
    : ($next !== '' ? 'Silakan masuk untuk membuka halaman itu.' : '');
?>
<!doctype html>
<html lang="id">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Masuk | Peminjaman Kampus</title>
  <meta name="description" content="Masuk ke sistem peminjaman ruang kampus.">
  <link href="https://fonts.googleapis.com/css2?family=Epilogue:wght@400;600;700&family=IBM+Plex+Mono:wght@400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../assets/css/app.css">
</head>

<body class="auth">
  <main class="well panel auth__card">
    <a class="brand" href="../" style="padding:0;text-decoration:none"><b>Peminjaman Kampus</b><span>Ruang kelas, lab, lapangan, dan auditorium</span></a>
    <h1>Masuk</h1>
    <?php if ($ok || $hint): ?><p class="notice<?= in_array($sesi, ['keluar', 'habis'], true) ? ' notice--warn' : '' ?>" role="status"><?= e($ok ?: $hint) ?></p><?php endif; ?>
    <form class="form" method="post" novalidate>
      <input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>">
      <div class="field wide"><label for="username">Nama pengguna atau NIM</label><input id="username" name="username" type="text" autocomplete="username" value="<?= e($username) ?>" required autofocus></div>
      <div class="field wide"><label for="password">Kata sandi</label><input id="password" name="password" type="password" autocomplete="current-password" required></div>
      <p class="form__err" role="alert"><?= e($err) ?></p>
      <div class="form__act"><a class="btn" href="../">Kembali ke beranda</a><button class="btn btn--primary" type="submit">Masuk</button></div>
    </form>
    <p class="note">Mahasiswa belum punya akun? <a href="daftar.php<?= $next !== '' ? '?lanjut=' . e(rawurlencode($next)) : '' ?>">Daftar di sini</a>.</p>
  </main>
</body>

</html>
