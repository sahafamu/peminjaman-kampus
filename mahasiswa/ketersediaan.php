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
  <title>Cek Ketersediaan Ruang</title>
  <meta name="description"
    content="Kalender mingguan tiap ruang kampus: jadwal kuliah tetap, peminjaman yang sudah ada, dan pengajuan peminjaman.">
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
            <h1>Cek ketersediaan</h1>
            <p>Klik area kosong di kalender untuk mengisi jam peminjaman.</p>
          </div>
        </div>
        <button class="btn btn--primary" type="button" data-open-form>Ajukan Peminjaman</button>
      </header>

      <div class="toolbar">
        <fieldset class="seg" id="seg-jenis">
          <legend class="visually-hidden">Jenis ruang</legend>
          <input type="radio" name="jenis" id="j-semua" value="semua" checked><label for="j-semua">Semua</label>
          <input type="radio" name="jenis" id="j-kelas" value="kelas"><label for="j-kelas">Kelas</label>
          <input type="radio" name="jenis" id="j-lab" value="lab"><label for="j-lab">Lab</label>
          <input type="radio" name="jenis" id="j-lapangan" value="lapangan"><label for="j-lapangan">Lapangan</label>
          <input type="radio" name="jenis" id="j-auditorium" value="auditorium"><label
            for="j-auditorium">Auditorium</label>
        </fieldset>
        <fieldset class="chips" id="rooms">
          <legend class="visually-hidden">Ruang</legend>
        </fieldset>
      </div>
      <div class="toolbar">
        <div class="weeknav">
          <button class="btn btn--icon" type="button" id="prev" aria-label="Minggu sebelumnya"><svg aria-hidden="true"
              width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M12.5 4.5 7 10l5.5 5.5" />
            </svg></button>
          <output id="week-label" aria-live="polite"></output>
          <button class="btn btn--icon" type="button" id="next" aria-label="Minggu berikutnya"><svg aria-hidden="true"
              width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M7.5 4.5 13 10l-5.5 5.5" />
            </svg></button>
          <button class="btn" type="button" id="today">Minggu ini</button>
        </div>
        <div class="jump"><label class="lab" for="jump">Lompat ke tanggal</label><input type="date" id="jump"></div>
        <p class="note room-now"><strong id="room-name"></strong> <span id="room-sub"></span></p>
      </div>

      <div class="sheet" tabindex="0" role="region" aria-label="Kalender mingguan, geser ke samping bila layar sempit">
        <div class="cal">
          <div class="cal__row cal__days" id="cal-days"></div>
          <div class="cal__row" id="cal-body"></div>
        </div>
      </div>
      <ul class="legend" aria-label="Keterangan warna">
        <li><i class="k"></i>Kuliah tetap</li>
        <li><i class="p"></i>Dipinjam, sudah disetujui</li>
        <li><i class="a"></i>Diajukan, menunggu admin</li>
      </ul>
      <p class="note" id="kabar" role="status" aria-live="polite"></p>
    </main>
  </div>

  <dialog id="dlg" aria-labelledby="dlg-judul">
    <h2 id="dlg-judul">Ajukan peminjaman</h2>
    <form class="form" id="form" data-endpoint="" novalidate>
      <div class="field wide"><label for="f-ruang">Ruang</label><select id="f-ruang" name="ruang"></select></div>
      <div class="field wide"><label for="f-tgl">Tanggal</label><input id="f-tgl" name="tanggal" type="date" required>
      </div>
      <div class="field"><label for="f-mulai">Mulai</label><select id="f-mulai" name="mulai"></select></div>
      <div class="field"><label for="f-selesai">Selesai</label><select id="f-selesai" name="selesai"></select></div>
      <div class="field wide"><label for="f-perlu">Keperluan</label><input id="f-perlu" name="keperluan" type="text"
          required></div>
      <div class="field wide" id="f-file-box" hidden><label for="f-file">Surat pengajuan (PDF, maksimal 2 MB)</label><input id="f-file" name="surat" type="file" accept=".pdf,application/pdf"></div>
<p class="note wide" id="f-surat" hidden>Peminjaman lapangan dan auditorium memerlukan surat pengajuan.</p>
      <p class="form__err" id="f-err" role="alert"></p>
      <div class="form__act">
        <button class="btn" type="button" id="f-batal">Batal</button>
        <button class="btn btn--primary" type="submit">Kirim pengajuan</button>
      </div>
    </form>
  </dialog>

  <?= boot_script($user) ?>
  <script src="../assets/js/data.js"></script>
  <script src="../assets/js/shell.js"></script>
  <script src="../assets/js/pages/ketersediaan.js"></script>
</body>

</html>