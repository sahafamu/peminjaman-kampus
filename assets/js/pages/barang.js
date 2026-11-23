(() => {
  'use strict';
  PKshell('mahasiswa');
  const { esc } = PK;
  /* tersedia = total dikurangi yang sedang keluar; barang yang habis dipinjam tidak ditampilkan */
  const free = PK.store.items.map((i) => ({ name: i.name, total: i.total, n: i.total - PK.out(i.id) })).filter((i) => i.n > 0);
  document.getElementById('brg-n').textContent = free.length + ' jenis tersedia';
  document.getElementById('rows').innerHTML = free.length
    ? free.map((i) => `<tr><td><b>${esc(i.name)}</b></td><td class="act"><span class="tag tag--in">${i.n} tersedia</span></td><td class="act num">${i.total}</td></tr>`).join('')
    : '<tr><td colspan="3"><div class="empty"><p>Semua barang sedang dipinjam.</p></div></td></tr>';
})();
