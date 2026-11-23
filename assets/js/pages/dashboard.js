(() => {
  'use strict';
  PKshell('mahasiswa');
  const { fm, esc, iso, addDays, DAYS, ROOMS, MIN0, MIN1 } = PK;
  const $ = (s) => document.querySelector(s);
  const mine = () => PK.store.bookings.filter((b) => b.mine);
  const after = (b) => b.date > PK.todayISO || (b.date === PK.todayISO && b.e > new Date().getHours() * 60 + new Date().getMinutes());
  const ACTIVE = ['diajukan', 'disetujui', 'berjalan'];

  function stats() {
    const m = mine();
    const n = (f) => m.filter(f).length;
    $('#stats').innerHTML = [
      ['Menunggu persetujuan', n((b) => b.status === 'diajukan'), ''],
      ['Disetujui, belum dipakai', n((b) => b.status === 'disetujui' && after(b)), 'stat--open'],
      ['Selesai', n((b) => b.status === 'selesai'), ''],
      ['Terlambat dikembalikan', n((b) => b.status === 'terlambat'), '']
    ].map(([l, v, c]) => `<div class="well stat ${c}"><b>${v}</b><span>${l}</span></div>`).join('');
  }
  function next() {
    const list = mine().filter((b) => ['disetujui', 'berjalan'].includes(b.status) && after(b)).sort((a, b) => (a.date + a.s).localeCompare(b.date + b.s));
    const b = list[0];
    $('#next').innerHTML = b
      ? `<p class="stat" style="padding:0"><b style="font-size:var(--text-3xl)">${esc(PK.roomOf(b.room).name)}</b></p><p style="margin-top:var(--space-xs)"><strong style="color:var(--color-ink)">${esc(b.title)}</strong></p><p class="num" style="margin-top:var(--space-2xs)">${esc(PK.when(b))}</p><p style="margin-top:var(--space-sm)">${PK.tag(b.status)}</p>`
      : `<div class="empty"><p>Belum ada peminjaman yang disetujui.</p><a class="btn" href="pengajuan.php">Ajukan Peminjaman</a></div>`;
  }
  function now() {
    const n = new Date(); let d = new Date(n.getFullYear(), n.getMonth(), n.getDate()), m = n.getHours() * 60 + n.getMinutes(), lab = 'Pukul ' + fm(m);
    let dow = PK.dowOf(d);
    if (dow === 6 || m >= MIN1) { do { d = addDays(d, 1); dow = PK.dowOf(d); } while (dow === 6); m = MIN0; lab = DAYS[dow] + ' ' + fm(MIN0); }
    else if (m < MIN0) { m = MIN0; lab = 'Buka ' + fm(MIN0); }
    $('#now-when').textContent = lab;
    $('#now').innerHTML = ROOMS.map((r) => {
      const its = PK.itemsFor(r.id, iso(d), dow, false), cur = its.find((i) => m >= i.s && m < i.e);
      const txt = cur ? `<span class="tag tag--out">${cur.kind === 'kuliah' ? 'Kuliah' : 'Dipinjam'} sampai ${fm(cur.e)}</span>` : `<span class="tag tag--in">Kosong sampai ${fm((its.find((i) => i.s > m) || { s: MIN1 }).s)}</span>`;
      return `<li><b>${esc(r.name)}</b>${txt}</li>`;
    }).join('');
  }
  let filter = new URLSearchParams(location.search).get('status') || 'semua';
  function rows() {
    const f = { semua: () => true, aktif: (b) => ACTIVE.includes(b.status), selesai: (b) => b.status === 'selesai', lain: (b) => ['ditolak', 'dibatalkan', 'terlambat'].includes(b.status) }[filter] || (() => true);
    const list = mine().filter(f).sort((a, b) => (b.date + b.s).localeCompare(a.date + a.s));
    $('#rows').innerHTML = list.length ? list.map((b) => `<tr><td><b>${esc(PK.roomOf(b.room).name)}</b></td><td class="num">${esc(PK.when(b))}</td><td>${esc(b.title)}${b.letter ? `<small><a href="${PK.letterURL(b)}" target="_blank" rel="noopener">Surat: ${esc(b.letter)}</a></small>` : ''}</td><td>${PK.tag(b.status)}</td><td class="act">${['diajukan', 'disetujui'].includes(b.status) && after(b) ? `<button class="btn btn--sm" type="button" data-cancel="${b.id}">Batalkan</button>` : ''}</td></tr>`).join('')
      : `<tr><td colspan="5"><div class="empty"><p>Tidak ada pengajuan di filter ini.</p><a class="btn" href="pengajuan.php">Ajukan Peminjaman</a></div></td></tr>`;
  }
  const all = () => { stats(); next(); now(); rows(); window.PKnavCount && PKnavCount(); };
  document.getElementById('f-' + filter) && (document.getElementById('f-' + filter).checked = true);
  $('#filter').addEventListener('change', (e) => { filter = e.target.value; history.replaceState(null, '', '?status=' + filter + location.hash); rows(); });
  $('#rows').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-cancel]'); if (!b) return;
    const bk = PK.store.bookings.find((x) => x.id === b.dataset.cancel);
    if (!bk || !confirm('Batalkan peminjaman ' + PK.roomOf(bk.room).name + ' pada ' + PK.when(bk) + '?')) return;
    const r = await PK.busy(b, () => PK.api('batal', { id: bk.id }));
    if (!r) return;
    all();
    const k = $('#kabar'); k.textContent = r.pesan; k.classList.toggle('is-err', !r.ok);
  });
  all();
})();
