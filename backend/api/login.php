<?php
require_once "../config/db.php";

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
}

header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

$email = $data["email"] ?? "";
$password = $data["password"] ?? "";

if (!$email || !$password) {
    echo json_encode(["status"=>false,"message"=>"Email & Password required"]);
    exit;
}

try {
    $user = $db->user->findOne(["email"=>$email]);

    if (!$user) {
        echo json_encode(["status"=>false,"message"=>"User not found"]);
        exit;
    }

    // Check password
    $isValid = false;
    if (password_verify($password, $user["password"])) {
        $isValid = true;
    } else if ($password === $user["password"]) {
        // Fallback for plain text passwords (e.g., '123456' from user's data)
        // NOTE: In production, all passwords should be hashed!
        $isValid = true;
    }

    if (!$isValid) {
        echo json_encode(["status"=>false,"message"=>"Invalid password"]);
        exit;
    }

    echo json_encode([
        "status"=>true,
        "message"=>"Login Successful",
        "user"=>[
            "id"=>(string)$user["_id"],
            "name"=>$user["name"],
            "email"=>$user["email"]
        ]
    ]);
} catch (Throwable $e) {
    echo json_encode([
        "status" => false, 
        "message" => "Database error: " . $e->getMessage()
    ]);
}
