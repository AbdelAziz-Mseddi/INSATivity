<?php
// backend/Database.php
// Compatibility wrapper to prevent breaking existing code while migrating.
require_once __DIR__ . '/../vendor/autoload.php';

class Database extends \App\Repositories\Database {}
