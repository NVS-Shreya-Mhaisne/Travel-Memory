<?php
require_once "../config/db.php";

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-User-Id");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

header("Content-Type: application/json");

// Get userId from header
$headers = getallheaders();
$userId = $headers['X-User-Id'] ?? $headers['x-user-id'] ?? "";

if (!$userId) {
    echo json_encode(["status" => false, "message" => "Unauthorized access"]);
    exit;
}

$id = $_GET["id"];

$trip = $db->trips->findOne([
   "_id"=>new MongoDB\BSON\ObjectId($id),
   "userId" => $userId
]);

if (!$trip) {
    echo json_encode(["status" => false, "message" => "Trip not found or unauthorized"]);
    exit;
}

$trip["id"]=(string)$trip["_id"];
unset($trip["_id"]);

echo json_encode([
   "status"=>true,
   "data"=>$trip
]);
