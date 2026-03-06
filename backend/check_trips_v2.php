<?php
require_once "config/db.php";

header("Content-Type: application/json");

try {
    $total = $db->trips->countDocuments();
    $withUserId = $db->trips->countDocuments(["userId" => ['$exists' => true]]);
    $nullUserId = $db->trips->countDocuments(["userId" => null]);
    
    $sample = $db->trips->findOne([], ["sort" => ["createdAt" => -1]]);
    
    echo json_encode([
        "total" => $total,
        "with_userId" => $withUserId,
        "null_userId" => $nullUserId,
        "sample_userId" => isset($sample['userId']) ? $sample['userId'] : "MISSING",
        "sample_userId_type" => isset($sample['userId']) ? gettype($sample['userId']) : "N/A",
        "sample_id" => (string)$sample['_id']
    ], JSON_PRETTY_PRINT);
} catch (Throwable $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
