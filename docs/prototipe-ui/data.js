/* Data dummy bersama untuk semua halaman. Disimpan di localStorage browser agar
   pengajuan mahasiswa muncul di dashboard admin. Tidak ada server di sini. */
(() => {
  'use strict';
  const MIN0 = 420, MIN1 = 1080;
  const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const ME = 'Mahasiswa Contoh';
  const ROOMS = [
    { id: 'r101', name: 'R.101', type: 'kelas' }, { id: 'r102', name: 'R.102', type: 'kelas' }, { id: 'r103', name: 'R.103', type: 'kelas' },
    { id: 'lk1', name: 'Lab Komputer 1', type: 'lab' }, { id: 'lk2', name: 'Lab Komputer 2', type: 'lab' },
    { id: 'lap', name: 'Lapangan Serbaguna', type: 'lapangan' }, { id: 'aud', name: 'Auditorium', type: 'auditorium' }
  ];
  const TYPE_LABEL = { kelas: 'Ruang kelas', lab: 'Laboratorium', lapangan: 'Lapangan', auditorium: 'Auditorium' };
  /* lapangan dan auditorium memerlukan surat pengajuan */
  const needsLetter = (room) => room.type === 'lapangan' || room.type === 'auditorium';
  /* pesan kesalahan untuk berkas surat, atau null bila sudah benar. Hanya nama berkas yang disimpan di data contoh. */
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

  const K = (day, a, b, room, title) => ({ id: 'k' + Math.random().toString(36).slice(2, 8), day, s: tm(a), e: tm(b), room, title });
  const seed = () => {
    let n = 0;
    const B = (off, a, b, room, title, status, by, letter) => ({ id: 'b' + (++n), date: iso(addDays(thisMon, off)), s: tm(a), e: tm(b), room, title, status, by, ...(letter ? { letter } : {}) });
    return {
      seedMon: iso(thisMon),
      classes: [
        K(0, '07.30', '09.10', 'r101', 'Pemrograman Web'), K(0, '09.20', '11.00', 'lk1', 'Basis Data'), K(0, '13.00', '14.40', 'r102', 'Sistem Informasi Manajemen'),
        K(1, '07.30', '09.10', 'r103', 'Statistika'), K(1, '10.00', '11.40', 'lk2', 'Jaringan Komputer'),
        K(2, '08.00', '09.40', 'r101', 'Kapita Selekta'), K(2, '13.00', '14.40', 'lk1', 'Praktikum Pemrograman Web'),
        K(3, '09.20', '11.00', 'r102', 'Rekayasa Perangkat Lunak'), K(3, '13.00', '15.30', 'lk2', 'Praktikum Audit SI'),
        K(4, '08.00', '09.40', 'r103', 'Business Intelligence')
      ],
      bookings: [
        B(0, '13.00', '15.00', 'lk2', 'Latihan lomba pemrograman', 'disetujui', ME),
        B(1, '13.00', '15.00', 'r102', 'Rapat himpunan', 'disetujui', 'Himpunan Mahasiswa SI'),
        B(1, '13.00', '15.00', 'lk1', 'Pelatihan spreadsheet', 'disetujui', 'Panitia Pelatihan'),
        B(2, '10.00', '12.00', 'r103', 'Seminar proposal', 'disetujui', ME),
        B(2, '15.30', '17.30', 'lap', 'Latihan basket', 'disetujui', 'UKM Basket', 'surat-latihan-basket.pdf'),
        B(2, '15.00', '17.00', 'r102', 'Rapat pengurus', 'diajukan', 'BEM Fakultas'),
        B(3, '13.00', '15.00', 'r101', 'Diskusi kelompok', 'disetujui', 'Kelompok Riset'),
        B(3, '16.00', '18.00', 'lap', 'Futsal angkatan', 'diajukan', ME, 'surat-futsal-angkatan.pdf'),
        B(4, '07.00', '09.00', 'lap', 'Senam pagi', 'disetujui', 'UKM Senam', 'surat-senam-pagi.pdf'),
        B(5, '08.00', '11.00', 'lap', 'Turnamen voli antarkelas', 'diajukan', 'Panitia Turnamen', 'surat-turnamen-voli.pdf'),
        B(3, '08.00', '12.00', 'aud', 'Seminar nasional', 'disetujui', 'BEM Fakultas', 'surat-seminar-nasional.pdf'),
        B(4, '13.00', '16.00', 'aud', 'Wisuda internal', 'diajukan', 'Panitia Wisuda', 'surat-wisuda-internal.pdf'),
        B(-7, '13.00', '15.00', 'r101', 'Diskusi kelompok', 'selesai', ME),
        B(-6, '15.30', '17.30', 'lap', 'Latihan basket', 'ditolak', ME, 'surat-latihan-basket.pdf'),
        B(-5, '10.00', '12.00', 'lk1', 'Praktik mandiri', 'dibatalkan', ME),
        B(-4, '15.00', '17.00', 'lk2', 'Pengerjaan tugas akhir', 'terlambat', ME),
        B(-3, '09.00', '11.00', 'r103', 'Rapat panitia', 'selesai', 'Panitia Turnamen')
      ],
      items: [
        { id: 'i1', name: 'Proyektor', total: 4 }, { id: 'i2', name: 'Kabel HDMI', total: 6 }, { id: 'i3', name: 'Sound system portable', total: 2 },
        { id: 'i4', name: 'Mic wireless', total: 3 }, { id: 'i5', name: 'Laptop', total: 5 }, { id: 'i6', name: 'Terminal kabel roll', total: 6 },
        { id: 'i7', name: 'Papan tulis portable', total: 2 }, { id: 'i8', name: 'Bola basket', total: 4 }, { id: 'i9', name: 'Bola voli', total: 4 },
        { id: 'i10', name: 'Kursi lipat', total: 30 }
      ],
      loans: [
        { id: 'l1', item: 'i1', qty: 1, by: 'Himpunan Mahasiswa SI', date: iso(addDays(thisMon, 0)), status: 'keluar' },
        { id: 'l2', item: 'i3', qty: 1, by: 'UKM Basket', date: iso(addDays(thisMon, 0)), status: 'keluar' },
        { id: 'l3', item: 'i8', qty: 2, by: 'UKM Basket', date: iso(addDays(thisMon, 0)), status: 'keluar' },
        { id: 'l4', item: 'i10', qty: 10, by: 'Panitia Turnamen', date: iso(addDays(thisMon, 0)), status: 'keluar' },
        { id: 'l5', item: 'i5', qty: 2, by: 'Panitia Pelatihan', date: iso(addDays(thisMon, -3)), back: iso(addDays(thisMon, -1)), status: 'kembali' }
      ]
    };
  };

  const KEY = 'pk-demo-v1';
  let store = null;
  try { store = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { store = null; }
  if (!store || store.seedMon !== iso(thisMon)) store = seed();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); return true; } catch (e) { return false; /* tetap jalan di memori */ } };
  const reset = () => { store = seed(); save(); PK.store = store; };
  save();

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
  const out = (itemId) => PK.store.loans.filter((l) => l.item === itemId && l.status === 'keluar').reduce((a, l) => a + l.qty, 0);
  const readAsDataURL = (file) => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => no(r.error); r.readAsDataURL(file); });
  /* PDF contoh satu halaman untuk surat data awal, yang berkasnya tidak ada */
  function samplePdf(lines) {
    const t = (s) => String(s).replace(/[^\x20-\x7e]/g, '').replace(/[\\()]/g, '');
    const body = 'BT /F1 14 Tf 56 760 Td 20 TL ' + lines.map((l) => '(' + t(l) + ') Tj T*').join(' ') + ' ET';
    const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 5 0 R /Resources << /Font << /F1 4 0 R >> >> >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', '<< /Length ' + body.length + ' >>\nstream\n' + body + '\nendstream'];
    let out = '%PDF-1.4\n';
    const pos = [];
    objs.forEach((o, i) => { pos.push(out.length); out += (i + 1) + ' 0 obj\n' + o + '\nendobj\n'; });
    const x = out.length;
    out += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' + pos.map((p) => String(p).padStart(10, '0') + ' 00000 n \n').join('')
      + 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + x + '\n%%EOF';
    return new Blob([out], { type: 'application/pdf' });
  }
  /* berkas surat milik pengajuan: unggahan asli bila ada, selain itu PDF contoh */
  const letterBlob = async (b) => b.letterData
    ? (await fetch(b.letterData)).blob()
    : samplePdf(['Surat pengajuan peminjaman (contoh)', 'Berkas: ' + b.letter, 'Peminjam: ' + b.by, 'Ruang: ' + roomOf(b.room).name, 'Keperluan: ' + b.title, 'Tanggal: ' + b.date]);
  const tag = (st) => `<span class="tag ${STATUS[st][1]}">${STATUS[st][0]}</span>`;
  const when = (b) => fmtDate(parseISO(b.date), { weekday: 'short', day: 'numeric', month: 'short' }) + ', ' + fm(b.s) + '-' + fm(b.e);
  const nextId = () => 'b' + Math.random().toString(36).slice(2, 8);
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

  window.PK = { MIN0, MIN1, DAYS, ME, ROOMS, TYPE_LABEL, needsLetter, checkLetter, readAsDataURL, letterBlob, STATUS, tm, fm, pad, addDays, iso, parseISO, mondayOf, dowOf, esc, fmtDate, thisMon, todayISO, store, save, reset, itemsFor, blockers, roomOf, itemOf, out, tag, when, nextId, icon, BLOCKING };
})();
