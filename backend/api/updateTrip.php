<?php
require_once "../config/db.php";

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-User-Id");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

header("Content-Type: application/json");

use MongoDB\BSON\ObjectId;

// Get userId from header
$headers = getallheaders();
$userId = $headers['X-User-Id'] ?? $headers['x-user-id'] ?? "";

if (!$userId) {
    echo json_encode(["status" => false, "message" => "Unauthorized access"]);
    exit;
}

if (!isset($_POST["id"])) {
    echo json_encode([
        "status" => false,
        "message" => "Trip ID required"
    ]);
    exit;
}

$id = $_POST["id"];

$uploadDir = "../uploads/";

if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$updateData = [];

/* -------- TEXT FIELDS -------- */

$fields = [
    "location","country","startDate","endDate","description",
    "category","budget","currency","status",
    "accommodation","accommodationName","transportation",
    "foodText", "tags", "highlights"
];

foreach ($fields as $field) {

    // IMPORTANT: Only update if field exists AND not empty
    if (isset($_POST[$field]) && $_POST[$field] !== "") {
        $updateData[$field] = $_POST[$field];
    }
}

/* -------- ARRAYS -------- */

if (!empty($_POST["tags"])) {
    $updateData["tags"] = explode(",", $_POST["tags"]);
}

if (!empty($_POST["highlights"])) {
    $updateData["highlights"] = explode(",", $_POST["highlights"]);
}

/* -------- BOOLEAN -------- */

if (isset($_POST["isPublic"])) {
    $updateData["isPublic"] = true;
}

if (isset($_POST["allowComments"])) {
    $updateData["allowComments"] = true;
}

/* ===============================
   COVER IMAGE (OPTIONAL)
================================ */

if (!empty($_FILES["coverImage"]["name"])) {

    $fileName = uniqid() . "_" . $_FILES["coverImage"]["name"];
    $targetPath = $uploadDir . $fileName;

    if (move_uploaded_file($_FILES["coverImage"]["tmp_name"], $targetPath)) {
        $updateData["coverImage"] = "uploads/" . $fileName;
    }
}

/* ===============================
   FOOD IMAGE (OPTIONAL)
================================ */

if (!empty($_FILES["foodImage"]["name"])) {

    $fileName = uniqid() . "_food_" . $_FILES["foodImage"]["name"];
    $targetPath = $uploadDir . $fileName;

    if (move_uploaded_file($_FILES["foodImage"]["tmp_name"], $targetPath)) {
        $updateData["foodImage"] = "uploads/" . $fileName;
    }
}

/* ===============================
   MULTIPLE IMAGES (OPTIONAL)
================================ */

if (!empty($_FILES["images"]["name"][0])) {

    $images = [];

    foreach ($_FILES["images"]["tmp_name"] as $key => $tmpName) {

        $imgName = uniqid() . "_" . $_FILES["images"]["name"][$key];
        $targetPath = $uploadDir . $imgName;

        if (move_uploaded_file($tmpName, $targetPath)) {
            $images[] = "uploads/" . $imgName;
        }
    }

    $updateData["images"] = $images;
}

/* ===============================
   NOTHING TO UPDATE CHECK
================================ */

$action = $_POST["action"] ?? "update";

// If it's a standard update, we need some data. If it's an action, we check accordingly.
if (empty($updateData) && $action === "update") {
    echo json_encode([
        "status" => false,
        "message" => "No fields to update"
    ]);
    exit;
}

/* ===============================
   UPDATE MONGODB
================================ */

if ($action === "add_images" && !empty($updateData["images"])) {
    // Append new images to existing ones
    $result = $db->trips->updateOne(
        ["_id" => new ObjectId($id), "userId" => $userId],
        ['$push' => ['images' => ['$each' => $updateData["images"]]]]
    );
} else if ($action === "remove_image" && isset($_POST["imagePath"])) {
    $imagePath = $_POST["imagePath"];
    
    // 1. Remove from MongoDB
    $result = $db->trips->updateOne(
        ["_id" => new ObjectId($id), "userId" => $userId],
        ['$pull' => ['images' => $imagePath]]
    );

    // 2. Try to delete from disk (Optional but good)
    // Convert 'uploads/filename.ext' to '../uploads/filename.ext'
    $diskPath = "../" . str_replace("uploads/", "uploads/", $imagePath); 
    if (file_exists($diskPath)) {
        unlink($diskPath);
    }
} else {
    // Standard update
    $result = $db->trips->updateOne(
        ["_id" => new ObjectId($id), "userId" => $userId],
        ['$set' => $updateData]
    );
}

echo json_encode([
    "status" => true,
    "message" => "Trip Updated Successfully"
]);
