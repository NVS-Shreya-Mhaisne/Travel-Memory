<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");

if (isset($_GET['file'])) {
    $file = $_GET['file'];
    
    // Clean the filename/path to prevent directory traversal
    $file = str_replace(['../', '..\\'], '', $file);
    
    // If the path starts with 'uploads/', strip it because our basePath already points to uploads
    if (strpos($file, 'uploads/') === 0) {
        $file = substr($file, 8);
    }
    if (strpos($file, 'uploads\\') === 0) {
        $file = substr($file, 8);
    }
    
    // Determine the absolute path to the file
    // Assuming the file path passed is relative to the project root or uploads folder
    $basePath = realpath(__DIR__ . '/../uploads/');
    $filePath = realpath($basePath . '/' . $file);

    if ($filePath && strpos($filePath, $basePath) === 0 && file_exists($filePath)) {
        $fileName = isset($_GET['name']) ? $_GET['name'] : basename($filePath);
        
        // Force download headers
        header('Content-Description: File Transfer');
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="' . $fileName . '"');
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
        header('Content-Length: ' . filesize($filePath));
        
        readfile($filePath);
        exit;
    } else {
        http_response_code(404);
        echo json_encode(["status" => false, "message" => "File not found or access denied."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => false, "message" => "No file specified."]);
}
?>
