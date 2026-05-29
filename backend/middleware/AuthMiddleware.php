<?php
require_once __DIR__ . '/../utils/Response.php';

class AuthMiddleware {
    public static function startSession() {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }
    }

    public static function authenticate() {
        self::startSession();

        if (empty($_SESSION['user'])) {
            Response::error('Authentication required. Please log in.', 'AUTH_MISSING', 401);
        }

        return $_SESSION['user'];
    }

    public static function requireRole($allowedRoles) {
        $user = self::authenticate();
        $role = $user['role'] ?? 'student';

        if (!in_array($role, $allowedRoles, true)) {
            Response::error('Access denied. Insufficient permissions.', 'FORBIDDEN', 403);
        }

        return $user;
    }
}
