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
        $authorData = file_get_contents('php://input');
        $authorData = json_decode($authorData, true);

        $author_id = $authorData['author_id'];
        $wallet_address = $authorData['wallet_address'];
        $email = $authorData['email'];
        $publication_id = $authorData['publication_id'];

        if ($author_id != null) {
            $query = "UPDATE authors SET wallet_address = :walletAddress WHERE author_id = :author_id";
            $statement = $pdo->prepare($query);
            $statement->bindParam(':walletAddress', $wallet_address);
            $statement->bindParam(':author_id', $author_id);
            $exec = $statement->execute();

            if ($exec) {
                $response['success'] = true;
                $response['message'] = 'Update successful';
            } else {
                $response['success'] = false;
                $response['message'] = 'Update failed';
            }
        }
        if ($author_id == null) {
            $query = "UPDATE authors SET wallet_address = :walletAddress WHERE email = :email AND publication_id = :publication_id";
            $statement = $pdo->prepare($query);
            $statement->bindParam(':walletAddress', $wallet_address);
            $statement->bindParam(':email', $email);
            $statement->bindParam(':publication_id', $publication_id);
            $exec = $statement->execute();

            if ($exec) {
                $response['success'] = true;
                $response['message'] = 'Update successful in update';
            } else {
                $response['success'] = false;
                $response['message'] = 'Update failed';
            }
        }

        // $response['data'] = $author_id;
    } else if ($_SERVER['REQUEST_METHOD'] == 'GET') {
        if (isset($_GET['author_id'])) {
            $author_id = $_GET['author_id'];

            $query = "SELECT * FROM authors WHERE author_id = '$author_id'";
            $exec = $pdo->query($query);

            $row = $exec->fetchAll(PDO::FETCH_ASSOC);

            if ($row) {
                $response['data'] = $row;
            } else {
                $response['success'] = false;
                $response['data'] = [];
                $response['message'] = 'No author data found for id : ' . $author_id;
            }
        }
    } else {
        $response['success'] = false;
        $response['message'] = "Invalid request method.";
        http_response_code(500);
    }
} catch (Exception $e) {
    $response['status'] = false;
    $response['message'] = "Invalid request method.";
    $response['detail'] = $e->getMessage();
    throw new Exception($e->getMessage());
    http_response_code(500);
}

header('Content-Type: application/json');
echo json_encode($response);
