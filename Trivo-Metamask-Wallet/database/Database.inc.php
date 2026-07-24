<?php

class Database
{
    private $dbh;

    public function __construct()
    {
        $configFilePath = '../../../../config.inc.php';
        if (file_exists($configFilePath)) {
            $config = parse_ini_file($configFilePath);

            $dbHost = $config['host'];
            $dbUser = $config['username'];
            $dbPass = $config['password'];
            $dbName = $config['name'];
        } else {
            echo "OJS configuration file not found.";
        }

        $dsn = 'mysql:host=' . $dbHost . ';dbname=' . $dbName;

        $options = array(
            PDO::ATTR_PERSISTENT => true,
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        );

        try {
            $this->dbh = new PDO($dsn, $dbUser, $dbPass, $options);
        } catch (PDOException $e) {
            echo $e->getMessage();
        }
    }

    public function getConnection()
    {
        return $this->dbh;
    }
}
