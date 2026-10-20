/* ==========================================================
   controllers/listados.js — listado_tabla.html y listado_box.html.
   ========================================================== */

import { estado } from "../store.js";
import { plantillaTabla, plantillaTarjetas } from "../templates.js";
import { $ } from "../ui.js";
import { filtrarPorTexto } from "../utils.js";
import { activarAccionesProducto } from "./acciones.js";

/* Ambas páginas hacen lo mismo y solo cambian el contenedor y la plantilla. */
function iniciarListado(selectorContenedor, plantilla) {
    const contenedor = $(selectorContenedor);
    const buscador = $("#search-input");

    const dibujar = () => {
        contenedor.innerHTML = plantilla(filtrarPorTexto(estado.productos, buscador.value), estado.umbral);
    };

    dibujar();
    activarAccionesProducto(contenedor);
    buscador.addEventListener("input", dibujar);
}

export const iniciarListadoTabla = () => iniciarListado("#inventory-table", plantillaTabla);
export const iniciarListadoBox = () => iniciarListado("#product-grid", plantillaTarjetas);
