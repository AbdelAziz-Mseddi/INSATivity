<?php

namespace App\Services;

use App\Repositories\UserRepository;
use Exception;

class AuthService {
    private UserRepository $userRepository;

    public function __construct() {
        $this->userRepository = new UserRepository();
    }

    /**
     * Validate and register a new user.
     */
    public function registerUser(array $payload): array {
        $fullName = trim($payload['fullName'] ?? '');
        $username = trim($payload['username'] ?? '');
        $emailInput = trim($payload['email'] ?? '');
        $major = trim($payload['major'] ?? '');
        $password = $payload['password'] ?? '';
        $confirmPassword = $payload['confirmPassword'] ?? '';
        $acceptTerms = isset($payload['acceptTerms']) || !empty($payload['acceptTerms']);

        // Normalization
        $emailInput = strtolower($emailInput);
        $username = strtolower($username);
        $major = strtoupper($major);

        if ($fullName === '') {
            throw new Exception('full_name_required');
        }

        if ($username === '') {
            throw new Exception('username_required');
        } elseif (strlen($username) < 3) {
            throw new Exception('username_too_short');
        }

        if ($emailInput === '') {
            throw new Exception('email_required');
        }

        $email = str_contains($emailInput, '@') ? $emailInput : $emailInput . '@insat.ucar.tn';

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception('email_invalid');
        } elseif (!str_ends_with($email, '@insat.ucar.tn')) {
            throw new Exception('email_domain_invalid');
        }

        $allowedMajors = ['MPI', 'CBA', 'GL', 'RT', 'IIA', 'IMI', 'BIO', 'CH'];
        if ($major === '') {
            throw new Exception('major_required');
        } elseif (!in_array($major, $allowedMajors, true)) {
            throw new Exception('major_invalid');
        }

        if ($password === '') {
            throw new Exception('password_required');
        } elseif (strlen($password) < 6) {
            throw new Exception('password_too_short');
        }

        if ($confirmPassword === '') {
            throw new Exception('confirm_password_required');
        } elseif ($password !== $confirmPassword) {
            throw new Exception('passwords_not_match');
        }

        if (!$acceptTerms) {
            throw new Exception('terms_required');
        }

        // Check if username already exists
        $userByUsername = $this->userRepository->findByUsernameOrEmail($username);
        if ($userByUsername && $userByUsername['username'] === $username) {
            throw new Exception('username_exists');
        }

        // Check if email already exists
        $userByEmail = $this->userRepository->findByUsernameOrEmail($email);
        if ($userByEmail && $userByEmail['email'] === $email) {
            throw new Exception('email_exists');
        }

        // Hash password
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        if ($passwordHash === false) {
            throw new Exception('server');
        }

        return $this->userRepository->createUser([
            'full_name' => $fullName,
            'username' => $username,
            'email' => $email,
            'major' => $major,
            'password_hash' => $passwordHash,
            'role' => 'student'
        ]);
    }

    /**
     * Validate credentials and return user details (excluding password hash).
     */
    public function loginUser(string $identifier, string $password): array {
        $identifier = strtolower(trim($identifier));

        if ($identifier === '' || $password === '') {
            throw new Exception('empty');
        }

        $user = $this->userRepository->findByUsernameOrEmail($identifier);
        if (!$user) {
            throw new Exception('not_found');
        }

        if (!password_verify($password, $user['password_hash'])) {
            throw new Exception('wrong_password');
        }

        unset($user['password_hash']);
        return $user;
    }
}
