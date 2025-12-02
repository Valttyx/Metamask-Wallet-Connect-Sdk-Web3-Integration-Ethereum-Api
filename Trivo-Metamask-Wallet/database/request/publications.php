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
            $postData = file_get_contents('php://input');
            $postData = json_decode($postData, true);

            $submissionId = $postData['submissionId'];
            $agreement = $postData['agreement'];

            $type = $_GET['type'];

            if (isset($type)) {
                if ($type === 'updateAuthorAgreement') {
                    $query = "UPDATE publications SET author_agreement = :authorAgreement WHERE submission_id = :submissionId";
                    $statement = $pdo->prepare($query);
                    $statement->bindParam(':authorAgreement', $agreement);
                    $statement->bindParam(':submissionId', $submissionId);
                    $exec = $statement->execute();

                    if ($exec) {
                        $response['message'] = 'Update successful';
                    } else {
                        $response['success'] = false;
                        $response['message'] = 'Update failed';
                    }
                } else if ($type === 'updateReviewerAgreement') {
                    $query = "UPDATE publications SET reviewer_agreement = :reviewer_agreement WHERE submission_id = :submissionId";
                    $statement = $pdo->prepare($query);
                    $statement->bindParam(':reviewer_agreement', $agreement);
                    $statement->bindParam(':submissionId', $submissionId);
                    $exec = $statement->execute();

                    if ($exec) {
                        $response['message'] = 'Update successful';
                    } else {
                        $response['success'] = false;
                        $response['message'] = 'Update failed';
                    }
                }
            }
        } else if ($_SERVER['REQUEST_METHOD'] == 'GET') {
            if (isset($_GET['submissionId'])) {
                $submissionId = $_GET['submissionId'];

                $query = "SELECT * FROM publications WHERE submission_id = '$submissionId'";
                $exec = $pdo->query($query);

                $row = $exec->fetchAll(PDO::FETCH_ASSOC);

                if ($row) {
                    $response['data'] = $row;
                } else {
                    $response['success'] = false;
                    $response['data'] = [];
                    $response['message'] = 'No submission data found for id : ' . $submissionId;
                }
            }
        } else {
            $response['success'] = false;
            $response['data'] = [];
            $response['message'] = "Invalid request method.";
        }
    } catch (Exception $e) {
        throw new Exception($e->getMessage());
    }

    header('Content-Type: application/json');
    echo json_encode($response);
