<?php
require_once "env.php";
require_once __DIR__ . '/../vendor/autoload.php';

try {

    $client = new MongoDB\Client(MONGO_URI);

    $db = $client->selectDatabase("Travel_memory");

} catch (Throwable $e) {
    if (!headers_sent()) {
        header("Content-Type: application/json");
    }
    echo json_encode([
        "status" => false,
        "message" => "Database connection failed: " . $e->getMessage()
    ]);
    exit;
}
