<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

AuthMiddleware::startSession();

$action = $_GET['action'] ?? null;
$method = $_SERVER['REQUEST_METHOD'];

$parseJsonBody = function () {
    $body = file_get_contents('php://input');
    return $body ? json_decode($body, true) : [];
};

try {
    $model = new UserModel();

    if ($method === 'POST' && $action === 'login') {
        $payload = $parseJsonBody();
        $username = trim($payload['username'] ?? '');
        $password = $payload['password'] ?? '';

        if (!$username || !$password) {
            Response::error('Username and password are required', 'MISSING_CREDENTIALS');
        }

        $user = $model->findByEmailOrUsername($username);

        if (!$user || !password_verify($password, $user['password_hash'])) {
            Response::error('Invalid credentials', 'INVALID_CREDENTIALS', 401);
        }

        unset($user['password_hash']);
        $_SESSION['user'] = $user;

        Response::success(['user' => $user], 200, 'Login successful');

    } elseif ($method === 'POST' && $action === 'register') {
        $payload = $parseJsonBody();
        $fullName = trim($payload['fullName'] ?? '');
        $username = trim($payload['username'] ?? '');
        $email = trim($payload['email'] ?? '');
        $major = trim($payload['major'] ?? '');
        $password = $payload['password'] ?? '';

        if (!$fullName || !$username || !$email || !$major || !$password) {
            Response::error('All fields are required', 'MISSING_FIELDS');
        }
        
        $email = strtolower($email);
        if (!str_contains($email, '@')) {
            $email .= '@insat.ucar.tn';
        }

        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        $model->createUser($fullName, $username, $email, $major, $passwordHash);

        $user = $model->findByEmailOrUsername($username);
        unset($user['password_hash']);
        $_SESSION['user'] = $user;

        Response::success(['user' => $user], 201, 'Registration successful');

    } elseif ($method === 'GET' && $action === 'me') {
        $user = AuthMiddleware::authenticate();
        Response::success(['user' => $user]);

    } elseif ($method === 'POST' && $action === 'logout') {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
        }
        session_destroy();
        Response::success(['loggedOut' => true], 200, 'Logged out');

    } else {
        Response::error('Unsupported action', 'BAD_REQUEST');
    }
} catch (Throwable $e) {
    Response::error($e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine(), 'SERVER_ERROR', 500);
}
