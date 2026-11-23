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
  <title>Form Pengajuan Peminjaman</title>
  <meta name="description"
    content="Form pengajuan peminjaman ruang untuk mahasiswa, dengan peringatan langsung bila waktu bentrok dengan jadwal kuliah.">
  <link
    href="https://fonts.googleapis.com/css2?family=Epilogue:wght@400;600;700&family=IBM+Plex+Mono:wght@400&display=swap"
    rel="stylesheet">
  <link rel="stylesheet" href="../assets/css/app.css">
  <link rel="stylesheet" href="../assets/css/pengajuan.css">
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
            <h1>Form pengajuan</h1>
            <p>Pilih ruang dan waktu. Bentrok dengan jadwal kuliah langsung diberi tahu.</p>
          </div>
        </div>
        <a class="btn" href="ketersediaan.php">Lihat kalender</a>
      </header>

      <div class="cols cols--form">
        <section class="well panel" aria-labelledby="f-h">
          <div class="panel__head">
            <h2 id="f-h">Data peminjaman</h2>
          </div>
          <form class="fgrid" id="form" data-endpoint="" novalidate>
            <div class="field wide"><label for="f-ruang">Ruang</label><select id="f-ruang" name="ruang"></select></div>
            <div class="field wide"><label for="f-tgl">Tanggal</label><input id="f-tgl" name="tanggal" type="date"
                required></div>
            <div class="field"><label for="f-mulai">Mulai</label><input id="f-mulai" name="mulai" type="time"
                min="07:00" max="17:50" step="600" required></div>
            <div class="field"><label for="f-selesai">Selesai</label><input id="f-selesai" name="selesai" type="time"
                min="07:10" max="18:00" step="600" required></div>
            <div class="field wide"><label for="f-perlu">Keperluan</label><input id="f-perlu" name="keperluan"
                type="text" required></div>
            <div class="field wide" id="f-file-box" hidden><label for="f-file">Surat pengajuan (PDF, maksimal 2 MB)</label><input id="f-file" name="surat" type="file" accept=".pdf,application/pdf"></div>
<p class="note wide" id="f-surat" hidden>Peminjaman lapangan dan auditorium memerlukan surat pengajuan.</p>
            <p class="warn" id="warn" role="alert" data-idle>Pilih ruang, tanggal, dan jam untuk memeriksa bentrok.</p>
            <p class="form__err" id="f-err" role="alert"></p>
            <div class="form__act">
              <button class="btn" type="reset" id="f-reset">Kosongkan</button>
              <button class="btn btn--primary" type="submit" id="f-kirim">Kirim pengajuan</button>
            </div>
          </form>
          <div class="done" id="done" hidden>
            <h2>Pengajuan masuk antrean</h2>
            <p id="done-msg"></p>
            <div class="done__act"><a class="btn btn--primary" href="index.php#riwayat">Lihat
                status</a><button class="btn" type="button" id="lagi">Ajukan lagi</button></div>
          </div>
        </section>

        <section class="well panel" aria-labelledby="j-h">
          <div class="panel__head">
            <h2 id="j-h">Jadwal ruang hari itu</h2><span class="note" id="j-sub"></span>
          </div>
          <ul class="list" id="jadwal"></ul>
        </section>
      </div>
    </main>
  </div>

  <?= boot_script($user) ?>
  <script src="../assets/js/data.js"></script>
  <script src="../assets/js/shell.js"></script>
  <script src="../assets/js/pages/pengajuan.js"></script>
</body>

</html>