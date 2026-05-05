<?php
declare(strict_types=1);


require_once __DIR__ . '/backend/auth.php';

//n7elo  session bech najmo na9raw $_SESSION.

startAppSession();

//ken l'utilisateur connecté raw $_SESSION['user_id'] existe
if (!empty($_SESSION['user_id'])) {
    header('Location: ./pages/index.html');
    exit;
}

//snn 
header('Location: ./pages/login.html');
exit;