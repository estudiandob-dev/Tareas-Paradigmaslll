/* ==========================================================
   controllers/producto.js — producto.html?id=...
   ========================================================== */

import { estado } from "../store.js";
import { plantillaFicha, plantillaNoEncontrado } from "../templates.js";
import { $ } from "../ui.js";
import { activarAccionesProducto } from "./acciones.js";

export function iniciarProducto() {
    const contenedor = $("#product-detail");
    const id = Number(new URLSearchParams(location.search).get("id"));
    const producto = estado.productos.find(item => item.id === id);

    contenedor.innerHTML = producto
        ? plantillaFicha(producto, estado.umbral)
        : plantillaNoEncontrado();

    activarAccionesProducto(contenedor);
}
