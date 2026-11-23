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
  <title>Barang Tersedia</title>
  <meta name="description"
    content="Daftar barang inventaris kampus yang masih tersedia. Peminjaman barang dilakukan langsung ke Sarpras.">
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
            <h1>Barang tersedia</h1>
            <p>Barang inventaris yang belum dipinjam dan bisa kamu ambil.</p>
          </div>
        </div>
      </header>

      <section class="well panel" aria-labelledby="info-h">
        <div class="panel__head">
          <h2 id="info-h">Cara meminjam barang</h2>
        </div>
        <p>Peminjaman barang inventaris tidak lewat sistem. Datang langsung ke Sarpras (admin) untuk meminjam, dan
          kembalikan ke sana juga.</p>
      </section>

      <section class="well panel" aria-labelledby="brg-h" style="margin-top: var(--space-md)">
        <div class="panel__head">
          <h2 id="brg-h">Daftar barang</h2><span class="note" id="brg-n"></span>
        </div>
        <div class="tablewrap" tabindex="0" role="region"
          aria-label="Tabel barang tersedia, geser ke samping bila layar sempit">
          <table>
            <thead>
              <tr>
                <th>Barang</th>
                <th class="act">Tersedia</th>
                <th class="act">Total</th>
              </tr>
            </thead>
            <tbody id="rows"></tbody>
          </table>
        </div>
      </section>
    </main>
  </div>

  <?= boot_script($user) ?>
  <script src="../assets/js/data.js"></script>
  <script src="../assets/js/shell.js"></script>
  <script src="../assets/js/pages/barang.js"></script>
</body>

</html>
