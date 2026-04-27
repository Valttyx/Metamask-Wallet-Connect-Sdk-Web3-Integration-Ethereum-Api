<?php

require_once '../database/Database.inc.php';

$response = array(
    'success' => true,
    'data' => [],
    'message' => "",
);

try {
    $db = new Database();
    $pdo = $db->getConnection();

    if ($_SERVER['REQUEST_METHOD'] == 'POST') {
        $data = file_get_contents('php://input');
        $data = json_decode($data, true);

        $type = $_GET['type'];

        if (isset($type) && $type === 'updateUserWallet') {
            $username = $data['username'];
            $wallet_address = $data['wallet_address'];

            $query = "UPDATE users SET wallet_address = :wallet_address WHERE username = :username";
            $statement = $pdo->prepare($query);
            $statement->bindParam(':wallet_address', $wallet_address);
            $statement->bindParam(':username', $username);
            $exec = $statement->execute();

            if ($exec) {
                $response['message'] = 'Update successful';
            } else {
                $response['success'] = false;
                $response['message'] = 'Update failed';
            }
        }
    } else if ($_SERVER['REQUEST_METHOD'] == 'GET') {
        $type = $_GET['type'];
        $username = $_GET['username'];

        if (isset($type) && isset($username) && $type === "getUserAddress") {

            $query = "SELECT user_id,wallet_address FROM users WHERE username = '$username'";
            $exec = $pdo->query($query);

            $row = $exec->fetchAll(PDO::FETCH_ASSOC);

            if ($row) {
                $response['data'] = $row;
            } else {
                $response['success'] = false;
                $response['message'] = 'No user found for username : ' . $username;
                $response['data'] = [];
            }
        }

        if (isset($type) && isset($username) && $type === "getUserId") {

            $query = "SELECT user_id, wallet_address FROM users WHERE username = '$username'";
            $exec = $pdo->query($query);

            $row = $exec->fetchAll(PDO::FETCH_ASSOC);

            if ($row) {
                $response['data'] = $row;
            } else {
                $response['success'] = false;
                $response['data'] = [];
                $response['message'] = 'No user found for username : ' . $username;
            }
        }
    } else {
        $response['success'] = false;
        $response['message'] = "Invalid request method.";
    }
} catch (Exception $e) {
    throw new Exception($e->getMessage());
}

header('Content-Type: application/json');
echo json_encode($response);
