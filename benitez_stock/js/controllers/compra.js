/* ==========================================================
   controllers/compra.js — comprar.html
   ========================================================== */

import { RespuestaInvalidaError, registrarCompra } from "../api.js";
import {
    cambiarCantidad, estado, quitarDelCarrito, setProductos,
    sincronizarCarritoConStock, totalCarrito, vaciarCarrito
} from "../store.js";
import { plantillaCarrito, plantillaCarritoVacio, plantillaResumen } from "../templates.js";
import { $, mostrarResultado } from "../ui.js";
import { actualizarContadorCarrito } from "./acciones.js";

export function iniciarCompra() {
    const formulario = $("#purchase-form");
    const contenedor = $("#purchase-products");
    const resumen = $("#purchase-summary");
    const resultado = $("#purchase-result");

    const dibujarResumen = () => {
        resumen.innerHTML = estado.carrito.length ? plantillaResumen(totalCarrito()) : "";
    };

    const dibujarCarrito = () => {
        contenedor.innerHTML = estado.carrito.length
            ? plantillaCarrito(estado.carrito)
            : plantillaCarritoVacio();
        dibujarResumen();
        actualizarContadorCarrito();
    };

    dibujarCarrito();

    // Delegación: quitar producto
    contenedor.addEventListener("click", evento => {
        const boton = evento.target.closest(".js-remove-cart");
        if (!boton) return;
        quitarDelCarrito(Number(boton.dataset.index));
        dibujarCarrito();
    });

    // Delegación: cambiar cantidad
    contenedor.addEventListener("change", evento => {
        const input = evento.target.closest(".js-cart-quantity");
        if (!input) return;
        input.value = cambiarCantidad(Number(input.dataset.index), input.value);
        dibujarResumen();
        actualizarContadorCarrito();
    });

    formulario.addEventListener("submit", async evento => {
        evento.preventDefault();

        if (estado.carrito.length === 0) {
            mostrarResultado(resultado, "Agregá al menos un producto antes de confirmar.", true);
            return;
        }

        const cliente = Object.fromEntries(new FormData(formulario).entries());
        const boton = $('button[type="submit"]', formulario);
        boton.disabled = true;

        try {
            const items = estado.carrito.map(({ id, cantidad }) => ({ id, cantidad }));
            const { exito, datos } = await registrarCompra(items);

            // El servidor devuelve el inventario vigente: se refleja siempre.
            if (datos.productos) setProductos(datos.productos);

            if (!exito) {
                sincronizarCarritoConStock();
                dibujarCarrito();
                mostrarResultado(resultado, datos.mensaje || "No se pudo registrar la compra.", true);
                return;
            }

            vaciarCarrito();
            dibujarCarrito();
            formulario.reset();
            mostrarResultado(resultado, `Compra registrada para ${cliente.nombre}. El stock del inventario fue actualizado.`);
        } catch (error) {
            console.error(error);
            mostrarResultado(
                resultado,
                error instanceof RespuestaInvalidaError
                    ? `El servidor no devolvió datos válidos (HTTP ${error.status}). Abrí el sitio desde Apache/XAMPP (http://localhost/...) con PHP activo.`
                    : "No se pudo conectar con el servidor. Verificá que Apache con PHP (XAMPP) esté activo.",
                true
            );
        } finally {
            boton.disabled = false;
        }
    });
}
