<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../models/MediaModel.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

$action = $_GET['action'] ?? null;
$method = $_SERVER['REQUEST_METHOD'];

try {
    require_once __DIR__ . '/../config/database.php';
    Database::loadEnvironment(); // Required to load JWT_SECRET for AuthMiddleware

    AuthMiddleware::authenticate(); // Require authentication for any media changes

    $model = new MediaModel();

    if ($method === 'POST' && $action === 'upload') {
        if (!isset($_FILES['file'])) {
            Response::error("Missing 'file' in request");
        }
        $prefix = $_POST['prefix'] ?? '';
        $data = $model->upload($_FILES['file'], $prefix);
        Response::success($data, 201, 'File uploaded successfully');
        
    } elseif ($method === 'DELETE' && $action === 'delete') {
        $body = file_get_contents('php://input');
        $payload = $body ? json_decode($body, true) : [];
        $path = $payload['path'] ?? $_GET['path'] ?? null;
        
        if (!$path) Response::error("Missing file path");

        $model->delete($path);
        Response::success(['deleted' => true], 200, 'File deleted successfully');

    } else {
        Response::error("Unsupported action or method");
    }

} catch (Throwable $e) {
    Response::error($e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine(), 'SERVER_ERROR', 500);
}
