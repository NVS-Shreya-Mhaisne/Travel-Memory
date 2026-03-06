<?php
require_once "../config/db.php";

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

$id = $_GET['id'] ?? "";

if (!$id) {
    echo json_encode(["status" => false, "message" => "Item ID required"]);
    exit;
}

try {
    $db->bucketlist->deleteOne(['_id' => new MongoDB\BSON\ObjectId($id)]);
    echo json_encode(["status" => true, "message" => "Bucket list item deleted"]);
} catch (Throwable $e) {
    echo json_encode(["status" => false, "message" => $e->getMessage()]);
}
?>
