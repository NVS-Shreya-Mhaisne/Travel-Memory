<?php
require_once "config/db.php";

echo "<h1>MongoDB Connection Debug</h1>";

try {
    // Attempting a simple command to verify connection
    $cursor = $db->command(['ping' => 1]);
    echo "<p style='color: green;'>✅ CONNECTION SUCCESSFUL!</p>";
    echo "<pre>";
    print_r($cursor->toArray());
    echo "</pre>";

    echo "<h3>Attempting to list collections:</h3>";
    $collections = $db->listCollections();
    foreach ($collections as $collection) {
        echo "<li>" . $collection->getName() . "</li>";
    }

} catch (Throwable $e) {
    echo "<p style='color: red;'>❌ CONNECTION FAILED!</p>";
    echo "<b>Error Message:</b> " . $e->getMessage() . "<br>";
    echo "<b>Current URI (partial):</b> " . substr(MONGO_URI, 0, 20) . "...<br>";
    echo "<b>Tip:</b> Check your MongoDB Atlas > Database Access user permissions and Password.";
}
?>
