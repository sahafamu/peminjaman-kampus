<?php
/* Beranda: bisa dibuka tanpa login. Menampilkan ruang kosong, papan ketersediaan, cara meminjam, dan stok barang. */
declare(strict_types=1);
require __DIR__ . '/app/bootstrap.php';
require __DIR__ . '/app/rules.php';

no_cache();
$user = current_user();
$public = public_state(14);
$public['base'] = base_url();
$public['user'] = $user ? ['nama' => $user['nama'], 'role' => $user['role'], 'home' => home_for($user)] : null;
?>
<!doctype html>
<html lang="id">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Peminjaman Ruang Kampus</title>
  <meta name="description"
    content="Lihat ruang kelas, laboratorium, lapangan, dan auditorium yang kosong, lalu ajukan peminjaman langsung dari papan ketersediaan.">
  <link
    href="https://fonts.googleapis.com/css2?family=Epilogue:wght@400;600;700&family=IBM+Plex+Mono:wght@400&display=swap"
    rel="stylesheet">
  <link rel="stylesheet" href="assets/css/app.css">
  <link rel="stylesheet" href="assets/css/beranda.css">
</head>

<body class="home">
  <a class="skip" href="#cek">Langsung ke papan ketersediaan</a>
  <header class="site">
    <div class="wrap site__bar">
      <a class="brand" href="./" style="padding:0;text-decoration:none"><b>Peminjaman Kampus</b><span>Sarpras</span></a>
      <nav class="site__nav" aria-label="Bagian halaman">
        <a href="#cek">Cek ruang</a><a href="#cara">Cara meminjam</a><a href="#barang">Barang</a>
      </nav>
      <div class="site__act">
        <?php if ($user): ?>
          <span class="note site__who"><?= e($user['nama']) ?></span>
          <a class="btn btn--primary" href="<?= e(home_for($user)) ?>">Ke dashboard</a>
        <?php else: ?>
          <a class="btn" href="auth/daftar.php">Daftar</a>
          <a class="btn btn--primary" href="auth/login.php">Masuk</a>
        <?php endif; ?>
      </div>
    </div>
  </header>

  <main>
    <section class="wrap hero" aria-labelledby="hero-h">
      <div class="hero__text">
        <h1 id="hero-h">Lihat ruang yang kosong sebelum mengajukan peminjaman.</h1>
        <p class="hero__lead">Jadwal kuliah, peminjaman yang sudah disetujui, dan pengajuan yang masih menunggu
          ada di satu papan. Pilih hari dan jamnya, lalu ajukan ruang yang kosong dari sini.</p>
        <div class="hero__cta">
          <a class="btn btn--primary" href="#cek">Cek ruang kosong</a>
          <?php if (!$user): ?><a class="btn" href="auth/login.php">Masuk dengan NIM</a><?php endif; ?>
        </div>
        <ul class="hero__facts">
          <li><b class="fig">07.00-18.00</b><span>Senin sampai Sabtu</span></li>
          <li><b id="fact-rooms" class="fig">-</b><span>ruang bisa dipinjam</span></li>
          <li><b>PDF</b><span>surat untuk lapangan dan auditorium</span></li>
        </ul>
      </div>
      <section class="well panel now" aria-labelledby="now-h">
        <div class="panel__head">
          <h2 id="now-h">Ruang kosong sekarang</h2><span class="note fig" id="now-when"></span>
        </div>
        <p class="now__big"><b id="now-free" class="fig">-</b> <span id="now-of"></span></p>
        <ul class="list" id="now-list"></ul>
      </section>
    </section>

    <section class="wrap block" id="cek" aria-labelledby="cek-h">
      <div class="block__head">
        <h2 id="cek-h">Cek ketersediaan</h2>
        <p>Pilih hari, jenis ruang, dan jam. Klik baris ruang untuk memindah jam mulai.</p>
      </div>

      <div class="well panel">
        <div class="filters">
          <fieldset class="chips" id="days">
            <legend class="lab">Hari</legend>
          </fieldset>
          <div class="field filters__date"><label for="tgl">Tanggal lain</label><input type="date" id="tgl"></div>
        </div>
        <div class="filters">
          <fieldset class="seg" id="jenis">
            <legend class="visually-hidden">Jenis ruang</legend>
            <input type="radio" name="jenis" id="t-semua" value="semua" checked><label for="t-semua">Semua</label>
            <input type="radio" name="jenis" id="t-kelas" value="kelas"><label for="t-kelas">Kelas</label>
            <input type="radio" name="jenis" id="t-lab" value="lab"><label for="t-lab">Lab</label>
            <input type="radio" name="jenis" id="t-lapangan" value="lapangan"><label for="t-lapangan">Lapangan</label>
            <input type="radio" name="jenis" id="t-auditorium" value="auditorium"><label for="t-auditorium">Auditorium</label>
          </fieldset>
          <div class="filters__time">
            <div class="field"><label for="mulai">Mulai</label><select id="mulai"></select></div>
            <div class="field"><label for="selesai">Selesai</label><select id="selesai"></select></div>
          </div>
        </div>

        <p class="summary" id="summary" role="status" aria-live="polite"></p>

        <div class="boardwrap" tabindex="0" role="region" aria-label="Papan ketersediaan ruang, geser ke samping bila layar sempit">
          <div class="board" id="board"></div>
        </div>
        <ul class="legend" aria-label="Keterangan warna">
          <li><i class="k"></i>Kuliah tetap</li>
          <li><i class="p"></i>Dipinjam, sudah disetujui</li>
          <li><i class="a"></i>Diajukan, menunggu admin</li>
          <li><i class="s"></i>Jam pilihanmu</li>
        </ul>
      </div>
    </section>

    <section class="wrap block" id="cara" aria-labelledby="cara-h">
      <div class="block__head">
        <h2 id="cara-h">Cara meminjam ruang</h2>
        <p>Semua peminjaman ruang perlu persetujuan Sarpras.</p>
      </div>
      <ol class="steps">
        <li class="well panel"><span class="steps__n fig">1</span><h3>Cek jam kosong</h3>
          <p>Pakai papan di atas. Jam yang bentrok dengan kuliah atau peminjaman yang sudah disetujui tidak bisa diajukan.</p></li>
        <li class="well panel"><span class="steps__n fig">2</span><h3>Ajukan</h3>
          <p>Masuk dengan NIM, isi keperluan. Lapangan dan auditorium wajib menyertakan surat pengajuan PDF, maksimal 2 MB.</p></li>
        <li class="well panel"><span class="steps__n fig">3</span><h3>Tunggu persetujuan</h3>
          <p>Sarpras memeriksa bentrok dan surat. Status ada di dashboard, dan pengajuan bisa dibatalkan sebelum jamnya dimulai.</p></li>
      </ol>
      <div class="well panel rules">
        <h3>Aturan singkat</h3>
        <ul>
          <li>Peminjaman hanya Senin sampai Sabtu, pukul 07.00 sampai 18.00, dan tidak untuk tanggal yang sudah lewat.</li>
          <li>Ruang tidak bisa dipinjam saat ada jadwal kuliah tetap.</li>
          <li>Peminjaman yang mulai tepat saat peminjaman lain selesai tidak dianggap bentrok.</li>
        </ul>
      </div>
    </section>

    <section class="wrap block" id="barang" aria-labelledby="barang-h">
      <div class="block__head">
        <h2 id="barang-h">Barang inventaris</h2>
        <p>Barang tidak dipinjam lewat sistem. Datang langsung ke Sarpras untuk meminjam, dan kembalikan ke sana juga.</p>
      </div>
      <ul class="items" id="items"></ul>
    </section>
  </main>

  <footer class="wrap foot">
    <span>Peminjaman Kampus, dikelola Sarpras.</span>
    <span><?php if ($user): ?><a href="<?= e(home_for($user)) ?>">Ke dashboard</a><?php else: ?><a href="auth/login.php">Masuk</a> · <a href="auth/daftar.php">Daftar akun mahasiswa</a><?php endif; ?></span>
  </footer>

  <script>window.PK_PUBLIC = <?= json_for_script($public) ?>;</script>
  <script src="assets/js/pages/beranda.js"></script>
</body>

</html>
