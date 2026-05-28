<?php
require_once __DIR__ . '/../config/database.php';

class ClubModel {
    private $connection;

    public function __construct() {
        $this->connection = Database::connect();
    }

    private function mapClub(array $row) {
        return [
            'id' => $row['id'],
            'name' => $row['name'],
            'category' => $row['category'],
            'logo' => $row['logo'],
            'banner' => $row['banner'],
            'description' => $row['description'],
        ];
    }

    public function getClubById($id) {
        $stmt = $this->connection->prepare('SELECT id, name, category, logo, banner, description FROM public.clubs WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $club = $stmt->fetch(PDO::FETCH_ASSOC);
        return $club ? $this->mapClub($club) : null;
    }

    public function getAllClubs() {
        $stmt = $this->connection->query('SELECT id, name, category, logo, banner, description FROM public.clubs ORDER BY name ASC');
        return array_map([$this, 'mapClub'], $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function createClub($payload) {
        if (!isset($payload['id'], $payload['name'], $payload['category'], $payload['description'])) {
            throw new Exception('Missing required fields');
        }

        $id = trim((string)$payload['id']);
        $name = trim((string)$payload['name']);
        $category = trim((string)$payload['category']);
        $description = trim((string)$payload['description']);
        $banner = trim((string)($payload['banner'] ?? ''));
        $logo = trim((string)($payload['logo'] ?? ("../assets/images/{$id}/profile.jpg")));

        $stmt = $this->connection->prepare(
            'INSERT INTO public.clubs (id, name, category, logo, banner, description)
             VALUES (:id, :name, :category, :logo, :banner, :description)
             RETURNING id, name, category, logo, banner, description'
        );

        try {
            $stmt->execute([
                ':id' => $id, ':name' => $name, ':category' => $category,
                ':logo' => $logo, ':banner' => $banner, ':description' => $description,
            ]);
        } catch (PDOException $e) {
            if ((string)$e->getCode() === '23505') throw new Exception('Club ID or name already exists');
            throw new Exception('Failed to create club in database', 0, $e);
        }
        return $this->mapClub($stmt->fetch(PDO::FETCH_ASSOC));
    }

    public function updateClub($id, $payload) {
        $existing = $this->getClubById($id);
        if (!$existing) throw new Exception('Club not found');

        unset($payload['id']);
        $updated = array_merge($existing, $payload);

        $stmt = $this->connection->prepare(
            'UPDATE public.clubs
             SET name = :name, category = :category, logo = :logo, banner = :banner, description = :description, updated_at = NOW()
             WHERE id = :id RETURNING id, name, category, logo, banner, description'
        );

        try {
            $stmt->execute([
                ':id' => $id, ':name' => $updated['name'], ':category' => $updated['category'],
                ':logo' => $updated['logo'] ?? $existing['logo'], ':banner' => $updated['banner'] ?? $existing['banner'],
                ':description' => $updated['description'],
            ]);
        } catch (PDOException $e) {
            if ((string)$e->getCode() === '23505') throw new Exception('Club name already exists');
            throw new Exception('Failed to update club in database', 0, $e);
        }
        return $this->mapClub($stmt->fetch(PDO::FETCH_ASSOC));
    }

    public function deleteClub($id) {
        $stmt = $this->connection->prepare('DELETE FROM public.clubs WHERE id = :id');
        $stmt->execute([':id' => $id]);
        if ($stmt->rowCount() === 0) throw new Exception('Club not found');
        return true;
    }
}
