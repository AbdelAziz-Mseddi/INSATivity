<?php

namespace App\Repositories;

use App\Repositories\Database;
use PDO;
use PDOException;
use Exception;

class UserRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Database::connect();
    }

    /**
     * Find a user by their username or email.
     */
    public function findByUsernameOrEmail(string $identifier): ?array {
        $stmt = $this->db->prepare(
            "SELECT id, full_name, username, email, major, password_hash, role, created_at
             FROM public.users
             WHERE username = :identifier OR email = :identifier
             LIMIT 1"
        );
        $stmt->execute(['identifier' => $identifier]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /**
     * Create a new user record in the database.
     */
    public function createUser(array $data): array {
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO public.users (full_name, username, email, major, password_hash, role)
                 VALUES (:full_name, :username, :email, :major, :password_hash, :role)
                 RETURNING id, full_name, username, email, major, role, created_at"
            );

            $stmt->execute([
                'full_name' => $data['full_name'],
                'username' => $data['username'],
                'email' => $data['email'],
                'major' => $data['major'],
                'password_hash' => $data['password_hash'],
                'role' => $data['role'] ?? 'student'
            ]);

            $user = $stmt->fetch();
            if (!$user) {
                throw new Exception('Failed to retrieve created user account.');
            }
            return $user;
        } catch (PDOException $e) {
            if ((string) $e->getCode() === '23505') {
                throw new Exception('already_exists');
            }
            throw new Exception('server', 0, $e);
        }
    }
}
