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

    // A user is a "club moderator" when their club_id is set (one club per user).
    public static function isModerator($user) {
        return !empty($user['club_id']);
    }

    // Allow admins (any club) or the moderator of this specific club.
    public static function requireClubManager($clubId) {
        $user = self::authenticate();

        if (($user['role'] ?? null) === 'admin') {
            return $user;
        }

        if (!empty($user['club_id']) && (string)$user['club_id'] === (string)$clubId) {
            return $user;
        }

        Response::error("Access denied. You can only manage your own club's events.", 'FORBIDDEN', 403);
    }

    // Allow admins or any club moderator (used for shared dashboard tools like uploads).
    public static function requireManagerOrAdmin() {
        $user = self::authenticate();

        if (($user['role'] ?? null) === 'admin' || self::isModerator($user)) {
            return $user;
        }

        Response::error('Access denied. Moderators or admins only.', 'FORBIDDEN', 403);
    }
}
