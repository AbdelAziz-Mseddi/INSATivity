<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, GET, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../models/ClubModel.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

$action = $_GET['action'] ?? null;
$method = $_SERVER['REQUEST_METHOD'];

$parseJsonBody = function () {
    $body = file_get_contents('php://input');
    return $body ? json_decode($body, true) : [];
};

try {
    $model = new ClubModel();

    switch ($method) {
        case 'GET':
            if ($action === 'get') {
                $id = $_GET['id'] ?? null;
                if (!$id) Response::error("Missing club ID");
                Response::success($model->getClubById($id));
            } elseif ($action === 'getAll') {
                Response::success($model->getAllClubs());
            } else {
                Response::error("Unsupported GET action");
            }
            break;

        case 'POST':
            AuthMiddleware::requireRole(['admin']);
            $payload = $parseJsonBody();
            if (empty($payload)) $payload = $_POST;
            
            $data = $model->createClub($payload);
            Response::success($data, 201, 'Club created successfully');
            break;

        case 'PUT':
        case 'PATCH':
            AuthMiddleware::requireRole(['admin']);
            $id = $_GET['id'] ?? null;
            if (!$id) Response::error("Missing club ID");

            $payload = $parseJsonBody();
            $data = $model->updateClub($id, $payload);
            Response::success($data, 200, 'Club updated successfully');
            break;

        case 'DELETE':
            AuthMiddleware::requireRole(['admin']);
            $id = $_GET['id'] ?? null;
            if (!$id) Response::error("Missing club ID");

            $model->deleteClub($id);
            Response::success(['id' => $id, 'deleted' => true], 200, 'Club deleted successfully');
            break;

        default:
            Response::error("Unsupported HTTP method");
    }

} catch (Throwable $e) {
    Response::error($e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine(), 'SERVER_ERROR', 500);
}
