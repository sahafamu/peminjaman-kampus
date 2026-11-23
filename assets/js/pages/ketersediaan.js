(() => {
  'use strict';
  PKshell('mahasiswa');
  const { MIN0, MIN1, DAYS, ROOMS, TYPE_LABEL, fm, pad, addDays, iso, parseISO, mondayOf, esc, fmtDate, thisMon, todayISO } = PK;
  const state = { type: 'semua', room: 'r101', week: thisMon };
  const $ = (s) => document.querySelector(s);

  function renderRooms() {
    const list = ROOMS.filter((r) => state.type === 'semua' || r.type === state.type);
    if (!list.some((r) => r.id === state.room)) state.room = list[0].id;
    $('#rooms').innerHTML = '<legend class="visually-hidden">Ruang</legend>' + list.map((r) => `<input type="radio" name="ruang-pilih" id="rc-${r.id}" value="${r.id}"${r.id === state.room ? ' checked' : ''}><label for="rc-${r.id}">${esc(r.name)}</label>`).join('');
  }
  function renderCal() {
    const room = PK.roomOf(state.room), mon = state.week;
    $('#room-name').textContent = room.name;
    $('#room-sub').textContent = TYPE_LABEL[room.type];
    $('#week-label').textContent = fmtDate(mon, { day: 'numeric', month: 'short' }) + ' sampai ' + fmtDate(addDays(mon, 5), { day: 'numeric', month: 'short', year: 'numeric' });
    $('#jump').value = iso(mon);
    let head = '<div></div>', cols = '', axis = '<div class="axis fig">';
    for (let h = 7; h <= 17; h++) axis += `<span style="top:${(h - 7) * 48}px">${pad(h)}.00</span>`;
    axis += '</div>';
    for (let i = 0; i < 6; i++) {
      const d = addDays(mon, i), di = iso(d), past = di < todayISO;
      head += `<div${di === todayISO ? ' class="today"' : ''}><b>${DAYS[i]}</b><span class="fig">${fmtDate(d, { day: 'numeric', month: 'short' })}</span></div>`;
      const evs = PK.itemsFor(room.id, di, i).map((it) => {
        const top = (it.s - MIN0) / (MIN1 - MIN0) * 100, h = (it.e - it.s) / (MIN1 - MIN0) * 100;
        const tg = it.kind === 'kuliah' ? 'Kuliah tetap' : it.kind === 'pinjam' ? 'Dipinjam' : 'Menunggu admin';
        return `<div class="ev ev--${it.kind}" style="top:${top}%;height:${h}%" aria-label="${esc(tg + ', ' + it.title + ', ' + fm(it.s) + ' sampai ' + fm(it.e))}"><b>${esc(it.title)}</b><span>${fm(it.s)}-${fm(it.e)}</span></div>`;
      }).join('');
      cols += `<div class="col${past ? ' col--past' : ''}" data-i="${i}" data-date="${di}" role="group" aria-label="${DAYS[i]}, ${fmtDate(d, { day: 'numeric', month: 'long' })}">${evs}</div>`;
    }
    $('#cal-days').innerHTML = head;
    $('#cal-body').innerHTML = axis + cols;
  }
  function renderAll() { renderRooms(); renderCal(); }
  function say(msg, err) { const k = $('#kabar'); k.textContent = msg; k.classList.toggle('is-err', !!err); }

  const body = $('#cal-body');
  let ghost;
  const slotAt = (col, y) => { const r = col.getBoundingClientRect(); const raw = MIN0 + (y - r.top) / r.height * (MIN1 - MIN0); return Math.max(MIN0, Math.min(MIN1 - 30, Math.floor(raw / 30) * 30)); };
  body.addEventListener('mousemove', (e) => {
    const col = e.target.closest('.col');
    if (!col || col.classList.contains('col--past')) { if (ghost) ghost.remove(); ghost = null; return; }
    const s = slotAt(col, e.clientY);
    if (!ghost) { ghost = document.createElement('div'); ghost.className = 'ghost fig'; }
    if (ghost.parentNode !== col) col.appendChild(ghost);
    ghost.style.top = ((s - MIN0) / (MIN1 - MIN0) * 100) + '%';
    ghost.style.height = (Math.min(90, MIN1 - s) / (MIN1 - MIN0) * 100) + '%';
    ghost.textContent = 'Ajukan ' + fm(s);
  });
  body.addEventListener('mouseleave', () => { if (ghost) ghost.remove(); ghost = null; });
  body.addEventListener('click', (e) => {
    const col = e.target.closest('.col'); if (!col) return;
    if (col.classList.contains('col--past')) { say('Tanggal itu sudah lewat. Pilih hari ini atau sesudahnya.', true); return; }
    const s = slotAt(col, e.clientY), en = Math.min(MIN1, s + 90);
    const hit = PK.itemsFor(state.room, col.dataset.date, +col.dataset.i, false).find((i) => s >= i.s && s < i.e);
    if (hit) { say('Jam ' + fm(s) + ' sudah terpakai: ' + hit.title + ', ' + fm(hit.s) + ' sampai ' + fm(hit.e) + '.', true); return; }
    openForm({ room: state.room, date: col.dataset.date, s, e: en });
  });

  $('#seg-jenis').addEventListener('change', (e) => { state.type = e.target.value; renderAll(); say('Menampilkan ' + (state.type === 'semua' ? 'semua ruang' : TYPE_LABEL[state.type].toLowerCase()) + '.'); });
  $('#rooms').addEventListener('change', (e) => { state.room = e.target.value; renderCal(); });
  const shift = (n) => { state.week = addDays(state.week, n * 7); renderCal(); };
  $('#prev').addEventListener('click', () => shift(-1));
  $('#next').addEventListener('click', () => shift(1));
  $('#today').addEventListener('click', () => { state.week = thisMon; renderCal(); });
  $('#jump').addEventListener('change', (e) => { if (e.target.value) { state.week = mondayOf(parseISO(e.target.value)); renderCal(); } });

  const dlg = $('#dlg'), form = $('#form');
  const timeOpts = (a, b) => { let h = ''; for (let m = a; m <= b; m += 30) h += `<option value="${m}">${fm(m)}</option>`; return h; };
  $('#f-ruang').innerHTML = ROOMS.map((r) => `<option value="${r.id}">${esc(r.name)}</option>`).join('');
  $('#f-mulai').innerHTML = timeOpts(MIN0, MIN1 - 30);
  $('#f-selesai').innerHTML = timeOpts(MIN0 + 30, MIN1);
  const surat = () => { $('#f-surat').hidden = $('#f-file-box').hidden = !PK.needsLetter(PK.roomOf($('#f-ruang').value)); };
  $('#f-ruang').addEventListener('change', surat);
  $('#f-tgl').min = todayISO;
  function openForm(p) {
    const wk = iso(state.week), end = iso(addDays(state.week, 6)), dflt = (todayISO >= wk && todayISO < end) ? todayISO : wk;
    const q = p || { room: state.room, date: dflt < todayISO ? todayISO : dflt, s: 480, e: 570 };
    $('#f-ruang').value = q.room; $('#f-tgl').value = q.date; $('#f-mulai').value = q.s; $('#f-selesai').value = q.e;
    $('#f-err').textContent = ''; form.querySelectorAll('[aria-invalid]').forEach((i) => i.removeAttribute('aria-invalid'));
    surat();
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    $('#f-perlu').focus();
  }
  document.querySelectorAll('[data-open-form]').forEach((b) => b.addEventListener('click', () => openForm()));
  $('#f-batal').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = (msg, el) => { $('#f-err').textContent = msg; if (el) { el.setAttribute('aria-invalid', 'true'); el.focus(); } };
    form.querySelectorAll('[aria-invalid]').forEach((i) => i.removeAttribute('aria-invalid'));
    const tgl = $('#f-tgl'), perlu = $('#f-perlu');
    if (!tgl.value) return err('Pilih tanggal.', tgl);
    const d = parseISO(tgl.value);
    if (tgl.value < todayISO) return err('Tanggal itu sudah lewat.', tgl);
    if (d.getDay() === 0) return err('Kampus tidak melayani peminjaman hari Minggu.', tgl);
    const s = +$('#f-mulai').value, en = +$('#f-selesai').value;
    if (en <= s) return err('Jam selesai harus sesudah jam mulai.', $('#f-selesai'));
    if (!perlu.value.trim()) return err('Tulis keperluan peminjaman.', perlu);
    const room = $('#f-ruang').value, hit = PK.blockers(room, tgl.value, s, en)[0];
    if (hit) return err('Bentrok dengan ' + hit.title + ', ' + fm(hit.s) + ' sampai ' + fm(hit.e) + '. Pilih jam lain.', $('#f-mulai'));
    const file = $('#f-file').files[0], lerr = PK.checkLetter(PK.roomOf(room), file);
    if (lerr) return err(lerr, $('#f-file'));
    const withLetter = file && PK.needsLetter(PK.roomOf(room));
    const r = await PK.busy(form.querySelector('[type="submit"]'), () => PK.api('ajukan', { room, date: tgl.value, s, e: en, title: perlu.value.trim() }, withLetter ? file : null));
    if (!r) return;
    if (!r.ok) { renderCal(); return err(r.pesan); }
    state.room = room; state.type = 'semua'; $('#j-semua').checked = true; state.week = mondayOf(d);
    dlg.close(); form.reset(); renderAll();
    say('Pengajuan ' + PK.roomOf(room).name + ', ' + fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long' }) + ' ' + fm(s) + ' sampai ' + fm(en) + ' masuk antrean admin. Cek statusnya di Dashboard.');
  });

  renderAll();
  if (new URLSearchParams(location.search).get('ajukan') === '1') openForm();
})();
