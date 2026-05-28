<?php
require_once __DIR__ . '/../config/database.php';
try {
    $db = Database::connect();
    $stmt = $db->prepare('UPDATE public.events SET is_approved = TRUE');
    $stmt->execute();
    echo 'Successfully updated all events to is_approved = TRUE';
} catch (Throwable $e) {
    echo 'Error: ' . $e->getMessage();
}
