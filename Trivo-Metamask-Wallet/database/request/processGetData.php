<?php
require_once '../database/Database.inc.php';
error_reporting(0);
try {
  $db = new Database();
  $pdo = $db->getConnection();

  if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $type = $_GET['type'];
    $id_submission = $_GET['id_submission'];
    $publisher_id = $_GET['publisher_id'];
    if (isset($type) && $type === "createSmartContract" && isset($id_submission) && isset($publisher_id)) {

      $findPublication = "UPDATE publications SET publisher_id = :publisher_id WHERE submission_id = :submission_id";
      $stmtPublication = $pdo->prepare($findPublication);
      $stmtPublication->bindParam(':publisher_id', $publisher_id);
      $stmtPublication->bindParam(':submission_id', $id_submission);
      $execPublication = $stmtPublication->execute();

      if ($execPublication) {
        $getAgreement = "SELECT * FROM publications INNER JOIN percentage_settings ON publications.publisher_id = percentage_settings.publisher_id WHERE publications.submission_id = '$id_submission' ";

        $stmtGetAgreement = $pdo->query($getAgreement);
        $execGetAgreement = $stmtGetAgreement->fetch(PDO::FETCH_ASSOC);

        $author_agreement = $execGetAgreement['author_agreement'];
        $reviewer_agreement = $execGetAgreement['reviewer_agreement'];
        $publisher_agreement = $execGetAgreement['publisher_agreement'];
        $percentage_authors = $execGetAgreement['percentage_authors'];
        $percentage_reviewers = $execGetAgreement['percentage_reviewers'];
        $percentage_publisher = $execGetAgreement['percentage_publisher'];

        //All agree to monetization
        if ($author_agreement == 1 && $reviewer_agreement == 1 && $publisher_agreement == 1) {

          // Fetch submission data
          // $getSubmission = "SELECT * FROM submission WHERE publisher_id = :publisher_id";
          $getSubmission = "SELECT * FROM submission WHERE publisher_id = 1";
          $stmt = $pdo->prepare($getSubmission);
          $stmt->execute(['publisher_id' => $publisher_id]);
          $execGetSubmission = $stmt->fetch(PDO::FETCH_ASSOC);

          if ($execGetSubmission) {
            $url = 'http://139.177.187.236:3000/createSmartContract';
            $curl = curl_init($url);
            curl_setopt($curl, CURLOPT_POST, true);
            curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

            $headers = [
              "Content-Type: application/x-www-form-urlencoded"
            ];
            curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);

            // get from db
            $network = $execGetSubmission["network"];
            $url_api_key = $execGetSubmission["url_api_key"];
            $private_key_account = $execGetSubmission["private_key_account"];

            $data = "network=$network&url_api_key=$url_api_key&private_key_account=$private_key_account";
            curl_setopt($curl, CURLOPT_POSTFIELDS, $data);
            $httpcode = curl_getinfo($curl, CURLINFO_HTTP_CODE);

            $result = curl_exec($curl);
            http_response_code($httpcode);
            curl_close($curl);
            $smart_contract = json_decode($result)->data->address_contract;

            if ($smart_contract) {
              $current_timestamp = time();
              $expired_timestamp = $current_timestamp + (2 * 365 * 24 * 60 * 60);
              $expired_timestamp = date('Y-m-d H:i:s', $expired_timestamp);

              $saveSmartContract = "INSERT INTO smart_contract (id_submission, smart_contract_address, percentages_publisher, percentages_reviewers, percentages_authors, expired) VALUES ($id_submission, '$smart_contract', $percentage_publisher, $percentage_reviewers, $percentage_authors, '$expired_timestamp')";

              $statement = $pdo->prepare($saveSmartContract);
              $exec = $statement->execute();

              if ($exec) {
                $response['status'] = true;
                $response['message'] = 'Insert smart contract successful';
                $response['data'] = $expired_timestamp;
              } else {
                $response['status'] = false;
                $response['message'] = 'Insert smart contract failed';
              }
            } else {
              $response['status'] = false;
              $response['message'] = 'Failed to create smart contract';
            }
          } else {
            $response['status'] = false;
            $response['message'] = 'Failure to create smart contract';
            $response['detail'] = "id submission not found! ID: $id_submission";
            $response['data'] = [];
          }
        } else {
          $response['status'] = false;
          $response['message'] = 'Some do not agree to monetization';
        }
      }
    } else if (isset($type) && $type === "getABIDatabase") {
      $id_submission = $_GET['id_submission'];

      // Fetch smart contract data
      $query = "SELECT * FROM smart_contract WHERE id_submission = :id_submission";
      $stmt = $pdo->prepare($query);
      $stmt->execute(['id_submission' => $id_submission]);
      $row = $stmt->fetch(PDO::FETCH_ASSOC);

      if ($row) {
        $response['status'] = true;
        $response['message'] = "Successfully get ABI data";
        $response['data'] = [
          "address_contract" => $row["smart_contract_address"],
          "abi_json_url" => "http://139.177.187.236:3000/abi_json/ABI_FILE_JSON_SMARTCONTRACT.json",
          "expired" => $row["expired"]
        ];
      } else {
        $response['status'] = false;
        $response['message'] = 'Failure to get ABI data';
        $response['data'] = [];
        $response['detail'] = "id submission not found! ID: $id_submission";
      }
    } else if (isset($type) && $type === "getDataDatabase") {
      $id_submission = $_GET['id_submission'];

      // Fetch smart contract data
      $query = "SELECT * FROM smart_contract WHERE id_submission = :id_submission";
      $stmt = $pdo->prepare($query);
      $stmt->execute(['id_submission' => $id_submission]);
      $rowPercentages = $stmt->fetch(PDO::FETCH_ASSOC);

      if ($rowPercentages) {
        $smart_contract_address = $rowPercentages["smart_contract_address"];

        // Fetch address publishers
        $query = "SELECT users.wallet_address FROM publications INNER JOIN users ON publications.publisher_id = users.user_id WHERE publications.submission_id = :publication_id";
        $stmt = $pdo->prepare($query);
        $stmt->execute(['publication_id' => $id_submission]);
        $addressPublishers = $stmt->fetchAll(PDO::FETCH_COLUMN);

        // Fetch address reviewers
        $query = "SELECT users.wallet_address FROM review_assignments INNER JOIN users ON review_assignments.reviewer_id = users.user_id WHERE review_assignments.submission_id = :publication_id AND review_assignments.date_confirmed IS NOT NULL AND review_assignments.cancelled = 0 AND review_assignments.declined = 0";
        $stmt = $pdo->prepare($query);
        $stmt->execute(['publication_id' => $id_submission]);
        $addressReviewers = $stmt->fetchAll(PDO::FETCH_COLUMN);

        // Fetch address authors
        $query = "SELECT * FROM authors WHERE publication_id = :publication_id ORDER BY percentage DESC";
        $stmt = $pdo->prepare($query);
        $stmt->execute(['publication_id' => $id_submission]);
        $addressAuthors = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $data_authors = [];
        foreach ($addressAuthors as $row) {
          $data_authors[] = [
            'address' => $row["wallet_address"],
            'percentage' => $row["percentage"],
          ];
        }

        // Fetch files data
        $query = "SELECT * FROM files WHERE file_id = :file_id";
        $stmt = $pdo->prepare($query);
        $stmt->execute(['file_id' => $id_submission]);
        $rowFiles = $stmt->fetch(PDO::FETCH_ASSOC);

        $response['status'] = true;
        $response['message'] = "Successfully get address data";
        $response['data'] = [
          "publishers" => [
            "address" => $addressPublishers[0],
            "percentage" => $rowPercentages["percentages_publisher"],
          ],
          "reviewers" => [
            "address" => $addressReviewers,
            "percentage" => $rowPercentages["percentages_reviewers"],
          ],
          "authors" => [
            "data_authors" => $data_authors,
            "percentage" => $rowPercentages["percentages_authors"],
          ],
          "documentHash" => hash('sha512', basename($rowFiles["path"])),
          "doi" => "b"
        ];
      } else {
        $response['status'] = false;
        $response['message'] = 'Failure to get ABI data';
        $response['detail'] = "id submission not found! ID: $id_submission";
        $response['data'] = [];
      }
    } else {
      $response['status'] = false;
      $response['message'] = "Invalid request params type.";
      http_response_code(500);
    }
  } else {
    $response['status'] = false;
    $response['message'] = "Invalid request method.";
    http_response_code(500);
  }
} catch (Exception $e) {
  $response['status'] = false;
  $response['message'] = "Invalid request method.";
  $response['detail'] = $e->getMessage();
  http_response_code(500);
}

header('Content-Type: application/json');
echo json_encode($response);
