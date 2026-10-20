<?php
/*
 * Endpoint de compra (PRIVADO: requiere sesión).
 * - Valida el pedido contra el stock de data/inventario.json.
 * - Registra la compra del usuario en MySQL (compras + compra_items).
 * - Descuenta el stock en data/inventario.json.
 * Recibe:   POST JSON { "medioPago": "Efectivo", "items": [ { "id": 1, "cantidad": 2 }, ... ] }
 * Responde: JSON      { "ok": true|false, "mensaje": "...", "productos": [...] }
 */

require_once __DIR__ . '/../config/api.php';
require_once __DIR__ . '/../config/conexion.php';

solo_metodo('POST');

$usuarioId = requerir_sesion(); // 401 si no hay sesión

$entrada   = leer_json();
$items     = $entrada['items'] ?? null;
$medioPago = (string) ($entrada['medioPago'] ?? '');

if (!in_array($medioPago, ['Transferencia', 'Tarjeta', 'Efectivo'], true)) {
    responder(400, ['ok' => false, 'mensaje' => 'Elegí un medio de pago válido.']);
}

if (!is_array($items) || count($items) === 0) {
    responder(400, ['ok' => false, 'mensaje' => 'El pedido está vacío.']);
}

// Se agrupan las cantidades por id y se validan.
$pedido = [];
foreach ($items as $item) {
    $id       = filter_var($item['id'] ?? null, FILTER_VALIDATE_INT);
    $cantidad = filter_var($item['cantidad'] ?? null, FILTER_VALIDATE_INT);

    if ($id === false || $cantidad === false || $cantidad < 1) {
        responder(400, ['ok' => false, 'mensaje' => 'Pedido inválido.']);
    }

    $pedido[$id] = ($pedido[$id] ?? 0) + $cantidad;
}

$ruta    = __DIR__ . '/../data/inventario.json';
$archivo = @fopen($ruta, 'c+');

if (!$archivo) {
    responder(500, ['ok' => false, 'mensaje' => 'No se pudo abrir el inventario.']);
}

// Bloqueo exclusivo: evita que dos compras simultáneas pisen el archivo.
flock($archivo, LOCK_EX);

function liberar_inventario($archivo): void
{
    flock($archivo, LOCK_UN);
    fclose($archivo);
}

$productos = json_decode(stream_get_contents($archivo), true);

if (!is_array($productos)) {
    liberar_inventario($archivo);
    responder(500, ['ok' => false, 'mensaje' => 'El inventario está dañado o vacío.']);
}

// 1) Validar todo el pedido antes de modificar nada. El precio sale del
//    inventario del servidor, nunca del navegador.
$lineas = [];
$total  = 0.0;

foreach ($pedido as $id => $cantidad) {
    $indice = array_search($id, array_column($productos, 'id'), true);

    if ($indice === false) {
        liberar_inventario($archivo);
        responder(404, ['ok' => false, 'mensaje' => "El producto $id no existe.", 'productos' => $productos]);
    }

    if ($productos[$indice]['cantidad'] < $cantidad) {
        $nombre = $productos[$indice]['nombre'];
        $quedan = $productos[$indice]['cantidad'];
        liberar_inventario($archivo);
        responder(409, [
            'ok'        => false,
            'mensaje'   => "Stock insuficiente de $nombre: quedan $quedan unidades.",
            'productos' => $productos,
        ]);
    }

    $precio   = (float) $productos[$indice]['precio'];
    $lineas[] = [
        'indice'   => $indice,
        'id'       => $id,
        'nombre'   => $productos[$indice]['nombre'],
        'precio'   => $precio,
        'cantidad' => $cantidad,
    ];
    $total += $precio * $cantidad;
}

// 2) Registrar la compra y descontar el stock. Si algo falla, se revierte la base.
try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare(
        'INSERT INTO compras (usuario_id, medio_pago, total) VALUES (:usuario, :pago, :total)'
    );
    $stmt->execute(['usuario' => $usuarioId, 'pago' => $medioPago, 'total' => $total]);
    $compraId = (int) $pdo->lastInsertId();

    $stmtItem = $pdo->prepare(
        'INSERT INTO compra_items (compra_id, producto_id, nombre, precio_unitario, cantidad)
         VALUES (:compra, :producto, :nombre, :precio, :cantidad)'
    );

    foreach ($lineas as $linea) {
        $stmtItem->execute([
            'compra'   => $compraId,
            'producto' => $linea['id'],
            'nombre'   => $linea['nombre'],
            'precio'   => $linea['precio'],
            'cantidad' => $linea['cantidad'],
        ]);

        $productos[$linea['indice']]['cantidad'] -= $linea['cantidad'];
    }

    $json = json_encode($productos, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    ftruncate($archivo, 0);
    rewind($archivo);

    if (fwrite($archivo, $json) === false) {
        throw new RuntimeException('No se pudo escribir el inventario.');
    }

    fflush($archivo);
    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    liberar_inventario($archivo);
    responder(500, ['ok' => false, 'mensaje' => 'No se pudo registrar la compra.']);
}

liberar_inventario($archivo);

responder(200, [
    'ok'        => true,
    'mensaje'   => 'Compra registrada.',
    'compra_id' => $compraId,
    'productos' => $productos,
]);
