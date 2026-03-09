<?php
require_once "../config/db.php";

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-User-Id");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

header("Content-Type: application/json");

// Get headers
$headers = getallheaders();

// Get userId from multiple sources
$userId =
    $headers['X-User-Id']
    ?? $headers['x-user-id']
    ?? $_SERVER['HTTP_X_USER_ID']
    ?? $_GET['userId']
    ?? "";

// Validate userId
if (!$userId) {
    echo json_encode([
        "status" => false,
        "message" => "Unauthorized access"
    ]);
    exit;
}

// Fetch trips
$cursor = $db->trips->find(
    ["userId" => $userId],
    ["sort" => ["createdAt" => -1]]
);

$data = [];

foreach ($cursor as $doc) {

    // Convert BSON to array
    $doc = json_decode(json_encode($doc), true);

    // Convert Mongo _id
    $doc["id"] = $doc["_id"]['$oid'] ?? "";
    unset($doc["_id"]);

    // Format startDate safely
    if (isset($doc['startDate']) && strtotime($doc['startDate']) !== false) {
        $doc['startDate'] = date('Y-m-d', strtotime($doc['startDate']));
    } else {
        $doc['startDate'] = null;
    }

    $data[] = $doc;
}

echo json_encode([
    "status" => true,
    "data" => $data
]);