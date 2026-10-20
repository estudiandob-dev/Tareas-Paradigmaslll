/* ==========================================================
   controllers/acciones.js — acciones comunes sobre un producto.
   Usa DELEGACIÓN DE EVENTOS: un único escuchador en el contenedor
   atiende los clics de todos los botones, incluso los que se
   crean después al volver a dibujar la tabla o las tarjetas.
   ========================================================== */

import { obtenerDetalles } from "../api.js";
import { agregarAlCarrito, unidadesEnCarrito } from "../store.js";
import { plantillaDetalleTecnico } from "../templates.js";
import { $, avisar } from "../ui.js";

export function actualizarContadorCarrito() {
    const contador = $("#cart-count");
    if (contador) contador.textContent = unidadesEnCarrito();
}

export function activarAccionesProducto(contenedor) {
    contenedor.addEventListener("click", evento => {
        const botonCompra = evento.target.closest(".js-add-cart");
        if (botonCompra) {
            const resultado = agregarAlCarrito(Number(botonCompra.dataset.id));
            avisar(resultado.mensaje, !resultado.ok);
            actualizarContadorCarrito();
            return;
        }

        const botonDetalle = evento.target.closest(".js-toggle-detalle");
        if (botonDetalle) alternarDetalle(botonDetalle, contenedor);
    });
}

/* Alterna entre la vista pública (ficha comercial) y la vista avanzada
   (detalle técnico). La información técnica se pide con fetch SOLO la
   primera vez que se despliega, y se inyecta dinámicamente en el DOM. */
async function alternarDetalle(boton, contenedor) {
    const id = boton.dataset.id;
    const envoltorio = $(`#detalle-${id}`, contenedor);
    if (!envoltorio) return;

    const panel = $(".tech-panel", envoltorio);

    if (!envoltorio.hidden) {
        envoltorio.hidden = true;
        boton.setAttribute("aria-expanded", "false");
        boton.textContent = "Detalle técnico";
        return;
    }

    boton.disabled = true;
    boton.textContent = "Cargando...";

    try {
        const detalles = await obtenerDetalles();
        panel.innerHTML = plantillaDetalleTecnico(detalles[id]);
        panel.classList.remove("tech-error");
    } catch (error) {
        console.error(error);
        panel.textContent = "No se pudo cargar el detalle técnico.";
        panel.classList.add("tech-error");
    } finally {
        boton.disabled = false;
    }

    envoltorio.hidden = false;
    boton.setAttribute("aria-expanded", "true");
    boton.textContent = "Ocultar detalle";
}
