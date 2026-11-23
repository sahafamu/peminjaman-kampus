(() => {
  'use strict';
  PKshell('admin');
  const { fm, esc, DAYS, ROOMS, STATUS, MIN0, MIN1 } = PK;
  const $ = (s) => document.querySelector(s);
  const S = () => PK.store;
  const say = (m, err) => { const k = $('#kabar'); k.textContent = m; k.classList.toggle('is-err', !!err); };
  const roomName = (id) => PK.roomOf(id).name;
  const pending = () => S().bookings.filter((b) => b.status === 'diajukan').sort((a, b) => (a.date + a.s).localeCompare(b.date + b.s));
  const conflictOf = (b) => PK.blockers(b.room, b.date, b.s, b.e, b.id)[0];
  const outQty = () => S().loans.filter((l) => l.status === 'keluar').reduce((a, l) => a + l.qty, 0);
  /* pemohon: nama, NIM bila mahasiswa, dan keperluan */
  const whoOf = (b) => `<b>${esc(b.by)}</b>${b.nim ? `<small class="fig">NIM ${esc(b.nim)}</small>` : ''}<small>${esc(b.title)}</small>`;
  const empty = (msg, cols) => `<tr><td colspan="${cols}"><div class="empty"><p>${msg}</p></div></td></tr>`;

  /* tombol surat pengajuan: lihat di jendela, atau unduh */
  const letterBtns = (b) => b.letter ? `<span class="acts"><button class="btn btn--sm" type="button" data-act="surat-lihat" data-id="${b.id}" aria-label="Lihat surat ${esc(b.letter)}">Lihat surat</button><button class="btn btn--sm" type="button" data-act="surat-unduh" data-id="${b.id}" aria-label="Unduh surat ${esc(b.letter)}">Unduh PDF</button></span>` : '';
  /* aksi persetujuan, dipakai di Ringkasan dan Persetujuan */
  function queueRow(b, full) {
    const c = conflictOf(b);
    const who = whoOf(b);
    const noLetter = PK.needsLetter(PK.roomOf(b.room)) && !b.letter;
    const acts = `<span class="acts"><button class="btn btn--sm" type="button" data-act="tolak" data-id="${b.id}">Tolak</button><button class="btn btn--sm btn--primary" type="button" data-act="setuju" data-id="${b.id}"${c || noLetter || b.lewat ? ' disabled aria-disabled="true"' : ''}>Setujui</button></span>`;
    const letter = PK.needsLetter(PK.roomOf(b.room)) ? (b.letter ? `<span class="tag tag--in">Surat: ${esc(b.letter)}</span>` : '<span class="tag tag--late">Surat belum ada</span>') : '';
    const chk = (b.lewat ? '<span class="tag tag--late">Waktunya sudah lewat</span>' : c ? `<span class="tag tag--late">Bentrok: ${esc(c.title)}</span>` : '<span class="tag tag--in">Bebas bentrok</span>') + letter;
    return full
      ? `<tr><td>${who}</td><td>${esc(roomName(b.room))}</td><td class="num">${esc(PK.when(b))}</td><td>${chk}${letterBtns(b)}</td><td class="act">${acts}</td></tr>`
      : `<li><div>${who}<small>${esc(roomName(b.room))}, ${esc(PK.when(b))}</small></div><div class="acts">${chk}${letterBtns(b)}${acts}</div></li>`;
  }

  const views = {
    ringkasan: {
      title: 'Ringkasan', sub: 'Antrean persetujuan dan barang yang belum kembali.',
      html() {
        const p = pending(), today = S().bookings.filter((b) => b.date === PK.todayISO && PK.BLOCKING.includes(b.status)).length;
        const late = S().bookings.filter((b) => b.status === 'terlambat').length;
        const keluar = S().loans.filter((l) => l.status === 'keluar');
        return `<div class="stats">
      <div class="well stat stat--open"><b>${p.length}</b><span>Menunggu persetujuan</span></div>
      <div class="well stat"><b>${today}</b><span>Peminjaman ruang hari ini</span></div>
      <div class="well stat"><b>${outQty()}</b><span>Barang sedang keluar</span></div>
      <div class="well stat"><b>${late}</b><span>Peminjaman terlambat</span></div></div>
      <div class="cols">
        <section class="well panel" aria-labelledby="q-h"><div class="panel__head"><h2 id="q-h">Antrean persetujuan</h2><a href="#persetujuan">Buka semua</a></div>
          ${p.length ? `<ul class="list">${p.slice(0, 4).map((b) => queueRow(b, false)).join('')}</ul>` : '<div class="empty"><p>Tidak ada pengajuan yang menunggu.</p></div>'}</section>
        <section class="well panel" aria-labelledby="o-h"><div class="panel__head"><h2 id="o-h">Barang belum kembali</h2><a href="#barang">Catat kembali</a></div>
          ${keluar.length ? `<ul class="list">${keluar.map((l) => `<li><div><b>${esc(PK.itemOf(l.item).name)}</b><small>${esc(l.by)}</small></div><span class="tag tag--on">${l.qty}</span></li>`).join('')}</ul>` : '<div class="empty"><p>Semua barang sudah kembali.</p></div>'}</section>
      </div>`;
      }
    },
    persetujuan: {
      title: 'Persetujuan', sub: 'Pengajuan ruang yang menunggu keputusan. Pengajuan yang bentrok tidak bisa disetujui.',
      html() {
        const f = new URLSearchParams(location.search).get('lihat') || 'menunggu';
        const list = f === 'semua' ? S().bookings.slice().sort((a, b) => (b.date + b.s).localeCompare(a.date + a.s)) : pending();
        const row = (b) => b.status === 'diajukan' ? queueRow(b, true) : `<tr><td>${whoOf(b)}</td><td>${esc(roomName(b.room))}</td><td class="num">${esc(PK.when(b))}</td><td>${PK.tag(b.status)}</td><td class="act">${letterBtns(b)}</td></tr>`;
        return `<div class="toolbar"><fieldset class="seg" id="lihat"><legend class="visually-hidden">Tampilkan</legend>
      <input type="radio" name="lihat" id="l-m" value="menunggu"${f !== 'semua' ? ' checked' : ''}><label for="l-m">Menunggu</label>
      <input type="radio" name="lihat" id="l-s" value="semua"${f === 'semua' ? ' checked' : ''}><label for="l-s">Semua status</label></fieldset></div>
      <section class="well panel"><div class="tablewrap" tabindex="0" role="region" aria-label="Tabel persetujuan, geser ke samping bila layar sempit"><table>
      <thead><tr><th>Pemohon dan keperluan</th><th>Ruang</th><th>Waktu</th><th>Cek bentrok</th><th class="act"><span class="visually-hidden">Aksi</span></th></tr></thead>
      <tbody>${list.length ? list.map(row).join('') : empty('Tidak ada pengajuan yang menunggu.', 5)}</tbody></table></div></section>`;
      }
    },
    jadwal: {
      title: 'Jadwal tetap', sub: 'Jadwal kuliah dan praktikum mingguan. Ruang pada jam ini tidak bisa dipinjam.',
      html() {
        const rf = new URLSearchParams(location.search).get('ruang') || 'semua';
        const list = S().classes.filter((c) => rf === 'semua' || c.room === rf).slice().sort((a, b) => a.day - b.day || a.s - b.s);
        const half = (a, b) => { let h = ''; for (let m = a; m <= b; m += 10) h += `<option value="${m}">${fm(m)}</option>`; return h; };
        return `<section class="well panel" aria-labelledby="t-h"><div class="panel__head"><h2 id="t-h">Tambah jadwal</h2></div>
      <form id="f-jadwal" class="formgrid" novalidate>
        <div class="field"><label for="j-hari">Hari</label><select id="j-hari">${DAYS.slice(0, 5).map((d, i) => `<option value="${i}">${d}</option>`).join('')}</select></div>
        <div class="field"><label for="j-mulai">Mulai</label><select id="j-mulai">${half(MIN0, MIN1 - 10)}</select></div>
        <div class="field"><label for="j-selesai">Selesai</label><select id="j-selesai">${half(MIN0 + 10, MIN1)}</select></div>
        <div class="field"><label for="j-ruang">Ruang</label><select id="j-ruang">${ROOMS.filter((r) => !['lapangan', 'auditorium'].includes(r.type)).map((r) => `<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select></div>
        <div class="field"><label for="j-nama">Mata kuliah</label><input id="j-nama" type="text" maxlength="120"></div>
        <button class="btn btn--primary" type="submit">Tambah</button></form></section>
      <div class="toolbar" style="margin-top:var(--space-md)"><div class="field" style="grid-auto-flow:column;align-items:center;gap:var(--space-xs)"><label for="j-filter">Ruang</label><select id="j-filter" style="width:auto"><option value="semua">Semua</option>${ROOMS.filter((r) => !['lapangan', 'auditorium'].includes(r.type)).map((r) => `<option value="${r.id}"${rf === r.id ? ' selected' : ''}>${esc(r.name)}</option>`).join('')}</select></div></div>
      <section class="well panel"><div class="tablewrap" tabindex="0" role="region" aria-label="Tabel jadwal tetap"><table>
      <thead><tr><th>Hari</th><th>Jam</th><th>Ruang</th><th>Mata kuliah</th><th class="act"><span class="visually-hidden">Aksi</span></th></tr></thead>
      <tbody>${list.length ? list.map((c) => `<tr><td><b>${DAYS[c.day]}</b></td><td class="num">${fm(c.s)}-${fm(c.e)}</td><td>${esc(roomName(c.room))}</td><td>${esc(c.title)}</td><td class="act"><button class="btn btn--sm" type="button" data-act="hapus-jadwal" data-id="${c.id}">Hapus</button></td></tr>`).join('') : empty('Belum ada jadwal untuk ruang ini.', 5)}</tbody></table></div></section>`;
      }
    },
    inventaris: {
      title: 'Inventaris barang', sub: 'Stok barang yang bisa dipinjam, dihitung per jumlah.',
      html() {
        const q = (new URLSearchParams(location.search).get('q') || '').toLowerCase();
        const list = S().items.filter((i) => i.name.toLowerCase().includes(q));
        return `<div class="toolbar"><div class="field grow"><label class="visually-hidden" for="cari">Cari barang</label><input type="search" id="cari" placeholder="Cari barang" value="${esc(q)}"></div></div>
      <section class="well panel"><div class="tablewrap" tabindex="0" role="region" aria-label="Tabel inventaris"><table>
      <thead><tr><th>Barang</th><th>Total</th><th>Keluar</th><th>Tersedia</th><th class="act">Ubah total</th></tr></thead>
      <tbody>${list.length ? list.map((i) => { const o = PK.out(i.id), a = i.total - o; return `<tr><td><b>${esc(i.name)}</b></td><td class="num">${i.total}</td><td class="num">${o}</td><td>${a > 0 ? `<span class="tag tag--in">${a} tersedia</span>` : '<span class="tag tag--out">Habis</span>'}</td><td class="act"><span class="acts"><button class="btn btn--sm btn--icon" type="button" data-act="stok-kurang" data-id="${i.id}" aria-label="Kurangi total ${esc(i.name)}"${i.total <= o ? ' disabled aria-disabled="true"' : ''}>-</button><button class="btn btn--sm btn--icon" type="button" data-act="stok-tambah" data-id="${i.id}" aria-label="Tambah total ${esc(i.name)}">+</button></span></td></tr>`; }).join('') : empty('Tidak ada barang dengan nama itu.', 5)}</tbody></table></div></section>`;
      }
    },
    barang: {
      title: 'Barang keluar dan kembali', sub: 'Catat barang yang dibawa peminjam dan saat dikembalikan.',
      html() {
        const f = new URLSearchParams(location.search).get('pinjam') || 'semua';
        const all = S().loans, nOut = all.filter((l) => l.status === 'keluar').length;
        /* satu daftar: yang belum kembali di atas (paling lama keluar dulu), yang sudah kembali di bawah (terbaru dulu) */
        const rows = all.filter((l) => f === 'semua' || (f === 'belum' ? l.status === 'keluar' : l.status === 'kembali'))
          .sort((a, b) => (a.status === b.status ? (a.status === 'keluar' ? a.date.localeCompare(b.date) : (b.back || '').localeCompare(a.back || '')) : a.status === 'keluar' ? -1 : 1));
        const d = (iso) => iso ? esc(PK.fmtDate(PK.parseISO(iso), { day: 'numeric', month: 'short' })) : '-';
        const rowL = (l) => `<tr><td><b>${esc(PK.itemOf(l.item).name)}</b></td><td class="num">${l.qty}</td><td>${esc(l.by)}</td><td class="num">${d(l.date)}</td><td class="num">${d(l.back)}</td><td>${l.status === 'keluar' ? '<span class="tag tag--late">Belum kembali</span>' : '<span class="tag tag--in">Sudah kembali</span>'}</td><td class="act">${l.status === 'keluar' ? `<button class="btn btn--sm" type="button" data-act="kembali" data-id="${l.id}">Catat kembali</button>` : ''}</td></tr>`;
        const tab = (v, id, t) => `<input type="radio" name="pinjam" id="${id}" value="${v}"${f === v ? ' checked' : ''}><label for="${id}">${t}</label>`;
        return `<section class="well panel" aria-labelledby="k-h"><div class="panel__head"><h2 id="k-h">Catat barang keluar</h2></div>
      <form id="f-keluar" class="formgrid" novalidate>
        <div class="field"><label for="k-item">Barang</label><select id="k-item">${S().items.map((i) => `<option value="${i.id}">${esc(i.name)} (${i.total - PK.out(i.id)})</option>`).join('')}</select></div>
        <div class="field"><label for="k-qty">Jumlah</label><input type="number" id="k-qty" min="1" value="1"></div>
        <div class="field"><label for="k-by">Peminjam</label><input type="text" id="k-by" maxlength="100"></div>
        <button class="btn btn--primary" type="submit">Catat keluar</button></form></section>
      <section class="well panel" style="margin-top:var(--space-md)"><div class="panel__head"><h2>Catatan barang</h2><span>${nOut} belum kembali</span></div>
      <div class="toolbar"><fieldset class="seg"><legend class="visually-hidden">Tampilkan</legend>${tab('semua', 'p-s', 'Semua')}${tab('belum', 'p-b', 'Belum kembali')}${tab('sudah', 'p-k', 'Sudah kembali')}</fieldset></div>
      <div class="tablewrap" tabindex="0" role="region" aria-label="Catatan barang keluar dan kembali"><table><thead><tr><th>Barang</th><th>Jumlah</th><th>Peminjam</th><th>Keluar</th><th>Kembali</th><th>Status</th><th class="act"><span class="visually-hidden">Aksi</span></th></tr></thead><tbody>${rows.length ? rows.map(rowL).join('') : empty(f === 'belum' ? 'Semua barang sudah kembali.' : 'Belum ada catatan.', 7)}</tbody></table></div></section>`;
      }
    },
    laporan: {
      title: 'Laporan', sub: 'Dihitung dari semua data peminjaman di database.',
      html() {
        const B = S().bookings;
        const byStatus = Object.keys(STATUS).map((k) => [k, B.filter((b) => b.status === k).length]);
        const byRoom = ROOMS.map((r) => { const x = B.filter((b) => b.room === r.id); return [r.name, x.length, x.filter((b) => PK.BLOCKING.concat(['selesai', 'terlambat']).includes(b.status)).length, x.filter((b) => b.status === 'ditolak').length]; });
        const byItem = S().items.map((i) => [i.name, S().loans.filter((l) => l.item === i.id).reduce((a, l) => a + l.qty, 0)]).filter((x) => x[1]).sort((a, b) => b[1] - a[1]);
        return `<div class="cols--eq" style="display:grid;gap:var(--space-md)">
      <section class="well panel"><div class="panel__head"><h2>Pengajuan menurut status</h2></div><table><thead><tr><th>Status</th><th class="act">Jumlah</th></tr></thead><tbody>${byStatus.map(([k, n]) => `<tr><td>${PK.tag(k)}</td><td class="act num">${n}</td></tr>`).join('')}</tbody></table></section>
      <section class="well panel"><div class="panel__head"><h2>Pengajuan menurut ruang</h2></div><table><thead><tr><th>Ruang</th><th class="act">Diajukan</th><th class="act">Dipakai</th><th class="act">Ditolak</th></tr></thead><tbody>${byRoom.map(([n, a, b, c]) => `<tr><td><b>${esc(n)}</b></td><td class="act num">${a}</td><td class="act num">${b}</td><td class="act num">${c}</td></tr>`).join('')}</tbody></table></section>
      <section class="well panel"><div class="panel__head"><h2>Barang paling sering keluar</h2></div><table><thead><tr><th>Barang</th><th class="act">Jumlah dipinjam</th></tr></thead><tbody>${byItem.length ? byItem.map(([n, q]) => `<tr><td><b>${esc(n)}</b></td><td class="act num">${q}</td></tr>`).join('') : empty('Belum ada barang yang keluar.', 2)}</tbody></table></section></div>`;
      }
    }
  };

  function route() { const k = location.hash.slice(1); return views[k] ? k : 'ringkasan'; }
  function render() {
    const k = route(), v = views[k];
    $('#judul').textContent = v.title; $('#sub').textContent = v.sub; document.title = v.title + ' | Admin';
    $('#view').innerHTML = v.html();
    window.PKnavCount && PKnavCount();
  }
  window.addEventListener('hashchange', () => { say(''); render(); });

  /* surat: dibuka di jendela (iframe) tanpa mengunduh, atau diunduh sebagai berkas */
  const dlg = $('#dlg-surat'), frame = $('#dlg-surat-pdf');
  let shown = null, opener = null;
  const closeLetter = () => { if (dlg.open) dlg.close(); };
  dlg.addEventListener('close', () => { frame.src = 'about:blank'; if (opener) opener.focus(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) closeLetter(); });
  $('#dlg-surat-tutup').addEventListener('click', closeLetter);
  $('#dlg-surat-unduh').addEventListener('click', () => shown && downloadLetter(shown));
  function viewLetter(bk, from) {
    if (!bk || !bk.letter) return;
    shown = bk; opener = from;
    $('#dlg-surat-h').textContent = bk.letter;
    frame.src = PK.letterURL(bk);
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  }
  function downloadLetter(bk) {
    if (!bk || !bk.letter) return;
    const a = document.createElement('a');
    a.href = PK.letterURL(bk, true); a.download = bk.letter; document.body.appendChild(a); a.click(); a.remove();
    say('Surat ' + bk.letter + ' diunduh.');
  }

  /* kirim aksi ke server, tampilkan pesannya, lalu gambar ulang dengan data terbaru */
  async function run(btn, aksi, fields, keepForm) {
    const r = await PK.busy(btn, () => PK.api(aksi, fields));
    if (!r) return null;
    if (r.ok || !keepForm) render();
    say(r.pesan, !r.ok);
    return r;
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const id = b.dataset.id, act = b.dataset.act, bk = S().bookings.find((x) => x.id === id);
    if (act === 'surat-lihat') return viewLetter(bk, b);
    if (act === 'surat-unduh') return downloadLetter(bk);
    if (act === 'setuju') {
      if (PK.needsLetter(PK.roomOf(bk.room)) && !bk.letter) return say('Pengajuan ' + roomName(bk.room) + ' belum menyertakan surat. Tidak bisa disetujui.', true);
      if (conflictOf(bk)) return say('Bentrok dengan ' + conflictOf(bk).title + '. Pengajuan tidak bisa disetujui.', true);
      run(b, 'setuju', { id });
    } else if (act === 'tolak') {
      if (!confirm('Tolak pengajuan ' + bk.by + ' untuk ' + roomName(bk.room) + '?')) return;
      run(b, 'tolak', { id });
    } else if (act === 'hapus-jadwal') {
      const c = S().classes.find((x) => x.id === id);
      if (!c || !confirm('Hapus jadwal ' + c.title + '? Ruang akan terbuka untuk dipinjam di jam itu.')) return;
      run(b, 'jadwal_hapus', { id });
    } else if (act === 'stok-tambah' || act === 'stok-kurang') {
      run(b, 'stok', { id, delta: act === 'stok-tambah' ? 1 : -1 });
    } else if (act === 'kembali') {
      run(b, 'kembali', { id });
    }
  });
  document.addEventListener('change', (e) => {
    const q = new URLSearchParams(location.search);
    if (e.target.name === 'lihat') { q.set('lihat', e.target.value); history.replaceState(null, '', '?' + q + location.hash); render(); }
    if (e.target.name === 'pinjam') { q.set('pinjam', e.target.value); history.replaceState(null, '', '?' + q + location.hash); render(); }
    if (e.target.id === 'j-filter') { q.set('ruang', e.target.value); history.replaceState(null, '', '?' + q + location.hash); render(); }
  });
  document.addEventListener('input', (e) => {
    if (e.target.id !== 'cari') return;
    const q = new URLSearchParams(location.search); q.set('q', e.target.value); history.replaceState(null, '', '?' + q + location.hash);
    const pos = e.target.selectionStart; render(); const n = $('#cari'); n.focus(); n.setSelectionRange(pos, pos);
  });
  document.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('[type="submit"]');
    if (e.target.id === 'f-jadwal') {
      const day = +$('#j-hari').value, s = +$('#j-mulai').value, en = +$('#j-selesai').value, room = $('#j-ruang').value, nama = $('#j-nama').value.trim();
      if (en <= s) return say('Jam selesai harus sesudah jam mulai.', true);
      if (!nama) { $('#j-nama').setAttribute('aria-invalid', 'true'); $('#j-nama').focus(); return say('Isi nama mata kuliah.', true); }
      const clash = S().classes.find((c) => c.room === room && c.day === day && s < c.e && en > c.s);
      if (clash) return say('Bentrok dengan ' + clash.title + ', ' + fm(clash.s) + ' sampai ' + fm(clash.e) + '.', true);
      await run(btn, 'jadwal_tambah', { day, s, e: en, room, title: nama }, true);
    }
    if (e.target.id === 'f-keluar') {
      const item = PK.itemOf($('#k-item').value), qty = +$('#k-qty').value, by = $('#k-by').value.trim(), avail = item.total - PK.out(item.id);
      if (!by) { $('#k-by').setAttribute('aria-invalid', 'true'); $('#k-by').focus(); return say('Isi nama peminjam.', true); }
      if (!(qty >= 1) || !Number.isInteger(qty)) return say('Jumlah minimal 1.', true);
      if (qty > avail) return say('Stok ' + item.name + ' hanya tersisa ' + avail + '.', true);
      await run(btn, 'keluar', { item: item.id, qty, by }, true);
    }
  });
  render();
})();
