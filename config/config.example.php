<?php
/* Contoh pengaturan. Salin menjadi config.php lalu isi user dan password MySQL-mu (config.php tidak ikut di-commit). */
return [
    'db' => [
        'host' => '127.0.0.1',
        'port' => 3306,
        'name' => 'peminjaman_kampus',
        'user' => 'root',
        'pass' => '',
    ],
    'timezone' => 'Asia/Jakarta',
    /* folder surat PDF, tidak bisa dibuka langsung dari browser */
    'storage' => dirname(__DIR__) . '/storage/surat',
    'surat_max' => 2 * 1024 * 1024,
    /* alamat dasar aplikasi; kosongkan agar dihitung otomatis (misalnya /peminjaman-kampus/) */
    'base_url' => '',
];
