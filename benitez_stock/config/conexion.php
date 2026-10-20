<?php
/*
 * Conexión PDO a MySQL.
 * Valores por defecto de XAMPP: usuario "root" y contraseña vacía.
 * Si cambiaste la contraseña de root, modificá $pass.
 * Requiere haber cargado antes config/api.php (usa responder()).
 */

$host    = 'localhost';
$db      = 'benitez_stock';
$user    = 'root';
$pass    = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$opciones = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false, // prepared statements reales
];

try {
    $pdo = new PDO($dsn, $user, $pass, $opciones);
} catch (PDOException $e) {
    // No se expone el detalle del error al cliente.
    responder(500, ['ok' => false, 'mensaje' => 'No se pudo conectar con la base de datos.']);
}
