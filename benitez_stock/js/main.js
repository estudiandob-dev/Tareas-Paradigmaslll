/* ==========================================================
   main.js — PUNTO DE ENTRADA (único script que enlazan los HTML).
   Responsabilidad: arrancar la app y elegir el controlador según
   <body data-page="...">. No contiene lógica de negocio.

   HTML = estructura · CSS = presentación · JSON = datos · JS = comportamiento
   ========================================================== */

import { obtenerInventario } from "./api.js";
import { setProductos } from "./store.js";
import { plantillaFooter, plantillaHeader } from "./templates.js";
import { $, mostrarErrorGlobal } from "./ui.js";
import { actualizarContadorCarrito } from "./controllers/acciones.js";
import { iniciarCompra } from "./controllers/compra.js";
import { iniciarListadoBox, iniciarListadoTabla } from "./controllers/listados.js";
import { iniciarMonitor } from "./controllers/monitor.js";
import { iniciarProducto } from "./controllers/producto.js";

const CONTROLADORES = {
    monitor: iniciarMonitor,
    tabla: iniciarListadoTabla,
    box: iniciarListadoBox,
    producto: iniciarProducto,
    compra: iniciarCompra
};

// Imágenes rotas: el evento "error" no burbujea, por eso se escucha en fase de captura.
document.addEventListener("error", evento => {
    if (!(evento.target instanceof HTMLImageElement)) return;
    evento.target.classList.add("image-error");
    if (evento.target.classList.contains("product-thumb")) {
        evento.target.alt = "Imagen no disponible";
    }
}, true);

document.addEventListener("DOMContentLoaded", iniciarApp);

async function iniciarApp() {
    $("#site-header").innerHTML = plantillaHeader();
    $("#site-footer").innerHTML = plantillaFooter();

    try {
        setProductos(await obtenerInventario());
        CONTROLADORES[document.body.dataset.page]?.();
        actualizarContadorCarrito();
    } catch (error) {
        mostrarErrorGlobal("No se pudo cargar el inventario. Verificá que estés ejecutando el proyecto mediante Apache/XAMPP.");
        console.error(error);
    }
}
