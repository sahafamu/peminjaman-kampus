<?php
/* Semua perubahan data lewat sini. POST multipart: aksi=<nama> + isian. Balasan JSON {ok, pesan, data}. */
declare(strict_types=1);
require __DIR__ . '/../app/bootstrap.php';
require __DIR__ . '/../app/rules.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function reply(int $code, bool $ok, string $pesan, ?array $u = null): never
{
    http_response_code($code);
    $out = ['ok' => $ok, 'pesan' => $pesan];
    if ($u) $out['data'] = state_for($u);
    echo json_encode($out, JSON_UNESCAPED_UNICODE);
    exit;
}
function in_str(string $k, int $max = 200): string
{
    $v = trim((string) ($_POST[$k] ?? ''));
    return mb_substr(preg_replace('/[\x00-\x1F\x7F]/u', '', $v) ?? '', 0, $max);
}
function in_int(string $k): ?int
{
    $v = $_POST[$k] ?? '';
    return is_string($v) && preg_match('/^-?\d{1,9}$/', $v) ? (int) $v : null;
}
function need_role(array $u, string $role): void
{
    if ($u['role'] !== $role) reply(403, false, 'Aksi ini tidak tersedia untuk akunmu.');
}
function booking(int $id, bool $lock = false): ?array
{
    $st = db()->prepare('SELECT b.*, TIME_TO_SEC(jam_mulai) DIV 60 AS s, TIME_TO_SEC(jam_selesai) DIV 60 AS e, r.nama AS room_name, r.jenis AS room_type
        FROM bookings b JOIN rooms r ON r.id = b.room_id WHERE b.id = ?' . ($lock ? ' FOR UPDATE' : ''));
    $st->execute([$id]);
    return $st->fetch() ?: null;
}
function when_text(array $b): string
{
    return DAYS[dow($b['tanggal'])] . ' ' . date('j/n', strtotime($b['tanggal'])) . ', ' . fm((int) $b['s']) . '-' . fm((int) $b['e']);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') reply(405, false, 'Metode tidak diizinkan.');
/* unggahan melebihi post_max_size membuat $_POST kosong */
if (empty($_POST) && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) reply(413, false, 'Berkas terlalu besar. Ukuran surat maksimal 2 MB.');

try {
    $u = current_user();
    if (!$u) reply(401, false, 'Sesi habis. Silakan masuk lagi.');
    if (!csrf_ok($_SERVER['HTTP_X_CSRF_TOKEN'] ?? null)) reply(403, false, 'Token keamanan tidak cocok. Muat ulang halaman.');
    $db = db();
    $aksi = (string) ($_POST['aksi'] ?? '');

    switch ($aksi) {
        /* ---------- mahasiswa ---------- */
        case 'ajukan': {
            need_role($u, 'mahasiswa');
            $room = room(in_str('room', 10));
            if (!$room) reply(422, false, 'Pilih ruang.', $u);
            $date = in_str('date', 10);
            $s = in_int('s');
            $e = in_int('e');
            if ($s === null || $e === null) reply(422, false, 'Isi jam mulai dan jam selesai.', $u);
            check_slot($date, $s, $e);
            $title = in_str('title', 160);
            if ($title === '') reply(422, false, 'Tulis keperluan peminjaman.', $u);
            $hit = blockers($room['id'], $date, $s, $e);
            if ($hit) reply(409, false, blocker_text($hit[0]) . ' Pilih jam lain.', $u);

            $letterName = $letterFile = null;
            if (needs_letter($room)) {
                $f = $_FILES['surat'] ?? null;
                if (!$f || ($f['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) reply(422, false, 'Unggah surat pengajuan untuk ' . $room['name'] . '.', $u);
                if (in_array($f['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) || $f['size'] > config('surat_max')) reply(422, false, 'Ukuran surat maksimal 2 MB.', $u);
                if ($f['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'])) reply(422, false, 'Surat gagal diunggah. Coba lagi.', $u);
                $name = basename(str_replace('\\', '/', (string) $f['name']));
                if (!preg_match('/\.pdf$/i', $name)) reply(422, false, 'Surat harus berupa berkas PDF.', $u);
                $mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
                $head = (string) file_get_contents($f['tmp_name'], false, null, 0, 5);
                if ($mime !== 'application/pdf' || $head !== '%PDF-') reply(422, false, 'Isi berkas bukan PDF yang valid.', $u);
                $dir = config('storage');
                if (!is_dir($dir)) mkdir($dir, 0775, true);
                $letterFile = bin2hex(random_bytes(16)) . '.pdf';
                if (!move_uploaded_file($f['tmp_name'], "$dir/$letterFile")) reply(500, false, 'Surat tidak bisa disimpan di server.', $u);
                $letterName = mb_substr(preg_replace('/[\x00-\x1F\x7F"]/u', '', $name) ?: 'surat.pdf', 0, 255);
            }
            try {
                $db->prepare('INSERT INTO bookings (room_id, tanggal, jam_mulai, jam_selesai, keperluan, pemohon, user_id, status, surat_nama, surat_file)
                    VALUES (?, ?, ?, ?, ?, ?, ?, \'diajukan\', ?, ?)')
                    ->execute([$room['id'], $date, to_time($s), to_time($e), $title, $u['nama'], $u['id'], $letterName, $letterFile]);
            } catch (Throwable $ex) {
                if ($letterFile) @unlink(config('storage') . "/$letterFile");
                throw $ex;
            }
            reply(200, true, 'Pengajuan ' . $room['name'] . ' masuk antrean admin.', $u);
        }

        case 'batal': {
            need_role($u, 'mahasiswa');
            $b = booking((int) in_int('id'));
            if (!$b || (int) $b['user_id'] !== (int) $u['id']) reply(404, false, 'Pengajuan tidak ditemukan.', $u);
            if (!in_array($b['status'], ['diajukan', 'disetujui'], true)) reply(409, false, 'Pengajuan ini sudah tidak bisa dibatalkan.', $u);
            if (strtotime($b['tanggal'] . ' ' . $b['jam_selesai']) <= time()) reply(409, false, 'Waktu peminjaman sudah lewat.', $u);
            $db->prepare("UPDATE bookings SET status = 'dibatalkan' WHERE id = ?")->execute([$b['id']]);
            reply(200, true, 'Peminjaman ' . $b['room_name'] . ' dibatalkan. Jamnya kembali kosong di kalender.', $u);
        }

        /* ---------- admin: persetujuan ---------- */
        case 'setuju': {
            need_role($u, 'admin');
            $id = (int) in_int('id');
            $pre = booking($id);
            if (!$pre) reply(404, false, 'Pengajuan tidak ditemukan.', $u);
            /* kunci per ruang agar dua admin tidak menyetujui jam yang sama bersamaan */
            $lock = 'pk_room_' . $pre['room_id'];
            $db->query("SELECT GET_LOCK(" . $db->quote($lock) . ", 10)");
            try {
                $b = booking($id);
                if ($b['status'] !== 'diajukan') reply(409, false, 'Pengajuan ini sudah diputuskan.', $u);
                if (needs_letter(['type' => $b['room_type']]) && !$b['surat_nama']) reply(409, false, 'Pengajuan ' . $b['room_name'] . ' belum menyertakan surat. Tidak bisa disetujui.', $u);
                if (strtotime($b['tanggal'] . ' ' . $b['jam_selesai']) <= time()) reply(409, false, 'Waktu pengajuan ini sudah lewat. Tolak saja.', $u);
                $hit = blockers($b['room_id'], $b['tanggal'], (int) $b['s'], (int) $b['e'], (int) $b['id']);
                if ($hit) reply(409, false, 'Bentrok dengan ' . $hit[0]['title'] . '. Pengajuan tidak bisa disetujui.', $u);
                $db->prepare("UPDATE bookings SET status = 'disetujui', diputus_oleh = ?, diputus_pada = NOW() WHERE id = ? AND status = 'diajukan'")->execute([$u['id'], $id]);
            } finally {
                $db->query("SELECT RELEASE_LOCK(" . $db->quote($lock) . ")");
            }
            reply(200, true, 'Disetujui: ' . $b['room_name'] . ', ' . when_text($b) . '. Jam itu sekarang terkunci di kalender.', $u);
        }

        case 'tolak': {
            need_role($u, 'admin');
            $b = booking((int) in_int('id'));
            if (!$b) reply(404, false, 'Pengajuan tidak ditemukan.', $u);
            if ($b['status'] !== 'diajukan') reply(409, false, 'Pengajuan ini sudah diputuskan.', $u);
            $db->prepare("UPDATE bookings SET status = 'ditolak', diputus_oleh = ?, diputus_pada = NOW() WHERE id = ? AND status = 'diajukan'")->execute([$u['id'], $b['id']]);
            reply(200, true, 'Ditolak: ' . $b['pemohon'] . ', ' . $b['room_name'] . '.', $u);
        }

        /* ---------- admin: jadwal tetap ---------- */
        case 'jadwal_tambah': {
            need_role($u, 'admin');
            $day = in_int('day');
            $s = in_int('s');
            $e = in_int('e');
            $room = room(in_str('room', 10));
            $title = in_str('title', 120);
            if ($day === null || $day < 0 || $day > 4) reply(422, false, 'Pilih hari Senin sampai Jumat.', $u);
            if (!$room || needs_letter($room)) reply(422, false, 'Pilih ruang kelas atau lab.', $u);
            if ($s === null || $e === null || $s < MIN0 || $e > MIN1) reply(422, false, 'Jam harus antara ' . fm(MIN0) . ' dan ' . fm(MIN1) . '.', $u);
            if ($e <= $s) reply(422, false, 'Jam selesai harus sesudah jam mulai.', $u);
            if ($title === '') reply(422, false, 'Isi nama mata kuliah.', $u);
            $st = $db->prepare('SELECT mata_kuliah, TIME_TO_SEC(jam_mulai) DIV 60 AS s, TIME_TO_SEC(jam_selesai) DIV 60 AS e FROM classes
                WHERE room_id = ? AND hari = ? AND TIME_TO_SEC(jam_mulai) DIV 60 < ? AND TIME_TO_SEC(jam_selesai) DIV 60 > ? LIMIT 1');
            $st->execute([$room['id'], $day, $e, $s]);
            if ($c = $st->fetch()) reply(409, false, 'Bentrok dengan ' . $c['mata_kuliah'] . ', ' . fm((int) $c['s']) . ' sampai ' . fm((int) $c['e']) . '.', $u);
            $db->prepare('INSERT INTO classes (hari, jam_mulai, jam_selesai, room_id, mata_kuliah) VALUES (?, ?, ?, ?, ?)')
                ->execute([$day, to_time($s), to_time($e), $room['id'], $title]);
            reply(200, true, 'Jadwal ' . $title . ' ditambahkan.', $u);
        }

        case 'jadwal_hapus': {
            need_role($u, 'admin');
            $st = $db->prepare('SELECT mata_kuliah FROM classes WHERE id = ?');
            $st->execute([(int) in_int('id')]);
            $c = $st->fetch();
            if (!$c) reply(404, false, 'Jadwal tidak ditemukan.', $u);
            $db->prepare('DELETE FROM classes WHERE id = ?')->execute([(int) in_int('id')]);
            reply(200, true, 'Jadwal ' . $c['mata_kuliah'] . ' dihapus.', $u);
        }

        /* ---------- admin: inventaris dan barang keluar ---------- */
        case 'stok': {
            need_role($u, 'admin');
            $delta = in_int('delta');
            if ($delta !== 1 && $delta !== -1) reply(422, false, 'Perubahan stok tidak dikenal.', $u);
            $db->beginTransaction();
            $st = $db->prepare('SELECT id, nama, total FROM items WHERE id = ? FOR UPDATE');
            $st->execute([(int) in_int('id')]);
            $i = $st->fetch();
            if (!$i) { $db->rollBack(); reply(404, false, 'Barang tidak ditemukan.', $u); }
            $st = $db->prepare("SELECT COALESCE(SUM(jumlah), 0) FROM loans WHERE item_id = ? AND status = 'keluar'");
            $st->execute([$i['id']]);
            $out = (int) $st->fetchColumn();
            $total = (int) $i['total'] + $delta;
            if ($total < $out || $total < 0) { $db->rollBack(); reply(409, false, 'Total ' . $i['nama'] . ' tidak boleh kurang dari yang sedang keluar (' . $out . ').', $u); }
            $db->prepare('UPDATE items SET total = ? WHERE id = ?')->execute([$total, $i['id']]);
            $db->commit();
            reply(200, true, $i['nama'] . ': total sekarang ' . $total . '.', $u);
        }

        case 'keluar': {
            need_role($u, 'admin');
            $qty = in_int('qty');
            $by = in_str('by', 100);
            if ($by === '') reply(422, false, 'Isi nama peminjam.', $u);
            if ($qty === null || $qty < 1) reply(422, false, 'Jumlah minimal 1.', $u);
            $db->beginTransaction();
            $st = $db->prepare('SELECT id, nama, total FROM items WHERE id = ? FOR UPDATE');
            $st->execute([(int) in_int('item')]);
            $i = $st->fetch();
            if (!$i) { $db->rollBack(); reply(404, false, 'Barang tidak ditemukan.', $u); }
            $st = $db->prepare("SELECT COALESCE(SUM(jumlah), 0) FROM loans WHERE item_id = ? AND status = 'keluar'");
            $st->execute([$i['id']]);
            $avail = (int) $i['total'] - (int) $st->fetchColumn();
            if ($qty > $avail) { $db->rollBack(); reply(409, false, 'Stok ' . $i['nama'] . ' hanya tersisa ' . $avail . '.', $u); }
            $db->prepare("INSERT INTO loans (item_id, jumlah, peminjam, tanggal_keluar, status, dicatat_oleh) VALUES (?, ?, ?, ?, 'keluar', ?)")
                ->execute([$i['id'], $qty, $by, date('Y-m-d'), $u['id']]);
            $db->commit();
            reply(200, true, $qty . ' ' . $i['nama'] . ' tercatat keluar untuk ' . $by . '.', $u);
        }

        case 'kembali': {
            need_role($u, 'admin');
            $st = $db->prepare('SELECT l.id, l.peminjam, l.status, i.nama FROM loans l JOIN items i ON i.id = l.item_id WHERE l.id = ?');
            $st->execute([(int) in_int('id')]);
            $l = $st->fetch();
            if (!$l) reply(404, false, 'Catatan tidak ditemukan.', $u);
            if ($l['status'] === 'kembali') reply(409, false, 'Barang ini sudah tercatat kembali.', $u);
            $db->prepare("UPDATE loans SET status = 'kembali', tanggal_kembali = ? WHERE id = ? AND status = 'keluar'")->execute([date('Y-m-d'), $l['id']]);
            reply(200, true, $l['nama'] . ' dari ' . $l['peminjam'] . ' tercatat kembali.', $u);
        }

        default:
            reply(400, false, 'Aksi tidak dikenal.');
    }
} catch (RuleError $ex) {
    reply(422, false, $ex->getMessage(), $u ?? null);
} catch (Throwable $ex) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    error_log('[peminjaman-kampus] ' . $ex);
    reply(500, false, 'Terjadi kesalahan di server. Coba lagi.');
}
