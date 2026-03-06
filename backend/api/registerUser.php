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

$name = $data["name"] ?? "";
$email = $data["email"] ?? "";
$password = $data["password"] ?? "";

if (!$name || !$email || !$password) {
    echo json_encode(["status"=>false,"message"=>"All fields required"]);
    exit;
}

# check if email exists
$existingUser = $db->user->findOne(["email"=>$email]);

if ($existingUser) {
    echo json_encode(["status"=>false,"message"=>"Email already exists"]);
    exit;
}

# hash password (VERY IMPORTANT)
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

$result = $db->user->insertOne([
    "name"=>$name,
    "email"=>$email,
    "password"=>$hashedPassword,
    "profileImage"=>"",
    "createdAt"=>new MongoDB\BSON\UTCDateTime()
]);

echo json_encode([
    "status"=>true,
    "message"=>"User Registered Successfully",
    "id"=>(string)$result->getInsertedId()
]);
