<?php

namespace App\Controllers;

use App\Services\AuthService;
use Exception;
use Throwable;

class AuthController {
    private AuthService $authService;

    public function __construct() {
        $this->authService = new AuthService();
    }

    /**
     * Handle the user login request and establish the session.
     */
    public function handleLogin(): void {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            header('Location: ../pages/login.html');
            exit;
        }

        $username = trim($_POST['username'] ?? '');
        $password = $_POST['password'] ?? '';

        try {
            // Load auth helpers if needed for session
            require_once __DIR__ . '/../../auth.php';
            startAppSession();

            $user = $this->authService->loginUser($username, $password);

            // Security: regenerate session ID to prevent fixation attacks
            session_regenerate_id(true);

            // Store user details in session
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['full_name'] = $user['full_name'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['email'] = $user['email'];
            $_SESSION['role'] = $user['role'];

            header('Location: ../pages/index.html');
            exit;
        } catch (Exception $e) {
            $errorCode = $e->getMessage();
            header('Location: ../pages/login.html?error=' . urlencode($errorCode));
            exit;
        } catch (Throwable $e) {
            error_log($e->getMessage());
            header('Location: ../pages/login.html?error=server');
            exit;
        }
    }

    /**
     * Handle the user registration request.
     */
    public function handleRegister(): void {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            header('Location: ../pages/register.html');
            exit;
        }

        try {
            $this->authService->registerUser($_POST);
            header('Location: ../pages/login.html?success=registered');
            exit;
        } catch (Exception $e) {
            $errorCode = $e->getMessage();
            header('Location: ../pages/register.html?error=' . urlencode($errorCode));
            exit;
        } catch (Throwable $e) {
            error_log($e->getMessage());
            header('Location: ../pages/register.html?error=server');
            exit;
        }
    }

    /**
     * Handle user logout and destroy the session.
     */
    public function handleLogout(): void {
        require_once __DIR__ . '/../../auth.php';
        startAppSession();

        // Clear all session values
        $_SESSION = [];

        // Delete the session cookie
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params['path'],
                $params['domain'] ?? '',
                $params['secure'],
                $params['httponly']
            );
        }

        // Destroy server session
        session_destroy();

        header('Location: ../pages/login.html?success=logout');
        exit;
    }
}
