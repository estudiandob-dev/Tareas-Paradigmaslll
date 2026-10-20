<?php
/*
 * Endpoint de reposición (PRIVADO: requiere sesión): SUMA stock a un producto en data/inventario.json.
 * Recibe:   POST JSON  { "id": 1, "cantidad": 20 }
 * Responde: JSON       { "ok": true|false, "mensaje": "...", "productos": [...] }
 */

require_once __DIR__ . '/../config/api.php';

date_default_timezone_set('America/Argentina/Buenos_Aires');

solo_metodo('POST');

requerir_sesion(); // 401 si no hay sesión (endpoint privado)

$entrada = leer_json();
$id = filter_var($entrada['id'] ?? null, FILTER_VALIDATE_INT);
$cantidad = filter_var($entrada['cantidad'] ?? null, FILTER_VALIDATE_INT);

if ($id === false || $cantidad === false || $cantidad < 1 || $cantidad > 100000) {
    responder(400, ['ok' => false, 'mensaje' => 'Indicá un producto y una cantidad entera entre 1 y 100000.']);
}

$ruta = __DIR__ . '/../data/inventario.json';
$archivo = @fopen($ruta, 'c+');

if (!$archivo) {
    responder(500, ['ok' => false, 'mensaje' => 'No se pudo abrir el inventario.']);
}

flock($archivo, LOCK_EX);

$productos = json_decode(stream_get_contents($archivo), true);

if (!is_array($productos)) {
    flock($archivo, LOCK_UN);
    fclose($archivo);
    responder(500, ['ok' => false, 'mensaje' => 'El inventario está dañado o vacío.']);
}

$indice = array_search($id, array_column($productos, 'id'), true);

if ($indice === false) {
    flock($archivo, LOCK_UN);
    fclose($archivo);
    responder(404, ['ok' => false, 'mensaje' => "El producto $id no existe.", 'productos' => $productos]);
}

$productos[$indice]['cantidad'] += $cantidad;
$productos[$indice]['fecha'] = date('Y-m-d'); // fecha de la última recepción

$nombre = $productos[$indice]['nombre'];
$nuevoStock = $productos[$indice]['cantidad'];

ftruncate($archivo, 0);
rewind($archivo);
fwrite($archivo, json_encode($productos, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
fflush($archivo);
flock($archivo, LOCK_UN);
fclose($archivo);

responder(200, [
    'ok' => true,
    'mensaje' => "Se agregaron $cantidad unidades a $nombre. Stock actual: $nuevoStock.",
    'productos' => $productos
]);
