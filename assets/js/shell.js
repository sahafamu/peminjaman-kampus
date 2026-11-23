/* Menu samping untuk tiap peran. Pemakaian: PKshell('admin' | 'mahasiswa'); tautan aktif dibaca dari alamat halaman. */
(() => {
  'use strict';
  const NAV = {
    mahasiswa: {
      title: 'Mahasiswa',
      items: [
        ['mahasiswa/', 'Dashboard', 'grid'],
        ['mahasiswa/ketersediaan.php', 'Cek ketersediaan', 'cal'],
        ['mahasiswa/pengajuan.php', 'Ajukan peminjaman', 'plus'],
        ['mahasiswa/barang.php', 'Barang tersedia', 'box'],
        ['mahasiswa/#riwayat', 'Status dan riwayat', 'clock']
      ]
    },
    admin: {
      title: 'Admin', home: '#ringkasan',
      items: [
        ['admin/#ringkasan', 'Ringkasan', 'grid'],
        ['admin/#persetujuan', 'Persetujuan', 'check'],
        ['admin/#jadwal', 'Jadwal tetap', 'book'],
        ['admin/#inventaris', 'Inventaris barang', 'box'],
        ['admin/#barang', 'Barang keluar dan kembali', 'swap'],
        ['admin/#laporan', 'Laporan', 'chart']
      ]
    }
  };
  /* halaman yang dibuka lagi lewat tombol Back dari cache browser dimuat ulang,
     agar server memeriksa login lagi (sesudah keluar, server mengarahkan ke halaman masuk) */
  window.addEventListener('pageshow', (e) => { if (e.persisted) location.reload(); });

  window.PKshell = (role) => {
    const cfg = NAV[role], side = document.getElementById('side'), esc = PK.esc, B = PK.BASE;
    const id = PK.USER.nim ? 'NIM ' + PK.USER.nim : PK.USER.username;
    side.innerHTML = `<a class="brand" href="${B}" style="text-decoration:none"><b>Peminjaman Kampus</b><span>${cfg.title}</span></a>
      <nav aria-label="Menu utama"><ul>${cfg.items.map(([href, label, ic]) => `<li><a href="${B + href}" data-nav>${PK.icon(ic)}<span>${label}</span>${href.endsWith('#persetujuan') ? '<span class="count" id="nav-count" hidden></span>' : ''}</a></li>`).join('')}</ul></nav>
      <div class="side__foot"><div class="who"><b>${esc(PK.USER.nama)}</b><span>${cfg.title}, ${esc(id)}</span></div>
        <a href="${B}">Beranda</a>
        <form method="post" action="${B}auth/logout.php"><input type="hidden" name="csrf" value="${esc(PK.CSRF || '')}"><button class="linkish" type="submit">Keluar</button></form></div>`;
    const scrim = document.createElement('div'); scrim.className = 'scrim'; document.body.appendChild(scrim);
    const btn = document.getElementById('menu-btn');
    const set = (o) => { side.toggleAttribute('data-open', o); scrim.toggleAttribute('data-open', o); if (btn) btn.setAttribute('aria-expanded', String(o)); };
    if (btn) btn.addEventListener('click', () => set(!side.hasAttribute('data-open')));
    scrim.addEventListener('click', () => set(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
    side.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
    /* menu aktif: halaman yang sama; bila ada beberapa, yang #bagian-nya cocok, selain itu yang tanpa #bagian */
    const norm = (p) => p.replace(/index\.php$/, '');
    const mark = () => {
      const here = norm(location.pathname), hash = location.hash || cfg.home || '';
      const links = [...side.querySelectorAll('[data-nav]')];
      links.forEach((a) => a.removeAttribute('aria-current'));
      const same = links.filter((a) => norm(new URL(a.href).pathname) === here);
      const best = same.find((a) => new URL(a.href).hash === hash) || same.find((a) => !new URL(a.href).hash);
      if (best) best.setAttribute('aria-current', 'page');
    };
    mark(); window.addEventListener('hashchange', mark);
    window.PKnavCount = () => {
      const c = document.getElementById('nav-count'); if (!c) return;
      const n = PK.store.bookings.filter((b) => b.status === 'diajukan').length;
      c.textContent = n; c.hidden = !n;
    };
    window.PKnavCount();
  };
})();
