/* ==========================================================
   controllers/monitor.js — página principal (index.html).
   Orquesta: lee estado -> pide plantillas -> pinta -> escucha eventos.
   ========================================================== */

import { RespuestaInvalidaError, reponerStock } from "../api.js";
import { estado, productosCriticos, setProductos, setUmbral } from "../store.js";
import {
    plantillaAlertas, plantillaOpcionesReposicion, plantillaTabla
} from "../templates.js";
import { $, mostrarResultado } from "../ui.js";
import { filtrarPorTexto } from "../utils.js";
import { activarAccionesProducto } from "./acciones.js";

export function iniciarMonitor() {
    const buscador = $("#search-input");
    const inputUmbral = $("#threshold-input");
    const botonUmbral = $("#apply-threshold");

    inputUmbral.value = estado.umbral;

    const dibujar = () => {
        const visibles = filtrarPorTexto(estado.productos, buscador.value);
        $("#stock-alerts").innerHTML = plantillaAlertas(productosCriticos(), estado.umbral);
        $("#inventory-table").innerHTML = plantillaTabla(visibles, estado.umbral);
        $("#inventory-counter").textContent = `${visibles.length} producto(s)`;
    };

    dibujar();
    activarAccionesProducto($("#inventory-table"));
    buscador.addEventListener("input", dibujar);

    botonUmbral.addEventListener("click", () => {
        const nuevoUmbral = Number(inputUmbral.value);
        if (Number.isNaN(nuevoUmbral) || nuevoUmbral < 0) return;

        setUmbral(nuevoUmbral);
        dibujar();   // al cambiar el umbral, la vista se transforma (alerta / filas críticas)
    });

    iniciarReposicion(dibujar);
}

function iniciarReposicion(redibujarMonitor) {
    const formulario = $("#restock-form");
    const selector = $("#restock-product");
    const inputCantidad = $("#restock-quantity");
    const resultado = $("#restock-result");

    const llenarSelector = () => {
        const seleccionado = selector.value;
        selector.innerHTML = plantillaOpcionesReposicion(estado.productos);
        if (seleccionado) selector.value = seleccionado;
    };

    llenarSelector();

    formulario.addEventListener("submit", async evento => {
        evento.preventDefault();

        const cantidad = Number(inputCantidad.value);
        if (!Number.isInteger(cantidad) || cantidad < 1) {
            mostrarResultado(resultado, "Ingresá una cantidad entera mayor a cero.", true);
            return;
        }

        const boton = $('button[type="submit"]', formulario);
        boton.disabled = true;

        try {
            const { exito, datos } = await reponerStock(Number(selector.value), cantidad);

            if (datos.productos) setProductos(datos.productos);

            if (!exito) {
                mostrarResultado(resultado, datos.mensaje || "No se pudo reponer el stock.", true);
                return;
            }

            redibujarMonitor();
            llenarSelector();
            inputCantidad.value = "";
            mostrarResultado(resultado, datos.mensaje);
        } catch (error) {
            console.error(error);
            mostrarResultado(
                resultado,
                error instanceof RespuestaInvalidaError
                    ? `El servidor no devolvió datos válidos (HTTP ${error.status}). Abrí el sitio desde Apache/XAMPP con PHP activo.`
                    : "No se pudo conectar con el servidor. Verificá que Apache con PHP (XAMPP) esté activo.",
                true
            );
        } finally {
            boton.disabled = false;
        }
    });
}
