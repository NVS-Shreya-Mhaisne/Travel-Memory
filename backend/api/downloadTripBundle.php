<?php
require_once "../config/db.php";

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$id = $_GET["id"] ?? "";

if (!$id) {
    http_response_code(400);
    echo json_encode(["status" => false, "message" => "Trip ID required"]);
    exit;
}

try {
    $trip = $db->trips->findOne(["_id" => new MongoDB\BSON\ObjectId($id)]);

    if (!$trip) {
        http_response_code(404);
        echo json_encode(["status" => false, "message" => "Trip not found"]);
        exit;
    }

    if (!class_exists('ZipArchive')) {
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "ZipArchive extension not enabled on this server"]);
        exit;
    }

    $zip = new ZipArchive();
    $location = $trip['location'] ?? 'memory';
    $safeLocation = preg_replace('/[^a-zA-Z0-9]/', '-', $location);
    $zipName = "trip-memory-" . $safeLocation . ".zip";
    
    // Create a temporary file
    $tempFile = tempnam(sys_get_temp_dir(), 'zip');

    if ($zip->open($tempFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== TRUE) {
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Could not create temporary zip file"]);
        exit;
    }

    // Collect all unique images
    $images = [];
    if (!empty($trip['images']) && is_array($trip['images'])) {
        foreach ($trip['images'] as $img) {
            if ($img) $images[] = $img;
        }
    }
    if (!empty($trip['coverImage'])) {
        $images[] = $trip['coverImage'];
    }
    $images = array_unique($images);

    $baseUploadDir = realpath(__DIR__ . "/../");
    $addedFiles = 0;

    foreach ($images as $img) {
        // Paths are stored as "uploads/filename.jpg"
        $fullPath = $baseUploadDir . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $img);
        
        if (file_exists($fullPath) && is_file($fullPath)) {
            $zip->addFile($fullPath, basename($img));
            $addedFiles++;
        }
    }

    // Add a summary file
    $summary = "TRIP MEMORY SUMMARY\n";
    $summary .= "====================\n\n";
    $summary .= "Location: " . ($trip['location'] ?? 'Unknown') . "\n";
    $summary .= "Dates: " . ($trip['startDate'] ?? 'N/A') . " to " . ($trip['endDate'] ?? 'N/A') . "\n";
    $summary .= "Traveler: " . ($trip['traveler']['name'] ?? 'Unknown traveler') . "\n\n";
    $summary .= "Description:\n";
    $summary .= "------------\n";
    $summary .= ($trip['description'] ?? 'No description provided.') . "\n\n";
    
    if (!empty($trip['highlights']) && is_array($trip['highlights'])) {
        $summary .= "Highlights:\n";
        foreach ($trip['highlights'] as $hl) {
            $summary .= "- " . $hl . "\n";
        }
    }

    $zip->addFromString("trip_summary.txt", $summary);

    $zip->close();

    // Stream the ZIP
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . $zipName . '"');
    header('Content-Length: ' . filesize($tempFile));
    header('Pragma: no-cache');
    header('Expires: 0');
    
    readfile($tempFile);

    // Remove temporary file
    unlink($tempFile);
    exit;

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Server error: " . $e->getMessage()]);
}
