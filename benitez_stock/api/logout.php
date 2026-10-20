<?php
/*
 * Cierre de sesión: vacía la sesión, borra la cookie y destruye la sesión.
 */

require_once __DIR__ . '/../config/api.php';

solo_metodo('POST');

iniciar_sesion();

$_SESSION = [];

if (ini_get('session.use_cookies')) {
    $p = session_get_cookie_params();
    setcookie(session_name(), '', [
        'expires'  => time() - 42000,
        'path'     => $p['path'],
        'domain'   => $p['domain'],
        'secure'   => $p['secure'],
        'httponly' => $p['httponly'],
        'samesite' => $p['samesite'] ?: 'Lax',
    ]);
}

session_destroy();

responder(200, ['ok' => true, 'mensaje' => 'Sesión cerrada.']);
