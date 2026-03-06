<?php
require_once "config/db.php";

header("Content-Type: application/json");

try {
    $cursor = $db->user->find([], ["limit" => 5]);
    $results = [];
    foreach ($cursor as $doc) {
        $results[] = [
            "id" => (string)$doc["_id"],
            "name" => $doc["name"] ?? "N/A",
            "email" => $doc["email"] ?? "N/A"
        ];
    }
    echo json_encode($results, JSON_PRETTY_PRINT);
} catch (Throwable $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
