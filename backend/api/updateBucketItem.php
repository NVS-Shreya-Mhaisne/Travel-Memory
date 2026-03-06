<?php
require_once "../config/db.php";

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

$data = json_decode(file_get_contents("php://input"), true);

$id = $data['id'] ?? "";
if (!$id) {
    echo json_encode(["status" => false, "message" => "Item ID required"]);
    exit;
}

try {
    $updateData = [];
    if (isset($data['completed'])) $updateData['completed'] = (bool)$data['completed'];
    if (isset($data['place'])) $updateData['place'] = $data['place'];

    $db->bucketlist->updateOne(
        ['_id' => new MongoDB\BSON\ObjectId($id)],
        ['$set' => $updateData]
    );
    echo json_encode(["status" => true, "message" => "Bucket list item updated"]);
} catch (Throwable $e) {
    echo json_encode(["status" => false, "message" => $e->getMessage()]);
}
?>
