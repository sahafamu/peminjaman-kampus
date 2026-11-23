<?php
/* Membuka surat pengajuan PDF. ?id=<booking>  [&unduh=1 untuk mengunduh]. Hanya admin atau pemilik pengajuan. */
declare(strict_types=1);
require __DIR__ . '/../app/bootstrap.php';

$u = current_user();
if (!$u) { http_response_code(401); exit('Silakan masuk dulu.'); }

$st = db()->prepare('SELECT b.*, r.nama AS room_name FROM bookings b JOIN rooms r ON r.id = b.room_id WHERE b.id = ?');
$st->execute([(int) ($_GET['id'] ?? 0)]);
$b = $st->fetch();
if (!$b || !$b['surat_nama'] || ($u['role'] !== 'admin' && (int) $b['user_id'] !== (int) $u['id'])) {
    http_response_code(404);
    exit('Surat tidak ditemukan.');
}

/* PDF contoh satu halaman, untuk data awal yang tidak punya berkas asli */
function sample_pdf(array $lines): string
{
    $t = fn($s) => str_replace(['\\', '(', ')'], '', preg_replace('/[^\x20-\x7e]/', '', (string) $s));
    $body = 'BT /F1 14 Tf 56 760 Td 20 TL ' . implode(' ', array_map(fn($l) => '(' . $t($l) . ') Tj T*', $lines)) . ' ET';
    $objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 5 0 R /Resources << /Font << /F1 4 0 R >> >> >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', '<< /Length ' . strlen($body) . " >>\nstream\n$body\nendstream"];
    $out = "%PDF-1.4\n";
    $pos = [];
    foreach ($objs as $i => $o) { $pos[] = strlen($out); $out .= ($i + 1) . " 0 obj\n$o\nendobj\n"; }
    $x = strlen($out);
    $out .= "xref\n0 " . (count($objs) + 1) . "\n0000000000 65535 f \n";
    foreach ($pos as $p) $out .= sprintf('%010d', $p) . " 00000 n \n";
    return $out . "trailer\n<< /Size " . (count($objs) + 1) . " /Root 1 0 R >>\nstartxref\n$x\n%%EOF";
}

$path = $b['surat_file'] ? config('storage') . '/' . basename($b['surat_file']) : null;
if ($path && is_file($path)) {
    $pdf = null;
} else {
    $pdf = sample_pdf(['Surat pengajuan peminjaman (contoh)', 'Berkas: ' . $b['surat_nama'], 'Peminjam: ' . $b['pemohon'],
        'Ruang: ' . $b['room_name'], 'Keperluan: ' . $b['keperluan'], 'Tanggal: ' . $b['tanggal']]);
}

$name = $b['surat_nama'];
$ascii = preg_replace('/[^A-Za-z0-9._-]/', '_', $name);
header('Content-Type: application/pdf');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: private, no-store');
header(sprintf('Content-Disposition: %s; filename="%s"; filename*=UTF-8\'\'%s', isset($_GET['unduh']) ? 'attachment' : 'inline', $ascii, rawurlencode($name)));
header('Content-Length: ' . ($pdf === null ? filesize($path) : strlen($pdf)));
$pdf === null ? readfile($path) : print $pdf;
