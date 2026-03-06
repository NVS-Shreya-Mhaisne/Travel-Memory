<?php
require_once "../config/db.php";

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-User-Id");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

$data = json_decode(file_get_contents("php://input"), true);

$headers = getallheaders();
$userId = $headers['X-User-Id'] ?? $headers['x-user-id'] ?? $data['userId'] ?? "";
$place = $data['place'] ?? "";

if (!$userId || !$place) {
    echo json_encode(["status" => false, "message" => "User ID and Place are required"]);
    exit;
}

try {
    $insert = $db->bucketlist->insertOne([
        "userId" => $userId,
        "place" => $place,
        "completed" => false,
        "votes" => rand(50, 250),
        "createdAt" => new MongoDB\BSON\UTCDateTime()
    ]);
    echo json_encode(["status" => true, "message" => "Destination added to bucket list", "id" => (string)$insert->getInsertedId()]);
} catch (Throwable $e) {
    echo json_encode(["status" => false, "message" => $e->getMessage()]);
}
?>
