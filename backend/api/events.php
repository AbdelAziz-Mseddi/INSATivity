<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, GET, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../models/EventModel.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

$action = $_GET['action'] ?? null;
$method = $_SERVER['REQUEST_METHOD'];

$parseJsonBody = function () {
    $body = file_get_contents('php://input');
    return $body ? json_decode($body, true) : [];
};

try {
    $model = new EventModel();

    switch ($method) {
        case 'GET':
            if ($action === 'get') {
                $id = $_GET['id'] ?? null;
                if (!$id) Response::error("Missing event ID");
                Response::success($model->getEventById($id));
            } elseif ($action === 'getAll') {
                Response::success($model->getAllEvents());
            } elseif ($action === 'getByClub') {
                $club = $_GET['club'] ?? null;
                if (!$club) Response::error("Missing club name");
                Response::success($model->getEventsByClub($club));
            } else {
                Response::error("Unsupported GET action");
            }
            break;

        case 'POST':
            $payload = $parseJsonBody();
            if (empty($payload)) $payload = $_POST;

            if ($action === 'feedback') {
                $data = $model->createEventFeedback($payload);
                Response::success($data, 201, 'Feedback submitted successfully');
                break;
            }

            if ($action === 'review') {
                $id = $_GET['id'] ?? ($payload['eventId'] ?? null);
                if (!$id) Response::error('Missing event ID');

                AuthMiddleware::requireClubManager($model->clubIdForEvent($id));

                $data = $model->upsertEventReview($id, $payload);
                Response::success($data, 200, 'Event review saved successfully');
                break;
            }

            // Only an admin or the moderator of the target club may create events for it.
            AuthMiddleware::requireClubManager($model->clubIdForName($payload['club'] ?? ''));

            $data = $model->createEvent($payload);
            Response::success($data, 201, 'Event created successfully');
            break;

        case 'PUT':
        case 'PATCH':
            $id = $_GET['id'] ?? null;
            if (!$id) Response::error("Missing event ID");

            if ($action === 'approve') {
                AuthMiddleware::requireRole(['admin']); // Only admins can approve pending events
                $data = $model->approveEvent($id);
                Response::success($data, 200, 'Event approved successfully');
                break;
            }

            // Only an admin or the moderator of the event's club may edit it.
            AuthMiddleware::requireClubManager($model->clubIdForEvent($id));

            $payload = $parseJsonBody();
            $data = $model->updateEvent($id, $payload);
            Response::success($data, 200, 'Event updated successfully');
            break;

        case 'DELETE':
            AuthMiddleware::requireRole(['admin']); // example of restricting deletion
            $id = $_GET['id'] ?? null;
            if (!$id) Response::error("Missing event ID");

            $model->deleteEvent($id);
            Response::success(['id' => (int)$id, 'deleted' => true], 200, 'Event deleted successfully');
            break;

        default:
            Response::error("Unsupported HTTP method");
    }

} catch (Throwable $e) {
    Response::error($e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine(), 'SERVER_ERROR', 500);
}
