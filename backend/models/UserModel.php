<?php
require_once __DIR__ . '/../config/database.php';

class UserModel {
    private $connection;

    public function __construct() {
        $this->connection = Database::connect();
    }

    public function findByEmailOrUsername($login) {
        $stmt = $this->connection->prepare(
            "SELECT id, full_name, username, email, password_hash, role, club_id
             FROM users WHERE username = :login OR email = :login LIMIT 1"
        );
        $stmt->execute(['login' => $login]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function createUser($fullName, $username, $email, $major, $passwordHash, $role = 'student') {
        $stmt = $this->connection->prepare(
            "INSERT INTO users (full_name, username, email, major, password_hash, role)
             VALUES (:full_name, :username, :email, :major, :password_hash, :role)"
        );

        try {
            $stmt->execute([
                'full_name' => $fullName,
                'username' => $username,
                'email' => $email,
                'major' => $major,
                'password_hash' => $passwordHash,
                'role' => $role,
            ]);
            return true;
        } catch (PDOException $e) {
            if ((string)$e->getCode() === '23505') {
                throw new Exception('User with this email or username already exists');
            }
            throw new Exception('Database error: ' . $e->getMessage());
        }
    }
}
