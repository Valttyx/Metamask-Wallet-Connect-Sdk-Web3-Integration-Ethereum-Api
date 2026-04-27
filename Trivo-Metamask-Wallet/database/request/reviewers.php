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
        $reviewerData = file_get_contents('php://input');
        $reviewerData = json_decode($reviewerData, true);

        $type = $_GET['type'];

        if (isset($type) && $type === 'insertReviewerData') {
            $submission_id = $reviewerData['submission_id'];
            $reviewer_id = $reviewerData['reviewer_id'];

            $query = "INSERT INTO reviewers (submission_id, reviewer_id) VALUES ($submission_id, $reviewer_id)";
            $statement = $pdo->prepare($query);
            $exec = $statement->execute();

            if ($exec) {
                $response['message'] = 'Insert successful';
            } else {
                $response['success'] = false;
                $response['message'] = 'Insert failed';
            }
        }
    } else if ($_SERVER['REQUEST_METHOD'] == 'GET') {
        $type = $_GET['type'];

        if (isset($type) &&  $type === 'getReviewerRole') {

            $query = "SELECT users.user_id, users.username, users.email, user_user_groups.user_group_id, users.wallet_address
                FROM users
                INNER JOIN user_user_groups ON user_user_groups.user_id = users.user_id
                WHERE user_user_groups.user_group_id = 33";

            $exec = $pdo->query($query);

            $row = $exec->fetchAll(PDO::FETCH_ASSOC);

            if ($row) {
                $response['data'] = $row;
            } else {
                $response['success'] = false;
                $response['message'] = 'No user with role reviewer';
                $response['data'] = [];
            }
        }

        if (isset($type) && $type == 'getReviewerAssignment') {
            if (isset($_GET['reviewAssignmentId'])) {
                $reviewAssignmentId = $_GET['reviewAssignmentId'];

                $query = "SELECT * FROM review_assignments WHERE review_id = $reviewAssignmentId";
                $exec = $pdo->query($query);
                $row = $exec->fetchAll(PDO::FETCH_ASSOC);

                if ($row) {
                    $response['data'] = $row;
                } else {
                    $response['success'] = false;
                    $response['data'] = [];
                    $response['message'] = 'No review assignment data found for id : ' . $reviewAssignmentId;
                }
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
