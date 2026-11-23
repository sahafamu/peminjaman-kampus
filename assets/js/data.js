/* Data dan aturan bersama untuk semua halaman. Data awal dikirim server lewat window.PK_BOOT;
   setiap perubahan dikirim ke api/aksi.php dan server membalas dengan data terbaru. */
(() => {
  'use strict';
  const BOOT = window.PK_BOOT || {};
  const MIN0 = 420, MIN1 = 1080;
  const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const USER = BOOT.user || { nama: '', role: '' };
  const ME = USER.nama;
  const ROOMS = BOOT.rooms || [];
  const TYPE_LABEL = { kelas: 'Ruang kelas', lab: 'Laboratorium', lapangan: 'Lapangan', auditorium: 'Auditorium' };
  /* lapangan dan auditorium memerlukan surat pengajuan */
  const needsLetter = (room) => room.type === 'lapangan' || room.type === 'auditorium';
  /* pesan kesalahan untuk berkas surat, atau null bila sudah benar. Server memeriksa ulang. */
  const checkLetter = (room, file) => {
    if (!needsLetter(room)) return null;
    if (!file) return 'Unggah surat pengajuan untuk ' + room.name + '.';
    if (!/\.pdf$/i.test(file.name)) return 'Surat harus berupa berkas PDF.';
    if (file.size > 2 * 1024 * 1024) return 'Ukuran surat maksimal 2 MB.';
    return null;
  };
  const STATUS = {
    diajukan: ['Diajukan', 'tag--out'], disetujui: ['Disetujui', 'tag--in'], ditolak: ['Ditolak', 'tag--no'],
    berjalan: ['Berjalan', 'tag--on'], selesai: ['Selesai', ''], dibatalkan: ['Dibatalkan', 'tag--no'], terlambat: ['Terlambat', 'tag--late']
  };
  const tm = (s) => { const [h, m] = s.split('.').map(Number); return h * 60 + m; };
  const fm = (m) => String(Math.floor(m / 60)).padStart(2, '0') + '.' + String(m % 60).padStart(2, '0');
  const pad = (n) => String(n).padStart(2, '0');
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const mondayOf = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); return addDays(x, -((x.getDay() + 6) % 7)); };
  const dowOf = (d) => (d.getDay() + 6) % 7;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = (d, o) => new Intl.DateTimeFormat('id-ID', o).format(d);
  const thisMon = mondayOf(new Date());
  const todayISO = iso(new Date());

  const BLOCKING = ['disetujui', 'berjalan'];
  const SHOWN = ['diajukan', 'disetujui', 'berjalan', 'terlambat', 'selesai'];
  function itemsFor(roomId, dateISO, dow, withPending = true) {
    const out = [];
    if (dow < 5) PK.store.classes.filter((c) => c.room === roomId && c.day === dow).forEach((c) => out.push({ s: c.s, e: c.e, title: c.title, kind: 'kuliah' }));
    PK.store.bookings.filter((b) => b.room === roomId && b.date === dateISO && SHOWN.includes(b.status)).forEach((b) => {
      if (b.status === 'diajukan') { if (withPending) out.push({ s: b.s, e: b.e, title: b.title, kind: 'ajuan' }); }
      else out.push({ s: b.s, e: b.e, title: b.title, kind: 'pinjam' });
    });
    return out.sort((a, b) => a.s - b.s);
  }
  function blockers(roomId, dateISO, s, e, ignoreId) {
    const dow = dowOf(parseISO(dateISO)), out = [];
    if (dow < 5) PK.store.classes.filter((c) => c.room === roomId && c.day === dow && s < c.e && e > c.s).forEach((c) => out.push({ title: c.title, s: c.s, e: c.e, kind: 'kuliah' }));
    PK.store.bookings.filter((b) => b.id !== ignoreId && b.room === roomId && b.date === dateISO && BLOCKING.includes(b.status) && s < b.e && e > b.s).forEach((b) => out.push({ title: b.title, s: b.s, e: b.e, kind: 'pinjam' }));
    return out;
  }
  const roomOf = (id) => ROOMS.find((r) => r.id === id) || { name: id, type: 'kelas' };
  const itemOf = (id) => PK.store.items.find((i) => i.id === id);
  /* jumlah barang yang sedang keluar, dihitung server */
  const out = (itemId) => (itemOf(itemId) || { out: 0 }).out;
  /* alamat surat pengajuan: dibuka di jendela, atau diunduh */
  const BASE = BOOT.base || '/';
  const letterURL = (b, download) => BASE + 'api/surat.php?id=' + encodeURIComponent(b.id) + (download ? '&unduh=1' : '');
  const tag = (st) => `<span class="tag ${STATUS[st][1]}">${STATUS[st][0]}</span>`;
  const when = (b) => fmtDate(parseISO(b.date), { weekday: 'short', day: 'numeric', month: 'short' }) + ', ' + fm(b.s) + '-' + fm(b.e);

  /* kirim aksi ke server. Hasil: { ok, pesan }. PK.store diganti dengan data terbaru dari server. */
  async function api(aksi, fields = {}, file = null) {
    const fd = new FormData();
    fd.append('aksi', aksi);
    Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append('surat', file);
    let res, body = null;
    try {
      res = await fetch(BASE + 'api/aksi.php', { method: 'POST', body: fd, credentials: 'same-origin', headers: { 'X-CSRF-Token': BOOT.csrf || '' } });
      body = await res.json().catch(() => null);
    } catch (e) {
      return { ok: false, pesan: 'Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.' };
    }
    if (res.status === 401) { location.href = BASE + 'auth/login.php?sesi=habis&lanjut=' + encodeURIComponent(location.pathname.slice(BASE.length) + location.search); return { ok: false, pesan: 'Sesi habis. Silakan masuk lagi.' }; }
    if (body && body.data) PK.store = body.data;
    return { ok: !!(body && body.ok), pesan: (body && body.pesan) || (res.ok ? '' : 'Terjadi kesalahan di server. Coba lagi.') };
  }
  /* tombol sibuk selama menunggu server, agar tidak terkirim dua kali */
  async function busy(btn, fn) {
    if (btn) { if (btn.getAttribute('aria-busy') === 'true') return null; btn.setAttribute('aria-busy', 'true'); btn.disabled = true; }
    try { return await fn(); } finally { if (btn && btn.isConnected) { btn.removeAttribute('aria-busy'); btn.disabled = false; } }
  }

  const ICONS = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    check: '<path d="M4 12.5 9.5 18 20 6.5"/>',
    book: '<path d="M4 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H4zM20 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7z"/>',
    box: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5zM3 7.5l9 4.5 9-4.5M12 12v9"/>',
    swap: '<path d="M7 7h13M16 3l4 4-4 4M17 17H4M8 13l-4 4 4 4"/>',
    chart: '<path d="M4 20V4M4 20h16M8 16v-5M13 16V8M18 16v-9"/>',
    plus: '<path d="M12 5v14M5 12h14"/>'
  };
  const icon = (n) => `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n]}</svg>`;

  window.PK = { BASE, MIN0, MIN1, DAYS, ME, USER, CSRF: BOOT.csrf, ROOMS, TYPE_LABEL, needsLetter, checkLetter, letterURL, STATUS, tm, fm, pad, addDays, iso, parseISO, mondayOf, dowOf, esc, fmtDate, thisMon, todayISO, store: BOOT.data || { classes: [], bookings: [], items: [] }, api, busy, itemsFor, blockers, roomOf, itemOf, out, tag, when, icon, BLOCKING };
})();
