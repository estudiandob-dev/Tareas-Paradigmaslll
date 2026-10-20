BENÍTEZ DESPENSAS - PROTOTIPO DE INVENTARIO
=============================================

REQUISITOS
----------
- XAMPP con Apache, PHP y MySQL (MariaDB) iniciados.
- Navegador moderno.

INSTALACIÓN
-----------
1. Copiar la carpeta "benitez_stock" dentro de:
   C:\xampp\htdocs\

2. Iniciar Apache desde XAMPP.

3. Abrir:
   http://localhost/benitez_stock/

BASE DE DATOS (usuarios y compras)
----------------------------------
1. En XAMPP iniciar Apache y MySQL.
2. Abrir http://localhost/phpmyadmin -> pestaña "Importar" -> elegir
   sql/benitez_stock.sql -> Continuar. Crea la base "benitez_stock" con las
   tablas usuarios (password VARCHAR(255) con hash BCRYPT), compras y compra_items.
3. Si root tiene contraseña, cargarla en config/conexion.php ($pass).
4. Abrir http://localhost/benitez_stock/login.html, crear una cuenta e ingresar.

IMPORTANTE
----------
No abrir index.html haciendo doble clic.
El proyecto utiliza fetch() para leer data/inventario.json,
por lo que debe ejecutarse mediante Apache.

IMÁGENES
--------
Colocar tus imágenes dentro de:

imgstock/

Los nombres utilizados por el JSON de ejemplo son:

- harina-morixe-0000.jpg
- harina-morixe-000.jpg
- arroz-largo-fino.jpg
- figura-ajo.jpg
- aceite.jpg
- azucar.jpg

Si tus archivos tienen otros nombres, modificar únicamente
el campo "imagen" correspondiente en data/inventario.json.

ARQUITECTURA
------------
HTML:
  Solo estructura y contenedores.

CSS:
  Toda la presentación.

JSON:
  Datos de los productos.

JS:
  fetch(), renderizado, eventos, alertas, búsqueda,
  producto individual y carrito.

jQuery:
  No se utiliza. Toda la lógica es JavaScript nativo.

FUNCIONES INCLUIDAS
-------------------
- Monitor central de inventario.
- fetch() del JSON.
- Alerta automática de stock crítico.
- Umbral configurable y guardado en localStorage.
- Búsqueda.
- Vista tabla.
- Vista box.
- Ficha individual mediante producto.html?id=...
- Carrito de compra con localStorage.
- Formulario de compra.
- Diseño responsive.
- Eventos mediante addEventListener (sin onclick/onerror en el HTML).
- Detalle técnico por producto (Opción 8): data/detalles.json.
- HTML desacoplado de los datos.

NOTA SOBRE PERSISTENCIA
-----------------------
El navegador no puede modificar directamente inventario.json
por seguridad. Esta versión usa el JSON como fuente de lectura
y localStorage para preferencias/carrito.

Si más adelante querés persistencia real de productos,
se puede agregar PHP + MySQL sin cambiar la interfaz.

Descuento de stock al comprar:
- "Comprar" agrega al carrito; "Confirmar compra" (comprar.html) llama por fetch (POST)
  a api/comprar.php, que descuenta las cantidades en data/inventario.json.
- Requiere Apache con PHP (XAMPP). Con otro servidor (Live Server, http.server) el
  resto del sitio funciona, pero la compra no podrá guardar el stock.
- data/inventario.json debe tener permiso de escritura.

Reposición de stock:
- En index.html, el panel "Reponer stock" llama por fetch (POST) a api/reponer.php,
  que SUMA unidades al producto en data/inventario.json y actualiza su fecha de recepción.


Autenticación y sesiones:
- api/registro.php: valida, hashea con password_hash(PASSWORD_BCRYPT) e inserta con PDO
  (prepared statements). Clave de 8 a 72 caracteres.
- api/login.php: password_verify() + session_start() + session_regenerate_id(true);
  guarda $_SESSION['usuario_id'].
- api/logout.php: destruye la sesión y la cookie.
- api/mis_compras.php (endpoint privado): responde 401 si no hay $_SESSION['usuario_id'].
  El frontend lo consulta al cargar cada página para saber si hay sesión.
- api/comprar.php y api/reponer.php también exigen sesión (401 sin ella).
  comprar.php guarda la compra del usuario en MySQL y descuenta el stock del JSON.
- Visitante: ve el inventario, sin botones Comprar ni formulario de reposición.
  Usuario autenticado: ve Comprar, Reposición, "Mis compras" y su nombre en el menú.
- Los datos del usuario se muestran siempre con textContent (nunca innerHTML) para
  evitar XSS; el servidor guarda el nombre tal cual y no lo escapa antes.
- La cookie de sesión es HttpOnly y SameSite=Lax.
