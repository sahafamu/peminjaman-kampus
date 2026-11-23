<?php
declare(strict_types=1);
require __DIR__ . '/../app/bootstrap.php';

$next = (string) ($_GET['lanjut'] ?? '');
if ($u = current_user()) redirect(home_for($u));

$err = '';
$nim = $nama = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nim = trim((string) ($_POST['nim'] ?? ''));
    $nama = trim(preg_replace('/\s+/u', ' ', (string) ($_POST['nama'] ?? '')) ?? '');
    $pass = (string) ($_POST['password'] ?? '');
    $pass2 = (string) ($_POST['password2'] ?? '');
    if (!csrf_ok($_POST['csrf'] ?? null)) $err = 'Halaman kedaluwarsa. Coba lagi.';
    elseif (!preg_match('/^[0-9]{5,20}$/', $nim)) $err = 'NIM berisi 5 sampai 20 angka.';
    elseif ($nama === '' || mb_strlen($nama) > 100) $err = 'Isi nama lengkap (maksimal 100 huruf).';
    elseif (strlen($pass) < 8) $err = 'Kata sandi minimal 8 karakter.';
    elseif ($pass !== $pass2) $err = 'Ulangi kata sandi dengan sama persis.';
    else {
        $db = db();
        try {
            /* akun (users) dan profil mahasiswa (NIM) dibuat bersamaan; nama pengguna diisi NIM */
            $db->beginTransaction();
            $db->prepare("INSERT INTO users (username, nama, role, password_hash) VALUES (?, ?, 'mahasiswa', ?)")
                ->execute([$nim, $nama, password_hash($pass, PASSWORD_DEFAULT)]);
            $db->prepare('INSERT INTO mahasiswa (user_id, nim) VALUES (?, ?)')->execute([(int) $db->lastInsertId(), $nim]);
            $db->commit();
            redirect('login.php?daftar=1' . ($next !== '' ? '&lanjut=' . rawurlencode($next) : ''));
        } catch (PDOException $ex) {
            if ($db->inTransaction()) $db->rollBack();
            if ($ex->getCode() !== '23000') throw $ex;
            $err = 'NIM itu sudah terdaftar. Silakan masuk.';
        }
    }
}
?>
<!doctype html>
<html lang="id">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Daftar | Peminjaman Kampus</title>
  <meta name="description" content="Buat akun mahasiswa untuk mengajukan peminjaman ruang kampus.">
  <link href="https://fonts.googleapis.com/css2?family=Epilogue:wght@400;600;700&family=IBM+Plex+Mono:wght@400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../assets/css/app.css">
</head>

<body class="auth">
  <main class="well panel auth__card">
    <a class="brand" href="../" style="padding:0;text-decoration:none"><b>Peminjaman Kampus</b><span>Akun mahasiswa</span></a>
    <h1>Daftar</h1>
    <form class="form" method="post" novalidate>
      <input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>">
      <div class="field wide"><label for="nim">NIM</label><input id="nim" name="nim" type="text" inputmode="numeric" autocomplete="username" maxlength="20" value="<?= e($nim) ?>" required autofocus></div>
      <div class="field wide"><label for="nama">Nama lengkap</label><input id="nama" name="nama" type="text" autocomplete="name" maxlength="100" value="<?= e($nama) ?>" required></div>
      <div class="field"><label for="password">Kata sandi</label><input id="password" name="password" type="password" autocomplete="new-password" minlength="8" required></div>
      <div class="field"><label for="password2">Ulangi kata sandi</label><input id="password2" name="password2" type="password" autocomplete="new-password" required></div>
      <p class="form__err" role="alert"><?= e($err) ?></p>
      <div class="form__act"><a class="btn" href="login.php">Batal</a><button class="btn btn--primary" type="submit">Buat akun</button></div>
    </form>
  </main>
</body>

</html>
