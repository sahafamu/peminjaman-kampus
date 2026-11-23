<?php
declare(strict_types=1);
require __DIR__ . '/../app/bootstrap.php';
$user = require_role('admin');
?>
<!doctype html>
<html lang="id">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Dashboard Admin</title>
  <meta name="description"
    content="Dashboard admin peminjaman kampus: persetujuan, jadwal tetap, inventaris barang, barang keluar dan kembali, serta laporan.">
  <link
    href="https://fonts.googleapis.com/css2?family=Epilogue:wght@400;600;700&family=IBM+Plex+Mono:wght@400&display=swap"
    rel="stylesheet">
  <link rel="stylesheet" href="../assets/css/app.css">
</head>

<body>
  <div class="app">
    <aside class="side" id="side" aria-label="Navigasi"></aside>
    <main class="main" id="isi">
      <header class="top">
        <div class="top__l">
          <button class="btn btn--icon menu-btn" type="button" id="menu-btn" aria-label="Buka menu"
            aria-expanded="false"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg></button>
          <div>
            <h1 id="judul">Ringkasan</h1>
            <p id="sub"></p>
          </div>
        </div>
      </header>
      <div id="view"></div>
      <p class="note" id="kabar" role="status" aria-live="polite" style="margin-top:var(--space-md)"></p>
    </main>
  </div>

  <dialog id="dlg-surat" aria-labelledby="dlg-surat-h" style="width:min(56rem,calc(100% - var(--space-lg)))">
    <h2 id="dlg-surat-h">Surat pengajuan</h2>
    <iframe id="dlg-surat-pdf" title="Isi surat pengajuan" style="width:100%;height:70dvh;border:1px solid var(--color-rule);border-radius:var(--radius-control)"></iframe>
    <div class="form__act" style="margin-top:var(--space-md)">
      <button class="btn" type="button" id="dlg-surat-tutup">Tutup</button>
      <button class="btn btn--primary" type="button" id="dlg-surat-unduh">Unduh PDF</button>
    </div>
  </dialog>

  <?= boot_script($user) ?>
  <script src="../assets/js/data.js"></script>
  <script src="../assets/js/shell.js"></script>
  <script src="../assets/js/pages/admin.js"></script>
</body>

</html>
