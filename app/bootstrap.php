<?php
/* Inti aplikasi: konfigurasi, koneksi database, sesi login, CSRF, dan alamat URL. Dipanggil di awal setiap halaman. */
declare(strict_types=1);

const APP_ROOT = __DIR__ . '/..';
$GLOBALS['PK_CONFIG'] = require APP_ROOT . '/config/config.php';
date_default_timezone_set($GLOBALS['PK_CONFIG']['timezone']);

/* folder halaman untuk tiap peran. Peran baru (misalnya pegawai kampus) cukup ditambah di sini. */
const ROLE_HOME = ['admin' => 'admin/', 'mahasiswa' => 'mahasiswa/'];
const ROLE_LABEL = ['admin' => 'Admin', 'mahasiswa' => 'Mahasiswa'];

function config(string $key): mixed
{
    return $GLOBALS['PK_CONFIG'][$key] ?? null;
}

/* alamat dasar aplikasi, misalnya /peminjaman-kampus/ */
function base_url(): string
{
    static $base = null;
    if ($base === null) {
        $base = config('base_url');
        if (!$base) {
            $root = str_replace('\\', '/', (string) realpath(APP_ROOT));
            $doc = rtrim(str_replace('\\', '/', (string) realpath($_SERVER['DOCUMENT_ROOT'] ?? '')), '/');
            $base = ($doc !== '' && stripos($root, $doc) === 0) ? substr($root, strlen($doc)) : '';
        }
        $base = '/' . trim($base, '/') . '/';
        if ($base === '//') $base = '/';
    }
    return $base;
}

function url(string $path = ''): string
{
    return base_url() . ltrim($path, '/');
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $c = config('db');
        $pdo = new PDO(
            "mysql:host={$c['host']};port={$c['port']};dbname={$c['name']};charset=utf8mb4",
            $c['user'],
            $c['pass'],
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );
    }
    return $pdo;
}

function start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) return;
    session_name('pk_sesi');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => base_url(),
        'httponly' => true,
        'samesite' => 'Lax',
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    ]);
    ini_set('session.use_strict_mode', '1');
    session_start();
    /* browser masih membawa cookie sesi, tapi datanya sudah hilang di server: sesinya kedaluwarsa */
    $GLOBALS['PK_SESSION_LOST'] = isset($_COOKIE[session_name()]) && empty($_SESSION);
    if (empty($_SESSION)) $_SESSION['mulai'] = time();
}

function e(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function redirect(string $to): never
{
    header('Location: ' . $to);
    exit;
}

/* pengguna yang sedang masuk, beserta NIM bila mahasiswa */
function current_user(): ?array
{
    start_session();
    if (empty($_SESSION['uid'])) return null;
    static $u = false;
    if ($u === false) {
        $st = db()->prepare('SELECT u.id, u.username, u.nama, u.role, m.nim FROM users u LEFT JOIN mahasiswa m ON m.user_id = u.id WHERE u.id = ?');
        $st->execute([$_SESSION['uid']]);
        $u = $st->fetch() ?: null;
        if (!$u) unset($_SESSION['uid']);
    }
    return $u;
}

function home_for(array $u): string
{
    return url(ROLE_HOME[$u['role']] ?? '');
}

/* halaman yang bergantung pada login tidak boleh disimpan browser, agar tombol Back
   sesudah keluar tidak menampilkan salinan lama dan selalu bertanya ke server */
function no_cache(): void
{
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0, private');
    header('Pragma: no-cache');
    header('Expires: 0');
}

/* halaman: arahkan ke login bila belum masuk, atau ke dashboard sendiri bila perannya lain */
function require_role(string ...$roles): array
{
    no_cache();
    $u = current_user();
    if (!$u) {
        $here = substr((string) ($_SERVER['REQUEST_URI'] ?? ''), strlen(base_url()));
        /* sesi=keluar bila baru saja keluar, sesi=habis bila sesinya sudah tidak berlaku */
        $why = !empty($_SESSION['keluar']) ? '&sesi=keluar' : (!empty($GLOBALS['PK_SESSION_LOST']) ? '&sesi=habis' : '');
        redirect(url('auth/login.php?lanjut=' . rawurlencode($here) . $why));
    }
    if (!in_array($u['role'], $roles, true)) redirect(home_for($u));
    return $u;
}

/* tujuan setelah login: hanya halaman di folder peran itu sendiri, dengan isian query sederhana */
function safe_next(?string $next, array $u): string
{
    $next = (string) $next;
    $home = ROLE_HOME[$u['role']] ?? '';
    if ($home !== '' && preg_match('#^' . preg_quote($home, '#') . '([a-z-]+\.php)?(\?[A-Za-z0-9=&%:._+-]*)?$#', $next)) return url($next);
    return home_for($u);
}

function login_user(array $u): void
{
    start_session();
    session_regenerate_id(true);
    unset($_SESSION['keluar'], $_SESSION['gagal']);
    $_SESSION['uid'] = (int) $u['id'];
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
}

function csrf_token(): string
{
    start_session();
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
    return $_SESSION['csrf'];
}

function csrf_ok(?string $t): bool
{
    start_session();
    return is_string($t) && !empty($_SESSION['csrf']) && hash_equals($_SESSION['csrf'], $t);
}

function json_for_script(mixed $data): string
{
    return json_encode($data, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
}

/* data awal untuk JavaScript halaman, disisipkan sebagai window.PK_BOOT */
function boot_script(array $u): string
{
    require_once __DIR__ . '/rules.php';
    $boot = [
        'base' => base_url(),
        'user' => ['nama' => $u['nama'], 'username' => $u['username'], 'role' => $u['role'], 'nim' => $u['nim'] ?? null],
        'csrf' => csrf_token(),
        'rooms' => rooms(),
        'data' => state_for($u),
    ];
    return '<script>window.PK_BOOT = ' . json_for_script($boot) . ';</script>';
}
