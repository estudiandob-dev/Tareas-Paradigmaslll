<?php
/*
 * Registro de usuarios.
 * Recibe:   POST JSON { "nombre": "...", "email": "...", "password": "..." }
 * Guarda el hash BCRYPT de la contraseña (nunca el texto plano) usando PDO
 * con prepared statements.
 */

require_once __DIR__ . '/../config/api.php';
require_once __DIR__ . '/../config/conexion.php';

solo_metodo('POST');

$entrada  = leer_json();
$nombre   = trim((string) ($entrada['nombre'] ?? ''));
$email    = strtolower(trim((string) ($entrada['email'] ?? '')));
$password = (string) ($entrada['password'] ?? '');

if ($nombre === '' || $email === '' || $password === '') {
    responder(400, ['ok' => false, 'mensaje' => 'Todos los campos son obligatorios.']);
}

if (mb_strlen($nombre) > 100) {
    responder(400, ['ok' => false, 'mensaje' => 'El nombre no puede superar los 100 caracteres.']);
}

if (strlen($email) > 150 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    responder(400, ['ok' => false, 'mensaje' => 'El correo electrónico no es válido.']);
}

if (strlen($password) < 8) {
    responder(400, ['ok' => false, 'mensaje' => 'La contraseña debe tener al menos 8 caracteres.']);
}

// BCRYPT solo considera los primeros 72 bytes: se rechaza lo que excede.
if (strlen($password) > 72) {
    responder(400, ['ok' => false, 'mensaje' => 'La contraseña no puede superar los 72 caracteres.']);
}

$hash = password_hash($password, PASSWORD_BCRYPT);

try {
    $stmt = $pdo->prepare(
        'INSERT INTO usuarios (nombre, email, password) VALUES (:nombre, :email, :password)'
    );
    $stmt->execute([
        'nombre'   => $nombre,   // se guarda tal cual: el escape se hace al mostrar (textContent)
        'email'    => $email,
        'password' => $hash,
    ]);

    responder(201, ['ok' => true, 'mensaje' => 'Usuario registrado correctamente.']);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') { // violación de UNIQUE: email repetido
        responder(409, ['ok' => false, 'mensaje' => 'El correo electrónico ya está registrado.']);
    }

    responder(500, ['ok' => false, 'mensaje' => 'Error interno al registrar el usuario.']);
}
