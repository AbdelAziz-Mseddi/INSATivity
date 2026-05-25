<?php

namespace App\Repositories;

require_once __DIR__ . '/../../../vendor/autoload.php';

use Dotenv\Dotenv;
use PDO;
use PDOException;
use Exception;

class Database {
    private static $dotenv;

    public static function connect() {
        self::loadEnvironment();

        if (!class_exists('PDO') || !in_array('pgsql', PDO::getAvailableDrivers(), true)) {
            throw new Exception('PDO PostgreSQL driver is not enabled in PHP. Install/enable pdo_pgsql.');
        }

        $host = self::getRequiredEnv('DATABASE_HOST');
        $port = self::getOptionalEnv('DATABASE_PORT', '5432');
        $dbname = self::getOptionalEnv('DATABASE_NAME', 'postgres');
        $user = self::getRequiredEnv('DATABASE_USER');
        $password = self::getRequiredEnv('DATABASE_PASSWORD');
        $sslmode = self::getOptionalEnv('SUPABASE_DB_SSLMODE', 'require');

        $dsn = sprintf(
            'pgsql:host=%s;port=%s;dbname=%s;sslmode=%s;application_name=INSATivity',
            $host,
            $port,
            $dbname,
            $sslmode
        );

        try {
            $connection = new PDO($dsn, $user, $password, [
                # This tells PDO to throw exceptions when something fails (bad SQL, connection issue, constraint violation), instead of silently returning false.
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                # This makes fetch() return rows as associative arrays by default, instead of numeric-index arrays.
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                # This forces real prepared statements at the PostgreSQL server level (not emulated by PHP), stricter and more accurate with types and SQL semantics.
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            throw new Exception('Failed to connect to Supabase Postgres: ' . $e->getMessage());
        }

        return $connection;
    }

    # t chargilek environment variable li hajtek biha
    private static function getRequiredEnv($key) {
        $value = getenv($key);
        if ($value === false || trim((string)$value) === '') {
            throw new Exception("Missing required environment variable: {$key}");
        }
        return $value;
    }

    # Get optional environment variable with a default fallback
    private static function getOptionalEnv($key, $default = '') {
        $value = getenv($key);
        return $value !== false ? $value : $default;
    }

    # y chargi l environment variables mel .env w y injectihom fel superglobals
    # (bech n accediwelhom fel $_ENV w getenv())
    private static function loadEnvironment() {
        if (self::$dotenv !== null) {
            return;
        }

        try {
            $projectRoot = __DIR__ . '/../../..';
            $envFile = $projectRoot . '/.env';
            
            if (!file_exists($envFile)) {
                throw new Exception("Environment file not found at: {$envFile}");
            }

            self::$dotenv = Dotenv::createImmutable($projectRoot);
            self::$dotenv->load();
            
            // Dotenv loads into $_ENV but not into the environment/getenv()
            // Explicitly populate getenv() for consistency
            foreach ($_ENV as $key => $value) {
                putenv("{$key}={$value}");
            }
        } catch (\Exception $e) {
            throw new Exception('Failed to load environment variables: ' . $e->getMessage());
        }
    }
}
