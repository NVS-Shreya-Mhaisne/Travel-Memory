<?php
require_once "../config/db.php";

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-User-Id");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

header("Content-Type: application/json");

// Get userId from header with fallbacks
$headers = getallheaders();
$userId = $headers['X-User-Id'] ?? $headers['x-user-id'] ?? $_SERVER['HTTP_X_USER_ID'] ?? "";

if (!$userId) {
    echo json_encode(["status" => false, "message" => "Unauthorized access"]);
    exit;
}

$cursor = $db->trips->find(["userId" => $userId], ["sort" => ["createdAt" => -1]]);

$data=[];

foreach($cursor as $doc){
    // Convert Mongo BSON to normal array
    $doc = json_decode(json_encode($doc), true);

    // Convert Mongo _id
    $doc["id"] = $doc["_id"]['$oid'] ?? "";
    unset($doc["_id"]);

    // Validate startDate
    if (isset($doc['startDate']) && strtotime($doc['startDate']) !== false) {
        $doc['startDate'] = date('Y-m-d', strtotime($doc['startDate']));
    } else {
        $doc['startDate'] = null; // Set to null if invalid or missing
    }

    $data[]=$doc;
}

echo json_encode([
   "status"=>true,
   "data"=>$data
]);
