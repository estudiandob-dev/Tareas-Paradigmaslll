<?php
/*
 * ENDPOINT PRIVADO: datos del usuario autenticado y su historial de compras.
 * Sin sesión activa responde 401 Unauthorized.
 * El frontend lo consulta al cargar cada página para saber si hay sesión.
 */

require_once __DIR__ . '/../config/api.php';
require_once __DIR__ . '/../config/conexion.php';

solo_metodo('GET');

// Guardián de sesión: corta con 401 si no existe $_SESSION['usuario_id'].
$usuarioId = requerir_sesion();

try {
    $stmt = $pdo->prepare('SELECT nombre, email FROM usuarios WHERE id = :id');
    $stmt->execute(['id' => $usuarioId]);
    $usuario = $stmt->fetch();

    if (!$usuario) {
        // La sesión apunta a un usuario que ya no existe: se invalida.
        $_SESSION = [];
        session_destroy();
        responder(401, ['ok' => false, 'mensaje' => 'Acceso no autorizado. Iniciá sesión.']);
    }

    $stmt = $pdo->prepare(
        'SELECT id, fecha, medio_pago, total
           FROM compras
          WHERE usuario_id = :id
          ORDER BY id DESC
          LIMIT 50'
    );
    $stmt->execute(['id' => $usuarioId]);
    $compras = $stmt->fetchAll();

    $itemsPorCompra = [];

    if ($compras) {
        $ids = array_column($compras, 'id');
        $marcas = implode(',', array_fill(0, count($ids), '?'));

        $stmt = $pdo->prepare(
            "SELECT compra_id, nombre, precio_unitario, cantidad
               FROM compra_items
              WHERE compra_id IN ($marcas)
              ORDER BY id ASC"
        );
        $stmt->execute($ids);

        foreach ($stmt->fetchAll() as $fila) {
            $itemsPorCompra[$fila['compra_id']][] = [
                'nombre'   => $fila['nombre'],
                'precio'   => (float) $fila['precio_unitario'],
                'cantidad' => (int) $fila['cantidad'],
            ];
        }
    }

    $respuesta = [];
    foreach ($compras as $compra) {
        $respuesta[] = [
            'id'         => (int) $compra['id'],
            'fecha'      => $compra['fecha'],
            'medio_pago' => $compra['medio_pago'],
            'total'      => (float) $compra['total'],
            'items'      => $itemsPorCompra[$compra['id']] ?? [],
        ];
    }

    responder(200, [
        'ok'      => true,
        'usuario' => ['nombre' => $usuario['nombre'], 'email' => $usuario['email']],
        'compras' => $respuesta,
    ]);
} catch (PDOException $e) {
    responder(500, ['ok' => false, 'mensaje' => 'Error interno del servidor.']);
}
