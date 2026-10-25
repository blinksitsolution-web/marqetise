<?php

$user = getenv('DB_USERNAME') ?: '';
$password = getenv('DB_PASSWORD');
$password = is_string($password) ? $password : '';
$host = getenv('DB_HOST') ?: '127.0.0.1';
$port = getenv('DB_PORT') ?: '3306';
$database = getenv('DB_DATABASE') ?: '';

if ($user === '' || strcasecmp($user, 'root') === 0) {
    fwrite(STDERR, "Refusing to create a database as root or without DB_USERNAME.\n");
    exit(1);
}

if ($password === '') {
    fwrite(STDERR, "Refusing to create a database with an empty password.\n");
    exit(1);
}

if (! preg_match('/^[A-Za-z0-9_]+$/', $database)) {
    fwrite(STDERR, "DB_DATABASE must be letters, numbers, and underscores only.\n");
    exit(1);
}

if (! preg_match('/^[A-Za-z0-9._-]+$/', $host) || ! preg_match('/^[0-9]+$/', (string) $port)) {
    fwrite(STDERR, "DB_HOST or DB_PORT is not usable.\n");
    exit(1);
}

$pdo = new PDO(
    sprintf('mysql:host=%s;port=%s', $host, $port),
    $user,
    $password,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);
$pdo->exec('CREATE DATABASE IF NOT EXISTS `'.$database.'` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
echo "database-ready\n";
