<?php
// Site entry point. Visiting the root URL lands the user on the right page
// without needing to type a path: logged-in users go to the main events
// page, everyone else goes to login.
require_once __DIR__ . '/backend/middleware/AuthMiddleware.php';

AuthMiddleware::startSession();

if (!empty($_SESSION['user'])) {
    header('Location: pages/index.html');
} else {
    header('Location: pages/login.html');
}
exit;
