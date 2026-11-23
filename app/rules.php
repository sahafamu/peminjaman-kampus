<?php
/* Aturan bisnis peminjaman. Server selalu memeriksa ulang di sini, walau halaman sudah memeriksa lebih dulu. */
declare(strict_types=1);

const MIN0 = 420;   /* 07.00 */
const MIN1 = 1080;  /* 18.00 */
const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const STATUSES = ['diajukan', 'disetujui', 'ditolak', 'berjalan', 'selesai', 'dibatalkan', 'terlambat'];
const BLOCKING = ['disetujui', 'berjalan'];

class RuleError extends Exception {}

function fm(int $m): string
{
    return sprintf('%02d.%02d', intdiv($m, 60), $m % 60);
}

function to_time(int $m): string
{
    return sprintf('%02d:%02d:00', intdiv($m, 60), $m % 60);
}

/* 0 = Senin ... 6 = Minggu */
function dow(string $date): int
{
    return (int) date('N', strtotime($date)) - 1;
}

function valid_date(string $d): bool
{
    $x = DateTime::createFromFormat('!Y-m-d', $d);
    return $x && $x->format('Y-m-d') === $d;
}

function rooms(): array
{
    return db()->query('SELECT id, nama AS name, jenis AS type FROM rooms ORDER BY urutan, nama')->fetchAll();
}

function room(string $id): ?array
{
    $st = db()->prepare('SELECT id, nama AS name, jenis AS type FROM rooms WHERE id = ?');
    $st->execute([$id]);
    return $st->fetch() ?: null;
}

/* lapangan dan auditorium memerlukan surat pengajuan */
function needs_letter(array $room): bool
{
    return in_array($room['type'], ['lapangan', 'auditorium'], true);
}

