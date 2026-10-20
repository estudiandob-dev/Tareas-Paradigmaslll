<?php
/*
 * Inicio de sesión.
 * Recibe:   POST JSON { "email": "...", "password": "..." }
 * Valida con password_verify(), abre la sesión PHP y regenera su id
 * para evitar la fijación de sesión.
 */

require_once __DIR__ . '/../config/api.php';
require_once __DIR__ . '/../config/conexion.php';

solo_metodo('POST');

$entrada  = leer_json();
$email    = strtolower(trim((string) ($entrada['email'] ?? '')));
$password = (string) ($entrada['password'] ?? '');

if ($email === '' || $password === '') {
    responder(400, ['ok' => false, 'mensaje' => 'Ingresá correo y contraseña.']);
}

try {
    $stmt = $pdo->prepare('SELECT id, nombre, email, password FROM usuarios WHERE email = :email');
    $stmt->execute(['email' => $email]);
    $usuario = $stmt->fetch();
} catch (PDOException $e) {
    responder(500, ['ok' => false, 'mensaje' => 'Error interno del servidor.']);
}

if (!$usuario || !password_verify($password, $usuario['password'])) {
    // Mismo mensaje para "usuario inexistente" y "clave incorrecta".
    responder(401, ['ok' => false, 'mensaje' => 'Credenciales incorrectas.']);
}

iniciar_sesion();             // session_start()
session_regenerate_id(true);  // nuevo id de sesión, se descarta el anterior

$_SESSION['usuario_id']     = (int) $usuario['id'];
$_SESSION['usuario_nombre'] = $usuario['nombre'];

responder(200, [
    'ok'      => true,
    'mensaje' => 'Autenticación exitosa.',
    'usuario' => ['nombre' => $usuario['nombre'], 'email' => $usuario['email']],
]);
