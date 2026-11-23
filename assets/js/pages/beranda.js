/* Beranda: ruang kosong sekarang, papan ketersediaan dengan filter hari, jenis, dan jam, serta stok barang.
   Data dari window.PK_PUBLIC (tanpa nama dan keperluan peminjam). */
(() => {
  'use strict';
  const D = window.PK_PUBLIC;
  const MIN0 = 420, MIN1 = 1080, SPAN = MIN1 - MIN0;
  const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const TYPE = { kelas: 'Ruang kelas', lab: 'Laboratorium', lapangan: 'Lapangan', auditorium: 'Auditorium' };
  const $ = (s) => document.querySelector(s);
  const pad = (n) => String(n).padStart(2, '0');
  const fm = (m) => pad(Math.floor(m / 60)) + '.' + pad(m % 60);
  const hm = (m) => pad(Math.floor(m / 60)) + ':' + pad(m % 60);
  const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const dowOf = (s) => (parseISO(s).getDay() + 6) % 7;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = (s, o) => new Intl.DateTimeFormat('id-ID', o).format(parseISO(s));
  const pct = (m) => ((m - MIN0) / SPAN * 100).toFixed(3) + '%';
  const needsLetter = (r) => r.type === 'lapangan' || r.type === 'auditorium';
  const nowMin = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
  const today = () => iso(new Date());

  /* jam terpakai satu ruang pada satu tanggal: kuliah tetap, peminjaman disetujui, dan pengajuan */
  function busy(roomId, date) {
    const dow = dowOf(date), out = [];
    if (dow < 5) D.classes.filter((c) => c.room === roomId && c.day === dow).forEach((c) => out.push({ s: c.s, e: c.e, kind: 'kuliah', title: c.title }));
    D.bookings.filter((b) => b.room === roomId && b.date === date).forEach((b) => out.push({ s: b.s, e: b.e, kind: b.kind, title: b.kind === 'pinjam' ? 'Dipinjam' : 'Diajukan' }));
    return out.sort((a, b) => a.s - b.s);
  }

  /* tautan ajukan: langsung ke form bila sudah masuk sebagai mahasiswa, lewat halaman masuk bila belum */
  function applyHref(room, date, s, e) {
    const target = `mahasiswa/pengajuan.php?ruang=${encodeURIComponent(room)}&tanggal=${date}&mulai=${hm(s)}&selesai=${hm(e)}`;
    if (D.user && D.user.role === 'mahasiswa') return D.base + target;
    return D.base + 'auth/login.php?lanjut=' + encodeURIComponent(target);
  }
  const canApply = !D.user || D.user.role === 'mahasiswa';

  /* ---------- ruang kosong sekarang ---------- */
  function renderNow() {
    let date = today(), m = nowMin(), label = 'Pukul ' + fm(m);
    if (dowOf(date) === 6 || m >= MIN1) {
      let d = addDays(new Date(), 1); while ((d.getDay() + 6) % 7 === 6) d = addDays(d, 1);
      date = iso(d); m = MIN0; label = DAYS[dowOf(date)] + ' ' + fm(MIN0);
      $('#now-h').textContent = 'Ruang kosong saat buka';
    } else if (m < MIN0) { m = MIN0; label = 'Buka ' + fm(MIN0); $('#now-h').textContent = 'Ruang kosong saat buka'; }
    let free = 0;
    $('#now-list').innerHTML = D.rooms.map((r) => {
      const its = busy(r.id, date).filter((i) => i.kind !== 'ajuan'), cur = its.find((i) => m >= i.s && m < i.e);
      if (!cur) free++;
      const tag = cur
        ? `<span class="tag tag--out">${cur.kind === 'kuliah' ? 'Kuliah' : 'Dipinjam'} sampai ${fm(cur.e)}</span>`
        : `<span class="tag tag--in">Kosong sampai ${fm((its.find((i) => i.s > m) || { s: MIN1 }).s)}</span>`;
      return `<li><b>${esc(r.name)}</b>${tag}</li>`;
    }).join('');
    $('#now-when').textContent = label;
    $('#now-free').textContent = free;
    $('#now-of').textContent = 'dari ' + D.rooms.length + ' ruang kosong';
  }

  /* ---------- papan ketersediaan ---------- */
  const state = { date: '', type: 'semua', s: 0, e: 0 };
  const openDays = () => {
    const out = []; let d = parseISO(D.today);
    while (out.length < 6) { if ((d.getDay() + 6) % 7 !== 6) out.push(iso(d)); d = addDays(d, 1); }
    return out;
  };
  const days = openDays();
  const dayLabel = (s) => s === today() ? 'Hari ini' : s === iso(addDays(new Date(), 1)) ? 'Besok' : fmtDate(s, { weekday: 'short', day: 'numeric', month: 'short' });

  function renderDays() {
    $('#days').innerHTML = '<legend class="lab">Hari</legend>' + days.map((d, i) => `<input type="radio" name="hari" id="d-${i}" value="${d}"${d === state.date ? ' checked' : ''}><label for="d-${i}">${esc(dayLabel(d))}</label>`).join('');
    $('#tgl').value = days.includes(state.date) ? '' : state.date;
  }

  function timeOptions() {
    let a = '', b = '';
    for (let m = MIN0; m < MIN1; m += 30) a += `<option value="${m}">${fm(m)}</option>`;
    for (let m = MIN0 + 30; m <= MIN1; m += 30) b += `<option value="${m}">${fm(m)}</option>`;
    $('#mulai').innerHTML = a; $('#selesai').innerHTML = b;
  }

  /* pilihan awal: hari buka terdekat, mulai di setengah jam berikutnya, 1,5 jam */
  function initial() {
    state.date = days[0];
    let s = MIN0 + 60;
    if (state.date === today()) {
      const n = Math.ceil(nowMin() / 30) * 30;
      if (n >= MIN1 - 30) { state.date = days[1]; } else s = Math.max(MIN0, n);
    }
    state.s = s; state.e = Math.min(MIN1, s + 90);
  }

  /* masalah pada pilihan hari atau jam, atau null */
  function problem() {
    if (!state.date) return 'Pilih hari.';
    if (state.date < today()) return 'Tanggal itu sudah lewat.';
    if (state.date > D.until) return 'Papan ini menampilkan sampai ' + fmtDate(D.until, { day: 'numeric', month: 'long' }) + '. Masuk untuk melihat minggu berikutnya.';
    if (dowOf(state.date) === 6) return 'Kampus tidak melayani peminjaman hari Minggu.';
    if (state.e <= state.s) return 'Jam selesai harus sesudah jam mulai.';
    if (state.date === today() && state.s < nowMin()) return 'Jam mulai ' + fm(state.s) + ' hari ini sudah lewat.';
    return null;
  }

  function renderBoard() {
    $('#mulai').value = state.s; $('#selesai').value = state.e;
    const rooms = D.rooms.filter((r) => state.type === 'semua' || r.type === state.type);
    const bad = problem(), closed = dowOf(state.date) === 6 || state.date < today() || state.date > D.until;
    let ticks = '';
    for (let h = 7; h <= 18; h++) ticks += `<span style="left:${pct(h * 60)}">${pad(h)}</span>`;
    let free = 0;
    const rows = rooms.map((r) => {
      const its = closed ? [] : busy(r.id, state.date);
      const hit = its.filter((i) => i.kind !== 'ajuan' && state.s < i.e && state.e > i.s);
      const pend = its.filter((i) => i.kind === 'ajuan' && state.s < i.e && state.e > i.s);
      const ok = !bad && !hit.length;
      if (ok) free++;
      const blocks = its.map((i) => `<div class="blk blk--${i.kind}" style="left:${pct(i.s)};width:calc(${pct(i.e)} - ${pct(i.s)})" title="${esc(i.title + ', ' + fm(i.s) + '-' + fm(i.e))}">${esc(i.title)}</div>`).join('');
      const pick = !bad || state.e > state.s ? `<div class="pick${ok ? '' : ' is-bad'}" style="left:${pct(state.s)};width:calc(${pct(Math.max(state.e, state.s))} - ${pct(state.s)})"></div>` : '';
      let act;
      if (closed) act = '<span class="tag tag--no">Tutup</span>';
      else if (hit.length) act = `<span class="tag tag--late">${esc(hit[0].kind === 'kuliah' ? 'Kuliah: ' + hit[0].title : 'Sudah dipinjam')}, ${fm(hit[0].s)}-${fm(hit[0].e)}</span>`;
      else if (bad) act = '<span class="tag">Ubah pilihan jam</span>';
      else act = (pend.length ? '<span class="tag tag--out" title="Pengajuan lain di jam ini belum diputuskan admin">Ada pengajuan lain</span>' : '<span class="tag tag--in">Kosong</span>')
        + (canApply ? `<a class="btn btn--sm btn--primary" href="${esc(applyHref(r.id, state.date, state.s, state.e))}" aria-label="Ajukan ${esc(r.name)}, ${fm(state.s)} sampai ${fm(state.e)}">Ajukan</a>` : '');
      return `<div class="board__row"><div class="board__room"><b>${esc(r.name)}</b><small>${TYPE[r.type]}${needsLetter(r) ? ', perlu surat' : ''}</small></div>
        <div class="track${closed ? ' is-closed' : ''}" data-room="${r.id}" aria-hidden="true">${blocks}${pick}</div><div class="board__act">${act}</div></div>`;
    }).join('');
    $('#board').innerHTML = `<div class="board__row board__row--head"><span class="lab">Ruang</span><div class="ticks fig">${ticks}</div><span class="lab" style="text-align:right">Status</span></div>`
      + (rows || '<div class="empty"><p>Tidak ada ruang untuk jenis ini.</p></div>');
    const sum = $('#summary');
    sum.classList.toggle('is-err', !!bad);
    sum.innerHTML = bad ? esc(bad)
      : `<b>${free} dari ${rooms.length} ruang</b> kosong pada ${esc(fmtDate(state.date, { weekday: 'long', day: 'numeric', month: 'long' }))}, ${fm(state.s)} sampai ${fm(state.e)}.`
        + (canApply ? '' : ' Pengajuan dibuat dari akun mahasiswa.');
  }

  /* ---------- barang ---------- */
  function renderItems() {
    $('#items').innerHTML = D.items.map((i) => `<li><b>${esc(i.name)}</b>${i.free > 0 ? `<span class="tag tag--in">${i.free} dari ${i.total}</span>` : '<span class="tag tag--out">Sedang habis</span>'}</li>`).join('')
      || '<li><span class="note">Belum ada data barang.</span></li>';
  }

  /* ---------- interaksi ---------- */
  $('#days').addEventListener('change', (e) => { if (e.target.name === 'hari') { state.date = e.target.value; $('#tgl').value = ''; renderBoard(); } });
  $('#tgl').addEventListener('change', (e) => { if (!e.target.value) return; state.date = e.target.value; renderDays(); renderBoard(); });
  $('#jenis').addEventListener('change', (e) => { state.type = e.target.value; renderBoard(); });
  $('#mulai').addEventListener('change', (e) => {
    const len = state.e - state.s; state.s = +e.target.value;
    state.e = Math.min(MIN1, state.s + (len > 0 ? len : 90)); renderBoard();
  });
  $('#selesai').addEventListener('change', (e) => { state.e = +e.target.value; renderBoard(); });
  /* klik di baris ruang: pindahkan jam mulai ke setengah jam terdekat, durasi tetap */
  $('#board').addEventListener('click', (e) => {
    const t = e.target.closest('.track'); if (!t || t.classList.contains('is-closed')) return;
    const r = t.getBoundingClientRect(), raw = MIN0 + (e.clientX - r.left) / r.width * SPAN;
    const len = Math.max(30, state.e - state.s);
    state.s = Math.max(MIN0, Math.min(MIN1 - 30, Math.floor(raw / 30) * 30));
    state.e = Math.min(MIN1, state.s + len);
    renderBoard();
  });

  $('#tgl').min = D.today; $('#tgl').max = D.until;
  $('#fact-rooms').textContent = D.rooms.length;
  timeOptions(); initial(); renderDays(); renderBoard(); renderItems(); renderNow();
  setInterval(renderNow, 60000);
  /* dibuka lagi lewat tombol Back: muat ulang agar tombol Masuk/Ke dashboard sesuai status login */
  window.addEventListener('pageshow', (e) => { if (e.persisted) location.reload(); });
})();
