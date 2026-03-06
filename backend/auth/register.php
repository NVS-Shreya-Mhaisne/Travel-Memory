<?php
include("../config/db.php");

$data = json_decode(file_get_contents("php://input"), true);

// ✅ Check if data exists
if(!$data){
    echo json_encode([
        "status"=>false,
        "message"=>"No data received"
    ]);
    exit;
}

$fullName = $data["fullName"];
$email = $data["email"];
$password = password_hash($data["password"], PASSWORD_DEFAULT);

$sql = "INSERT INTO users(full_name,email,password)
VALUES('$fullName','$email','$password')";

if($conn->query($sql)){
    echo json_encode([
        "status"=>true,
        "message"=>"User registered successfully"
    ]);
}else{
    echo json_encode([
        "status"=>false,
        "message"=>"Registration failed"
    ]);
}
?>
