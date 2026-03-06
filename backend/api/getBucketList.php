<?php
require_once "../config/db.php";

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-User-Id");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

// Get userId from header or query param
$headers = getallheaders();
$userId = $headers['X-User-Id'] ?? $headers['x-user-id'] ?? $_GET['userId'] ?? "";

if (!$userId) {
    echo json_encode(["status" => false, "message" => "User ID required"]);
    exit;
}

try {
    $cursor = $db->bucketlist->find(["userId" => $userId], ["sort" => ["createdAt" => -1]]);
    $data = [];
    foreach ($cursor as $doc) {
        $doc = json_decode(json_encode($doc), true);
        $doc["id"] = $doc["_id"]['$oid'] ?? "";
        unset($doc["_id"]);
        $data[] = $doc;
    }
    echo json_encode(["status" => true, "data" => $data]);
} catch (Throwable $e) {
    echo json_encode(["status" => false, "message" => $e->getMessage()]);
}
?>
