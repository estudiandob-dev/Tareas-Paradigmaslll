<?php
/*
 * Utilidades compartidas por todos los endpoints de api/.
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function responder(int $codigo, array $cuerpo): void
{
    http_response_code($codigo);
    echo json_encode($cuerpo, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function solo_metodo(string $metodo): void
{
    if ($_SERVER['REQUEST_METHOD'] !== $metodo) {
        header('Allow: ' . $metodo);
        responder(405, ['ok' => false, 'mensaje' => 'Método no permitido.']);
    }
}

function leer_json(): array
{
    $datos = json_decode(file_get_contents('php://input'), true);
    return is_array($datos) ? $datos : [];
}

/* Inicia la sesión PHP con una cookie endurecida. */
function iniciar_sesion(): void
{
    if (session_status() !== PHP_SESSION_NONE) {
        return;
    }

    session_name('BENITEZSESSID');
    session_set_cookie_params([
        'lifetime' => 0,                      // se borra al cerrar el navegador
        'path'     => '/',
        'secure'   => !empty($_SERVER['HTTPS']),
        'httponly' => true,                   // inaccesible desde JavaScript
        'samesite' => 'Lax',                  // no se envía en peticiones cruzadas
    ]);
    session_start();
}

/*
 * Guardián de sesión: si no hay usuario autenticado responde 401 y corta.
 * Devuelve el id del usuario autenticado.
 */
function requerir_sesion(): int
{
    iniciar_sesion();

    if (!isset($_SESSION['usuario_id'])) {
        responder(401, ['ok' => false, 'mensaje' => 'Acceso no autorizado. Iniciá sesión.']);
    }

    return (int) $_SESSION['usuario_id'];
}
