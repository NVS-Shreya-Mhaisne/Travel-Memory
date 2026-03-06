<?php
require_once "../config/db.php";

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-User-Id");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

header("Content-Type: application/json");

$uploadDir = "../uploads/";

/* ---------- CREATE FOLDER IF NOT EXIST ---------- */
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

/* ---------- COVER IMAGE ---------- */

$coverImagePath = "";

if (!empty($_FILES["coverImage"]["name"])) {

    $fileName = uniqid() . "_" . $_FILES["coverImage"]["name"];
    $targetPath = $uploadDir . $fileName;

    if (move_uploaded_file($_FILES["coverImage"]["tmp_name"], $targetPath)) {
        $coverImagePath = "uploads/" . $fileName;
    }
}

/* ---------- FOOD IMAGE ---------- */

$foodImagePath = "";

if (!empty($_FILES["foodImage"]["name"])) {

    $fileName = uniqid() . "_food_" . $_FILES["foodImage"]["name"];
    $targetPath = $uploadDir . $fileName;

    if (move_uploaded_file($_FILES["foodImage"]["tmp_name"], $targetPath)) {
        $foodImagePath = "uploads/" . $fileName;
    }
}

/* ---------- MULTIPLE IMAGES ---------- */

$images = [];

if (!empty($_FILES["images"]["name"][0])) {

    foreach ($_FILES["images"]["tmp_name"] as $key => $tmpName) {

        $imgName = uniqid() . "_" . $_FILES["images"]["name"][$key];
        $targetPath = $uploadDir . $imgName;

        if (move_uploaded_file($tmpName, $targetPath)) {
            $images[] = "uploads/" . $imgName;
        }
    }
}

/* ---------- INSERT ---------- */

// Get userId from header with fallbacks
$headers = getallheaders();
$userId = $headers['X-User-Id'] ?? $headers['x-user-id'] ?? $_SERVER['HTTP_X_USER_ID'] ?? "";

if (!$userId) {
    echo json_encode(["status" => false, "message" => "Unauthorized access"]);
    exit;
}

$insert = $db->trips->insertOne([
    "userId" => $userId,
    "location" => $_POST["location"] ?? "",
    "country" => $_POST["country"] ?? "",
    "startDate" => $_POST["startDate"] ?? "",
    "endDate" => $_POST["endDate"] ?? "",
    "description" => $_POST["description"] ?? "",
    "category" => $_POST["category"] ?? "",
    "budget" => $_POST["budget"] ?? "",
    "currency" => $_POST["currency"] ?? "",
    "accommodation" => $_POST["accommodation"] ?? "",
    "accommodationName" => $_POST["accommodationName"] ?? "",
    "transportation" => $_POST["transportation"] ?? "",

    "tags" => isset($_POST["tags"]) ? explode(",", $_POST["tags"]) : [],
    "highlights" => isset($_POST["highlights"]) ? explode(",", $_POST["highlights"]) : [],

    "coverImage" => $coverImagePath,
    "images" => $images,

    "foodText" => $_POST["foodText"] ?? "",
    "foodImage" => $foodImagePath,

    "isPublic" => isset($_POST["isPublic"]),
    "allowComments" => isset($_POST["allowComments"]),

    "createdAt" => new MongoDB\BSON\UTCDateTime()
]);

echo json_encode([
    "status" => true,
    "message" => "Trip Added Successfully ❤️",
    "id" => (string)$insert->getInsertedId()
]);
