<?php
declare(strict_types=1);
require __DIR__ . '/../app/bootstrap.php';
$user = require_role('mahasiswa');
?>
<!doctype html>
<html lang="id">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Dashboard Mahasiswa</title>
  <meta name="description"
    content="Dashboard mahasiswa: peminjaman berikutnya, ruang yang kosong sekarang, serta status dan riwayat pengajuan.">
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
            <h1>Dashboard</h1>
            <p>Status pengajuan dan riwayat peminjamanmu.</p>
          </div>
        </div>
        <a class="btn btn--primary" href="pengajuan.php">Ajukan Peminjaman</a>
      </header>

      <div class="stats" id="stats"></div>

      <div class="cols">
        <section class="well panel" aria-labelledby="next-h">
          <div class="panel__head">
            <h2 id="next-h">Peminjaman berikutnya</h2><a href="ketersediaan.php">Lihat kalender</a>
          </div>
          <div id="next"></div>
        </section>
        <section class="well panel" aria-labelledby="now-h">
          <div class="panel__head">
            <h2 id="now-h">Ruang kosong</h2><span class="note" id="now-when"></span>
          </div>
          <ul class="list" id="now"></ul>
        </section>
      </div>

      <section class="well panel" id="riwayat" aria-labelledby="riw-h" style="margin-top: var(--space-md)">
        <div class="panel__head">
          <h2 id="riw-h">Status dan riwayat</h2>
        </div>
        <div class="toolbar">
          <fieldset class="seg" id="filter">
            <legend class="visually-hidden">Filter status</legend>
            <input type="radio" name="f" id="f-semua" value="semua" checked><label for="f-semua">Semua</label>
            <input type="radio" name="f" id="f-aktif" value="aktif"><label for="f-aktif">Aktif</label>
            <input type="radio" name="f" id="f-selesai" value="selesai"><label for="f-selesai">Selesai</label>
            <input type="radio" name="f" id="f-lain" value="lain"><label for="f-lain">Ditolak atau batal</label>
          </fieldset>
        </div>
        <div class="tablewrap" tabindex="0" role="region"
          aria-label="Tabel riwayat, geser ke samping bila layar sempit">
          <table>
            <thead>
              <tr>
                <th>Ruang</th>
                <th>Waktu</th>
                <th>Keperluan</th>
                <th>Status</th>
                <th class="act"><span class="visually-hidden">Aksi</span></th>
              </tr>
            </thead>
            <tbody id="rows"></tbody>
          </table>
        </div>
        <p class="note" id="kabar" role="status" aria-live="polite"></p>
      </section>
    </main>
  </div>

  <?= boot_script($user) ?>
  <script src="../assets/js/data.js"></script>
  <script src="../assets/js/shell.js"></script>
  <script src="../assets/js/pages/dashboard.js"></script>
</body>

</html>
