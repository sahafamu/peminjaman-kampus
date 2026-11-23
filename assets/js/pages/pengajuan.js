(() => {
  'use strict';
  PKshell('mahasiswa');
  const { MIN0, MIN1, ROOMS, fm, esc, parseISO, iso, addDays, fmtDate, todayISO } = PK;
  const $ = (s) => document.querySelector(s);
  const hm = (m) => PK.pad(Math.floor(m / 60)) + ':' + PK.pad(m % 60);
  const toMin = (v) => { if (!/^\d{2}:\d{2}$/.test(v || '')) return null; const [h, m] = v.split(':').map(Number); return h * 60 + m; };

  $('#f-ruang').innerHTML = ROOMS.map((r) => `<option value="${r.id}">${esc(r.name)}</option>`).join('');
  $('#f-tgl').min = todayISO;

  const q = new URLSearchParams(location.search);
  const firstOpen = () => { let d = parseISO(todayISO); while (d.getDay() === 0) d = addDays(d, 1); return iso(d); };
  const reset = () => {
    $('#f-ruang').value = ROOMS.some((r) => r.id === q.get('ruang')) ? q.get('ruang') : 'r101';
    $('#f-tgl').value = q.get('tanggal') || firstOpen();
    $('#f-mulai').value = q.get('mulai') || '09:00'; $('#f-selesai').value = q.get('selesai') || '10:40';
    $('#f-perlu').value = ''; $('#f-file').value = '';
  };
  reset();

  /* membaca isian: kembalikan nilai atau pesan kesalahan */
  function read() {
    const room = $('#f-ruang').value, date = $('#f-tgl').value, s = toMin($('#f-mulai').value), e = toMin($('#f-selesai').value);
    return { room, date, s, e };
  }
  function problem(v) {
    if (!v.date) return 'Pilih tanggal.';
    if (v.date < todayISO) return 'Tanggal itu sudah lewat.';
    if (parseISO(v.date).getDay() === 0) return 'Kampus tidak melayani peminjaman hari Minggu.';
    if (v.s == null || v.e == null) return 'Isi jam mulai dan jam selesai.';
    if (v.s < MIN0 || v.e > MIN1) return 'Peminjaman hanya bisa antara ' + fm(MIN0) + ' dan ' + fm(MIN1) + '.';
    if (v.e <= v.s) return 'Jam selesai harus sesudah jam mulai.';
    return null;
  }

  let blocked = true;
  function check() {
    const v = read(), w = $('#warn'), room = PK.roomOf(v.room);
    $('#f-surat').hidden = $('#f-file-box').hidden = !PK.needsLetter(room);
    const bad = problem(v);
    w.removeAttribute('data-ok'); w.removeAttribute('data-idle');
    let hit = [];
    if (bad) { w.textContent = bad; blocked = true; }
    else {
      hit = PK.blockers(v.room, v.date, v.s, v.e);
      if (hit.length) {
        blocked = true;
        w.textContent = hit.map((h) => (h.kind === 'kuliah' ? 'Bentrok dengan jadwal kuliah: ' : 'Bentrok dengan peminjaman yang sudah disetujui: ') + h.title + ', ' + fm(h.s) + ' sampai ' + fm(h.e) + '.').join(' ');
      } else { blocked = false; w.setAttribute('data-ok', ''); w.textContent = 'Tidak bentrok. ' + room.name + ' kosong pada ' + fm(v.s) + ' sampai ' + fm(v.e) + '.'; }
    }
    $('#f-kirim').setAttribute('aria-disabled', String(blocked));
    $('#f-kirim').classList.toggle('is-blocked', blocked);
    [$('#f-mulai'), $('#f-selesai')].forEach((i) => (hit.length || (bad && v.s != null && v.e != null && v.e <= v.s)) ? i.setAttribute('aria-invalid', 'true') : i.removeAttribute('aria-invalid'));
    renderDay(v, hit.length > 0 || !!bad);
    return { v, bad, hit };
  }
  function renderDay(v, isBad) {
    const room = PK.roomOf(v.room);
    $('#j-sub').textContent = room.name + (v.date ? ', ' + fmtDate(parseISO(v.date), { weekday: 'long', day: 'numeric', month: 'short' }) : '');
    if (!v.date) { $('#jadwal').innerHTML = ''; return; }
    const its = PK.itemsFor(v.room, v.date, PK.dowOf(parseISO(v.date)));
    const rows = its.map((i) => ({ s: i.s, html: `<li><div><b>${esc(i.title)}</b><small class="fig">${fm(i.s)}-${fm(i.e)}</small></div>${i.kind === 'kuliah' ? '<span class="tag">Kuliah tetap</span>' : i.kind === 'pinjam' ? '<span class="tag tag--in">Dipinjam</span>' : '<span class="tag tag--out">Diajukan</span>'}</li>` }));
    if (v.s != null && v.e != null && v.e > v.s) rows.push({ s: v.s, html: `<li class="mine${isBad ? ' is-bad' : ''}"><div><b>Pilihanmu</b><small class="fig">${fm(v.s)}-${fm(v.e)}</small></div><span class="tag ${isBad ? 'tag--late' : 'tag--on'}">${isBad ? 'Bentrok' : 'Aman'}</span></li>` });
    rows.sort((a, b) => a.s - b.s);
    $('#jadwal').innerHTML = rows.length ? rows.map((r) => r.php).join('') : '<li><div class="note">Belum ada jadwal pada hari ini. Semua jam kosong.</div></li>';
  }

  ['f-ruang', 'f-tgl', 'f-mulai', 'f-selesai'].forEach((id) => { $('#' + id).addEventListener('input', check); $('#' + id).addEventListener('change', check); });
  $('#f-reset').addEventListener('click', () => setTimeout(() => { reset(); $('#f-err').textContent = ''; check(); }, 0));

  $('#form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const { v, bad, hit } = check(), perlu = $('#f-perlu'), err = $('#f-err');
    err.textContent = ''; perlu.removeAttribute('aria-invalid'); $('#f-file').removeAttribute('aria-invalid');
    if (bad) return (err.textContent = bad);
    if (hit.length) { err.textContent = 'Pengajuan tidak bisa dikirim selama masih bentrok. Ubah jam atau ruang.'; $('#f-mulai').focus(); return; }
    if (!perlu.value.trim()) { perlu.setAttribute('aria-invalid', 'true'); err.textContent = 'Tulis keperluan peminjaman.'; perlu.focus(); return; }
    const file = $('#f-file').files[0], lerr = PK.checkLetter(PK.roomOf(v.room), file);
    if (lerr) { $('#f-file').setAttribute('aria-invalid', 'true'); err.textContent = lerr; $('#f-file').focus(); return; }
    const withLetter = file && PK.needsLetter(PK.roomOf(v.room));
    const r = await PK.busy($('#f-kirim'), () => PK.api('ajukan', { room: v.room, date: v.date, s: v.s, e: v.e, title: perlu.value.trim() }, withLetter ? file : null));
    if (!r) return;
    if (!r.ok) { err.textContent = r.pesan; check(); return; }
    $('#form').hidden = true; $('#done').hidden = false;
    $('#done-msg').textContent = PK.roomOf(v.room).name + ', ' + fmtDate(parseISO(v.date), { weekday: 'long', day: 'numeric', month: 'long' }) + ', ' + fm(v.s) + ' sampai ' + fm(v.e) + '. Admin akan memeriksanya. Statusnya bisa kamu lihat di Dashboard.';
    $('#done h2').setAttribute('tabindex', '-1'); $('#done h2').focus();
    renderDay(v, false);
  });
  $('#lagi').addEventListener('click', () => { $('#done').hidden = true; $('#form').hidden = false; reset(); check(); $('#f-ruang').focus(); });

  check();
})();
