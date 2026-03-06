<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, X-User-Id");
header("Content-Type: application/json");

$headers = getallheaders();
echo json_encode([
    "headers" => $headers,
    "X-User-Id" => $headers['X-User-Id'] ?? $headers['x-user-id'] ?? "NOT FOUND"
]);
?>
