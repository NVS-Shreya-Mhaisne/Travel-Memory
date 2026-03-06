<?php
require_once "config/db.php";

header("Content-Type: application/json");

try {
    $cursor = $db->trips->find([], ["limit" => 20, "sort" => ["createdAt" => -1]]);
    $results = [];
    foreach ($cursor as $doc) {
        $doc = json_decode(json_encode($doc), true);
        $results[] = [
            "id" => $doc["_id"]['$oid'] ?? (string)$doc["_id"],
            "location" => $doc["location"] ?? "N/A",
            "userId" => $doc["userId"] ?? "MISSING",
            "createdAt" => $doc["createdAt"] ?? "N/A"
        ];
    }
    echo json_encode($results, JSON_PRETTY_PRINT);
} catch (Throwable $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
