/* ==========================================================
   utils.js — funciones PURAS (no tocan el DOM, ni la red,
   ni localStorage). Fáciles de probar y de reutilizar.
   ========================================================== */

export function formatearPrecio(valor) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 2
    }).format(valor);
}

export function formatearFecha(fecha) {
    const [year, month, day] = fecha.split("-");
    return `${day}/${month}/${year}`;
}

export function escapeHTML(valor) {
    return String(valor)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/* Regla de dominio: un producto es crítico si su stock está por debajo del umbral. */
export function esCritico(producto, umbral) {
    return producto.cantidad < umbral;
}

export function filtrarPorTexto(productos, termino) {
    const texto = termino.trim().toLowerCase();
    if (!texto) return productos;

    return productos.filter(producto =>
        producto.nombre.toLowerCase().includes(texto) ||
        producto.categoria.toLowerCase().includes(texto) ||
        producto.proveedor.toLowerCase().includes(texto)
    );
}
