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
        $percentage = file_get_contents('php://input');
        $percentage = json_decode($percentage, true);

        $publisher_id = $percentage['publisher_id'];
        $percentage_authors = $percentage['percentage_authors'];
        $percentage_reviewers = $percentage['percentage_reviewers'];
        $percentage_publisher = $percentage['percentage_publisher'];


        // Check if the table `percentage_settings` already has the publisher_id
        $query = "SELECT * FROM percentage_settings WHERE publisher_id = :publisher_id";
        $statement = $pdo->prepare($query);
        $statement->bindParam(':publisher_id', $publisher_id);
        $statement->execute();
        $row = $statement->fetch();

        if ($row) {
            // Update the record
            $query = "UPDATE percentage_settings SET percentage_authors = :percentage_authors, percentage_reviewers = :percentage_reviewers, percentage_publisher = :percentage_publisher WHERE publisher_id = :publisher_id";
            $statement = $pdo->prepare($query);
            $statement->bindParam(':percentage_authors', $percentage_authors);
            $statement->bindParam(':percentage_reviewers', $percentage_reviewers);
            $statement->bindParam(':percentage_publisher', $percentage_publisher);
            $statement->bindParam(':publisher_id', $publisher_id);
            $exec = $statement->execute();
        } else {
            // Add a new record
            $query = "INSERT INTO percentage_settings (publisher_id, percentage_authors, percentage_reviewers, percentage_publisher) VALUES (:publisher_id, :percentage_authors, :percentage_reviewers, :percentage_publisher)";
            $statement = $pdo->prepare($query);
            $statement->bindParam(':publisher_id', $publisher_id);
            $statement->bindParam(':percentage_authors', $percentage_authors);
            $statement->bindParam(':percentage_reviewers', $percentage_reviewers);
            $statement->bindParam(':percentage_publisher', $percentage_publisher);
            $exec = $statement->execute();
        }

        if ($exec) {
            $response['success'] = true;
            $response['message'] = 'Update successful';
        } else {
            $response['success'] = false;
            $response['message'] = 'Update failed';
        }
    } else if ($_SERVER['REQUEST_METHOD'] == 'GET') {
        $publisher_id = $_GET['publisher_id'];
        $query = "SELECT * FROM percentage_settings WHERE publisher_id = $publisher_id";
        $exec = $pdo->query($query);

        $row = $exec->fetchAll(PDO::FETCH_ASSOC);

        if ($row) {
            $response['success'] = true;
            $response['data'] = $row;
        } else {
            $response['success'] = false;
            $response['data'] = [];
            $response['message'] = 'No publisher data found for id : ' . $publisher_id;
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
