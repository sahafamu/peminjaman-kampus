<?php
declare(strict_types=1);
require __DIR__ . '/../app/bootstrap.php';

no_cache();
start_session();
if ($_SERVER['REQUEST_METHOD'] === 'POST' && csrf_ok($_POST['csrf'] ?? null)) {
    /* hapus login, ganti ID sesi, dan tandai "baru keluar" agar halaman masuk bisa memberi keterangan */
    $_SESSION = ['keluar' => 1];
    session_regenerate_id(true);
    redirect('login.php?keluar=1');
}
$u = current_user();
redirect($u ? home_for($u) : 'login.php');
