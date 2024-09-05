<?php
# run with php -S localhost:8080 -t $dirWithIndexPhpInIt

// Allow from any origin - uncomment to test native js fetch
/* if (isset($_SERVER['HTTP_ORIGIN'])) {
  // Decide if the origin in $_SERVER['HTTP_ORIGIN'] is one
  // you want to allow, and if so:
  header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
  header('Access-Control-Allow-Credentials: true');
  header('Access-Control-Max-Age: 86400');    // cache for 1 day
}

// Access-Control headers are received during OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {

  if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
  // may also be using PUT, PATCH, HEAD etc
  header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

  if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
  header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");

  exit(0);
} */


if ($_SERVER['REQUEST_METHOD'] == 'POST' && $_SERVER['CONTENT_TYPE'] == 'application/json') { # json body
  $_POST = json_decode(file_get_contents('php://input'));
  echo json_encode($_POST);
} else if(! empty($_FILES)) { # post file
  foreach ($_FILES as $idx => $file) {
    move_uploaded_file($file['tmp_name'], '/tmp/TAURI-UPLOADED-FILE' . date('Y-m-d-H-i-s') . '-' . $idx . '.txt');
  }
  echo json_encode($_FILES);
} else {
  echo json_encode([
    $_GET,
    $_POST,
    $_FILES,
    file_get_contents('php://input'), # upload. content-type = text/plain
  ]);
}
