/* ==========================================================
   store.js — ESTADO de la aplicación y su persistencia.
   Única responsabilidad: guardar datos en memoria / localStorage
   y aplicar reglas sobre ellos. No toca el DOM ni la red.
   ========================================================== */

import { esCritico } from "./utils.js";

const CLAVE_UMBRAL = "umbralStock";
const CLAVE_CARRITO = "carritoBenitez";

function leerCarritoGuardado() {
    try {
        const guardado = JSON.parse(localStorage.getItem(CLAVE_CARRITO));
        return Array.isArray(guardado) ? guardado : [];
    } catch {
        return [];
    }
}

export const estado = {
    productos: [],
    umbral: Number(localStorage.getItem(CLAVE_UMBRAL)) || 10,
    carrito: leerCarritoGuardado()
};

/* ---------- Inventario ---------- */

export function setProductos(productos) {
    estado.productos = productos;
}

export function productosCriticos() {
    return estado.productos.filter(producto => esCritico(producto, estado.umbral));
}

export function setUmbral(valor) {
    estado.umbral = valor;
    localStorage.setItem(CLAVE_UMBRAL, valor);
}

/* ---------- Carrito ---------- */

export function guardarCarrito() {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(estado.carrito));
}

/* Devuelve { ok, mensaje } para que la vista decida cómo avisar. */
export function agregarAlCarrito(id) {
    const producto = estado.productos.find(item => item.id === id);
    if (!producto) return { ok: false, mensaje: "Producto inexistente." };

    if (producto.cantidad <= 0) {
        return { ok: false, mensaje: "Este producto no tiene stock disponible." };
    }

    const existente = estado.carrito.find(item => item.id === id);

    if (existente) {
        if (existente.cantidad >= producto.cantidad) {
            return { ok: false, mensaje: "No podés superar el stock disponible." };
        }
        existente.cantidad++;
    } else {
        estado.carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.imagen,
            cantidad: 1,
            stockDisponible: producto.cantidad
        });
    }

    guardarCarrito();
    return { ok: true, mensaje: `${producto.nombre} agregado a la compra.` };
}

export function quitarDelCarrito(indice) {
    estado.carrito.splice(indice, 1);
    guardarCarrito();
}

export function cambiarCantidad(indice, cantidad) {
    const item = estado.carrito[indice];
    const valida = Math.max(1, Math.min(Number(cantidad), item.stockDisponible));
    item.cantidad = valida;
    guardarCarrito();
    return valida;
}

export function vaciarCarrito() {
    estado.carrito = [];
    guardarCarrito();
}

/* Ajusta el carrito al stock real: quita lo agotado y recorta lo excedido. */
export function sincronizarCarritoConStock() {
    estado.carrito = estado.carrito.filter(item => {
        const producto = estado.productos.find(p => p.id === item.id);
        if (!producto || producto.cantidad <= 0) return false;

        item.stockDisponible = producto.cantidad;
        item.cantidad = Math.min(item.cantidad, producto.cantidad);
        return true;
    });

    guardarCarrito();
}

export function totalCarrito() {
    return estado.carrito.reduce((total, item) => total + item.precio * item.cantidad, 0);
}

export function unidadesEnCarrito() {
    return estado.carrito.reduce((total, item) => total + item.cantidad, 0);
}
