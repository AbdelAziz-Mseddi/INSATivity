<?php
require_once __DIR__ . '/../config/database.php';
try {
    $db = Database::connect();
    $stmt = $db->query('SELECT * FROM public.users');
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "USERS TABLE:\n";
    print_r($users);
} catch (Throwable $e) {
    echo 'Error: ' . $e->getMessage();
}