/* jadwal kuliah dan peminjaman disetujui yang bertabrakan dengan rentang [s, e) */
function blockers(string $room, string $date, int $s, int $e, ?int $ignoreId = null): array
{
    $out = [];
    $d = dow($date);
    if ($d < 5) {
        $st = db()->prepare('SELECT mata_kuliah AS title, TIME_TO_SEC(jam_mulai) DIV 60 AS s, TIME_TO_SEC(jam_selesai) DIV 60 AS e
            FROM classes WHERE room_id = ? AND hari = ? AND TIME_TO_SEC(jam_mulai) DIV 60 < ? AND TIME_TO_SEC(jam_selesai) DIV 60 > ?');
        $st->execute([$room, $d, $e, $s]);
        foreach ($st as $r) $out[] = $r + ['kind' => 'kuliah'];
    }
    $st = db()->prepare("SELECT keperluan AS title, TIME_TO_SEC(jam_mulai) DIV 60 AS s, TIME_TO_SEC(jam_selesai) DIV 60 AS e
        FROM bookings WHERE room_id = ? AND tanggal = ? AND status IN ('disetujui','berjalan') AND id <> ?
        AND TIME_TO_SEC(jam_mulai) DIV 60 < ? AND TIME_TO_SEC(jam_selesai) DIV 60 > ?");
    $st->execute([$room, $date, $ignoreId ?? 0, $e, $s]);
    foreach ($st as $r) $out[] = $r + ['kind' => 'pinjam'];
    return $out;
}

function blocker_text(array $b): string
{
    $pre = $b['kind'] === 'kuliah' ? 'Bentrok dengan jadwal kuliah: ' : 'Bentrok dengan peminjaman yang sudah disetujui: ';
    return $pre . $b['title'] . ', ' . fm((int) $b['s']) . ' sampai ' . fm((int) $b['e']) . '.';
}

/* status mengikuti waktu: disetujui -> berjalan saat jamnya tiba -> selesai setelah jam selesai */
function refresh_statuses(): void
{
    $now = date('Y-m-d H:i:s');
    db()->prepare("UPDATE bookings SET status = 'selesai' WHERE status IN ('disetujui','berjalan') AND TIMESTAMP(tanggal, jam_selesai) <= ?")->execute([$now]);
    db()->prepare("UPDATE bookings SET status = 'berjalan' WHERE status = 'disetujui' AND TIMESTAMP(tanggal, jam_mulai) <= ?")->execute([$now]);
}

/* tanggal dan jam peminjaman yang boleh diajukan */
function check_slot(string $date, int $s, int $e): void
{
    if (!valid_date($date)) throw new RuleError('Pilih tanggal.');
    $today = date('Y-m-d');
    if ($date < $today) throw new RuleError('Tanggal itu sudah lewat.');
    if (dow($date) === 6) throw new RuleError('Kampus tidak melayani peminjaman hari Minggu.');
    if ($s < MIN0 || $e > MIN1) throw new RuleError('Peminjaman hanya bisa antara ' . fm(MIN0) . ' dan ' . fm(MIN1) . '.');
    if ($e <= $s) throw new RuleError('Jam selesai harus sesudah jam mulai.');
    $nowMin = (int) date('G') * 60 + (int) date('i');
    if ($date === $today && $s < $nowMin) throw new RuleError('Jam mulai ' . fm($s) . ' hari ini sudah lewat. Pilih jam lain.');
}

/* data yang dikirim ke halaman, disesuaikan dengan peran */
function state_for(array $u): array
{
    refresh_statuses();
    $isAdmin = $u['role'] === 'admin';
    $db = db();

    $classes = array_map(fn($c) => [
        'id' => (string) $c['id'], 'day' => (int) $c['hari'], 's' => (int) $c['s'], 'e' => (int) $c['e'],
        'room' => $c['room_id'], 'title' => $c['mata_kuliah'],
    ], $db->query('SELECT id, hari, TIME_TO_SEC(jam_mulai) DIV 60 AS s, TIME_TO_SEC(jam_selesai) DIV 60 AS e, room_id, mata_kuliah FROM classes')->fetchAll());

    $now = date('Y-m-d H:i:s');
    $st = $db->prepare('SELECT b.id, b.tanggal, TIME_TO_SEC(b.jam_mulai) DIV 60 AS s, TIME_TO_SEC(b.jam_selesai) DIV 60 AS e, b.room_id, b.keperluan, b.status, b.pemohon, b.user_id, b.surat_nama,
        TIMESTAMP(b.tanggal, b.jam_selesai) <= ? AS lewat, m.nim
        FROM bookings b LEFT JOIN mahasiswa m ON m.user_id = b.user_id ORDER BY b.tanggal, b.jam_mulai');
    $st->execute([$now]);
    $bookings = [];
    foreach ($st as $b) {
        $mine = (int) $b['user_id'] === (int) $u['id'];
        $row = [
            'id' => (string) $b['id'], 'date' => $b['tanggal'], 's' => (int) $b['s'], 'e' => (int) $b['e'],
            'room' => $b['room_id'], 'title' => $b['keperluan'], 'status' => $b['status'], 'mine' => $mine,
        ];
        /* mahasiswa hanya melihat nama pemohon dan surat milik sendiri */
        if ($isAdmin || $mine) {
            $row['by'] = $b['pemohon'];
            if ($b['surat_nama']) $row['letter'] = $b['surat_nama'];
        }
        if ($isAdmin) {
            $row['lewat'] = (bool) $b['lewat'];
            if ($b['nim']) $row['nim'] = $b['nim'];
        }
        $bookings[] = $row;
    }

    $items = array_map(fn($i) => [
        'id' => (string) $i['id'], 'name' => $i['nama'], 'total' => (int) $i['total'], 'out' => (int) $i['keluar'],
    ], $db->query("SELECT i.id, i.nama, i.total, COALESCE(SUM(CASE WHEN l.status = 'keluar' THEN l.jumlah END), 0) AS keluar
        FROM items i LEFT JOIN loans l ON l.item_id = i.id GROUP BY i.id, i.nama, i.total ORDER BY i.id")->fetchAll());

    $data = ['classes' => $classes, 'bookings' => $bookings, 'items' => $items];
    if ($isAdmin) {
        $data['loans'] = array_map(fn($l) => [
            'id' => (string) $l['id'], 'item' => (string) $l['item_id'], 'qty' => (int) $l['jumlah'], 'by' => $l['peminjam'],
            'date' => $l['tanggal_keluar'], 'back' => $l['tanggal_kembali'], 'status' => $l['status'],
        ], $db->query('SELECT * FROM loans ORDER BY tanggal_keluar, id')->fetchAll());
    }
    return $data;
}

/* data untuk beranda tanpa login: jadwal kuliah, jam terpakai tanpa nama dan keperluan peminjam, dan stok barang */
function public_state(int $days = 14): array
{
    refresh_statuses();
    $db = db();
    $from = date('Y-m-d');
    $to = date('Y-m-d', strtotime("+$days day"));
    $classes = array_map(fn($c) => [
        'day' => (int) $c['hari'], 's' => (int) $c['s'], 'e' => (int) $c['e'], 'room' => $c['room_id'], 'title' => $c['mata_kuliah'],
    ], $db->query('SELECT hari, TIME_TO_SEC(jam_mulai) DIV 60 AS s, TIME_TO_SEC(jam_selesai) DIV 60 AS e, room_id, mata_kuliah FROM classes')->fetchAll());
    $st = $db->prepare("SELECT tanggal, TIME_TO_SEC(jam_mulai) DIV 60 AS s, TIME_TO_SEC(jam_selesai) DIV 60 AS e, room_id, status FROM bookings
        WHERE tanggal BETWEEN ? AND ? AND status IN ('diajukan','disetujui','berjalan') ORDER BY tanggal, jam_mulai");
    $st->execute([$from, $to]);
    $bookings = array_map(fn($b) => [
        'date' => $b['tanggal'], 's' => (int) $b['s'], 'e' => (int) $b['e'], 'room' => $b['room_id'],
        'kind' => $b['status'] === 'diajukan' ? 'ajuan' : 'pinjam',
    ], $st->fetchAll());
    $items = array_map(fn($i) => ['name' => $i['nama'], 'total' => (int) $i['total'], 'free' => (int) $i['total'] - (int) $i['keluar']],
        $db->query("SELECT i.nama, i.total, COALESCE(SUM(CASE WHEN l.status = 'keluar' THEN l.jumlah END), 0) AS keluar
            FROM items i LEFT JOIN loans l ON l.item_id = i.id GROUP BY i.id, i.nama, i.total ORDER BY i.nama")->fetchAll());
    return ['rooms' => rooms(), 'classes' => $classes, 'bookings' => $bookings, 'items' => $items, 'today' => $from, 'until' => $to, 'nowMin' => (int) date('G') * 60 + (int) date('i')];
}
