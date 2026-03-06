<?php
require_once "../config/db.php";

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-User-Id");
header("Content-Type: application/json");

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
	http_response_code(200);
	exit(0);
}

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

if (!is_array($data) || empty($data["id"])) {
	echo json_encode(["status" => false, "error" => "Missing id"]);
	exit(0);
}

try {
	$id = new MongoDB\BSON\ObjectId($data["id"]);
} catch (Exception $e) {
	echo json_encode(["status" => false, "error" => "Invalid id"]);
	exit(0);
}

$headers = getallheaders();
$userId = $headers['X-User-Id'] ?? $headers['x-user-id'] ?? "";

if (!$userId) {
    echo json_encode(["status" => false, "error" => "Unauthorized access"]);
    exit(0);
}

$delete = $db->trips->deleteOne(["_id" => $id, "userId" => $userId]);

echo json_encode([
	"status" => $delete->getDeletedCount() > 0
]);
