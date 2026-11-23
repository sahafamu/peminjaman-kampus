/* Menu samping untuk dua peran. Pemakaian: PKshell('admin' | 'mahasiswa'); tautan aktif dibaca dari alamat halaman. */
(() => {
  'use strict';
  const NAV = {
    mahasiswa: {
      title: 'Mahasiswa', who: PK.ME,
      other: ['admin-dashboard.html', 'Tampilan Admin'],
      items: [
        ['mahasiswa-dashboard.html', 'Dashboard', 'grid'],
        ['mahasiswa-ketersediaan.html', 'Cek ketersediaan', 'cal'],
        ['mahasiswa-pengajuan.html', 'Ajukan peminjaman', 'plus'],
        ['mahasiswa-barang.html', 'Barang tersedia', 'box'],
        ['mahasiswa-dashboard.html#riwayat', 'Status dan riwayat', 'clock']
      ]
    },
    admin: {
      title: 'Admin', who: 'Admin Contoh',
      other: ['mahasiswa-dashboard.html', 'Tampilan Mahasiswa'],
      items: [
        ['admin-dashboard.html#ringkasan', 'Ringkasan', 'grid'],
        ['admin-dashboard.html#persetujuan', 'Persetujuan', 'check'],
        ['admin-dashboard.html#jadwal', 'Jadwal tetap', 'book'],
        ['admin-dashboard.html#inventaris', 'Inventaris barang', 'box'],
        ['admin-dashboard.html#barang', 'Barang keluar dan kembali', 'swap'],
        ['admin-dashboard.html#laporan', 'Laporan', 'chart']
      ]
    }
  };
  window.PKshell = (role) => {
    const cfg = NAV[role], side = document.getElementById('side');
    side.innerHTML = `<div class="brand"><b>Peminjaman Kampus</b><span>${cfg.title}</span></div>
      <nav aria-label="Menu utama"><ul>${cfg.items.map(([href, label, ic]) => `<li><a href="${href}" data-nav="${href}">${PK.icon(ic)}<span>${label}</span>${href.endsWith('#persetujuan') ? '<span class="count" id="nav-count" hidden></span>' : ''}</a></li>`).join('')}</ul></nav>
      <div class="side__foot"><div class="who"><b>${cfg.who}</b><span>${cfg.title}, akun contoh</span></div><a href="${cfg.other[0]}">${cfg.other[1]}</a></div>`;
    const scrim = document.createElement('div'); scrim.className = 'scrim'; document.body.appendChild(scrim);
    const btn = document.getElementById('menu-btn');
    const set = (o) => { side.toggleAttribute('data-open', o); scrim.toggleAttribute('data-open', o); if (btn) btn.setAttribute('aria-expanded', String(o)); };
    if (btn) btn.addEventListener('click', () => set(!side.hasAttribute('data-open')));
    scrim.addEventListener('click', () => set(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
    side.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
    const mark = () => {
      const file = location.pathname.split('/').pop() || '', hash = location.hash || (file === 'admin-dashboard.html' ? '#ringkasan' : ''), q = location.search;
      let best = null;
      side.querySelectorAll('[data-nav]').forEach((a) => {
        const [h, frag] = a.dataset.nav.split('#'); const [f, qs] = h.split('?');
        a.removeAttribute('aria-current');
        if (f !== file) return;
        if (qs && !q.includes(qs)) return;
        if (!qs && q.includes('ajukan=1') && file === 'mahasiswa-ketersediaan.html') return;
        if (frag) { if (('#' + frag) === hash) best = a; }
        else if (!best && !(file === 'admin-dashboard.html') && !(file === 'mahasiswa-dashboard.html' && hash === '#riwayat')) best = a;
        else if (!best && file === 'admin-dashboard.html' && !hash) best = a;
      });
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
