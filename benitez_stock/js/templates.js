/* ==========================================================
   templates.js — VISTA (plantillas).
   Cada función recibe datos y DEVUELVE un string HTML.
   No lee el estado global, no registra eventos, no hace fetch.
   Los datos del JSON se escapan siempre con escapeHTML.
   ========================================================== */

import { escapeHTML, esCritico, formatearFecha, formatearPrecio } from "./utils.js";

/* ---------- Estructura común ---------- */

export const plantillaHeader = () => `
    <nav class="main-nav">
        <div class="brand">
            <a href="index.html">Benítez Despensas</a>
        </div>
        <div class="nav-links">
            <a href="index.html">Monitor</a>
            <a href="listado_tabla.html">Tabla</a>
            <a href="listado_box.html">Productos</a>
            <a href="comprar.html">Comprar <span id="cart-count" class="cart-count">0</span></a>
        </div>
    </nav>
`;

export const plantillaFooter = () => `
    <footer class="site-footer-inner">
        <span>© 2026 Benítez Despensas</span>
        <span>Monitor de Inventario</span>
    </footer>
`;

/* ---------- Alertas (transformación de la vista al cruzar el umbral) ---------- */

export function plantillaAlertas(criticos, umbral) {
    if (criticos.length === 0) {
        return `
            <div class="alert alert-ok">
                <strong>✓ Stock controlado</strong>
                <p>No hay productos por debajo del umbral crítico de ${umbral} unidades.</p>
            </div>
        `;
    }

    return `
        <div class="alert alert-critical">
            <strong>⚠ Alerta de stock crítico</strong>
            <p>Los siguientes productos están por debajo del umbral (${umbral}):</p>
            <ul>
                ${criticos.map(producto => `
                    <li>
                        <a href="producto.html?id=${producto.id}">${escapeHTML(producto.nombre)}</a>
                        — ${producto.cantidad} unidades
                    </li>
                `).join("")}
            </ul>
        </div>
    `;
}

export const plantillaOpcionesReposicion = productos => productos.map(producto => `
    <option value="${producto.id}">
        ${escapeHTML(producto.nombre)} (stock: ${producto.cantidad})
    </option>
`).join("");

/* ---------- Tabla ---------- */

const plantillaEstado = (critico, textoCritico = "CRÍTICO", textoOk = "OK") => `
    <span class="status ${critico ? "status-critical" : "status-ok"}">
        ${critico ? textoCritico : textoOk}
    </span>
`;

function filaProducto(producto, umbral) {
    const critico = esCritico(producto, umbral);

    return `
        <tr class="${critico ? "row-critical" : ""}">
            <td>
                <img class="product-thumb"
                     src="${escapeHTML(producto.imagen)}"
                     alt="${escapeHTML(producto.nombre)}">
            </td>
            <td><strong>${escapeHTML(producto.nombre)}</strong></td>
            <td>${escapeHTML(producto.categoria)}</td>
            <td><strong>${producto.cantidad}</strong></td>
            <td>${formatearPrecio(producto.precio)}</td>
            <td>${escapeHTML(producto.proveedor)}</td>
            <td>${plantillaEstado(critico)}</td>
            <td class="actions">
                <a class="btn btn-small btn-info" href="producto.html?id=${producto.id}">Ver</a>
                <button class="btn btn-small btn-primary js-add-cart" data-id="${producto.id}">
                    Comprar
                </button>
                <button class="btn btn-small btn-secondary js-toggle-detalle" data-id="${producto.id}"
                        aria-expanded="false" aria-controls="detalle-${producto.id}">
                    Detalle técnico
                </button>
            </td>
        </tr>
        <tr id="detalle-${producto.id}" class="detail-row" hidden>
            <td colspan="8"><div class="tech-panel"></div></td>
        </tr>
    `;
}

export function plantillaTabla(productos, umbral) {
    if (productos.length === 0) {
        return `<div class="empty-state">No se encontraron productos.</div>`;
    }

    return `
        <table class="inventory-table">
            <thead>
                <tr>
                    <th>Imagen</th><th>Producto</th><th>Categoría</th><th>Stock</th>
                    <th>Precio</th><th>Proveedor</th><th>Estado</th><th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${productos.map(producto => filaProducto(producto, umbral)).join("")}
            </tbody>
        </table>
    `;
}

/* ---------- Tarjetas (vista box) ---------- */

function tarjetaProducto(producto, umbral) {
    const critico = esCritico(producto, umbral);

    return `
        <article class="product-card ${critico ? "card-critical" : ""}">
            <img src="${escapeHTML(producto.imagen)}" alt="${escapeHTML(producto.nombre)}">
            <div class="product-card-body">
                <span class="category">${escapeHTML(producto.categoria)}</span>
                <h2>${escapeHTML(producto.nombre)}</h2>
                <p>${escapeHTML(producto.descripcion)}</p>
                <div class="card-data">
                    <span>Stock: <strong>${producto.cantidad}</strong></span>
                    <span>${formatearPrecio(producto.precio)}</span>
                </div>
                ${plantillaEstado(critico)}
                <div class="card-actions">
                    <a class="btn btn-info" href="producto.html?id=${producto.id}">Ver ficha</a>
                    <button class="btn btn-primary js-add-cart" data-id="${producto.id}">
                        Comprar
                    </button>
                </div>
                <button class="btn btn-secondary btn-block js-toggle-detalle" data-id="${producto.id}"
                        aria-expanded="false" aria-controls="detalle-${producto.id}">
                    Detalle técnico
                </button>
                <div id="detalle-${producto.id}" class="tech-wrap" hidden>
                    <div class="tech-panel"></div>
                </div>
            </div>
        </article>
    `;
}

export function plantillaTarjetas(productos, umbral) {
    if (productos.length === 0) {
        return `<div class="empty-state">No se encontraron productos.</div>`;
    }
    return productos.map(producto => tarjetaProducto(producto, umbral)).join("");
}

/* ---------- Ficha de producto ---------- */

export const plantillaNoEncontrado = () => `
    <div class="panel empty-state">
        <h1>Producto no encontrado</h1>
        <a class="btn btn-primary" href="index.html">Volver al monitor</a>
    </div>
`;

export function plantillaFicha(producto, umbral) {
    const critico = esCritico(producto, umbral);

    return `
        <article class="product-detail panel">
            <div class="detail-image">
                <img src="${escapeHTML(producto.imagen)}" alt="${escapeHTML(producto.nombre)}">
            </div>

            <div class="detail-content">
                <span class="category">${escapeHTML(producto.categoria)}</span>
                <h1>${escapeHTML(producto.nombre)}</h1>
                <p class="detail-description">${escapeHTML(producto.descripcion)}</p>

                <div class="detail-grid">
                    <div><span>Stock</span><strong>${producto.cantidad}</strong></div>
                    <div><span>Precio</span><strong>${formatearPrecio(producto.precio)}</strong></div>
                    <div><span>Proveedor</span><strong>${escapeHTML(producto.proveedor)}</strong></div>
                    <div><span>Recepción</span><strong>${formatearFecha(producto.fecha)}</strong></div>
                </div>

                <div class="detail-status">
                    ${plantillaEstado(critico, "STOCK CRÍTICO", "STOCK OK")}
                </div>

                <div class="form-actions">
                    <button class="btn btn-primary js-add-cart" data-id="${producto.id}">Agregar a compra</button>
                    <a href="index.html" class="btn btn-secondary">Volver</a>
                </div>
            </div>
        </article>
    `;
}

/* ---------- Vista técnica (VSDM: vista avanzada) ---------- */

export function plantillaDetalleTecnico(detalle) {
    if (!detalle) {
        return `<p class="muted">Este producto todavía no tiene información técnica cargada.</p>`;
    }

    return `
        <dl class="tech-grid">
            <div><dt>Código (SKU)</dt><dd>${escapeHTML(detalle.sku)}</dd></div>
            <div><dt>Ubicación</dt><dd>${escapeHTML(detalle.ubicacion)}</dd></div>
            <div><dt>Lote</dt><dd>${escapeHTML(detalle.lote)}</dd></div>
            <div><dt>Vencimiento</dt><dd>${formatearFecha(detalle.vencimiento)}</dd></div>
            <div><dt>Peso / Contenido</dt><dd>${escapeHTML(detalle.peso)}</dd></div>
            <div><dt>Medidas</dt><dd>${escapeHTML(detalle.medidas)}</dd></div>
            <div><dt>Almacenamiento</dt><dd>${escapeHTML(detalle.almacenamiento)}</dd></div>
            <div><dt>Contacto proveedor</dt><dd>${escapeHTML(detalle.contacto)}</dd></div>
        </dl>
    `;
}

/* ---------- Carrito ---------- */

export const plantillaCarritoVacio = () =>
    `<div class="empty-state">No hay productos seleccionados. Podés agregarlos desde el monitor.</div>`;

export const plantillaCarrito = carrito => `
    <div class="cart-list">
        ${carrito.map((item, index) => `
            <div class="cart-item">
                <img src="${escapeHTML(item.imagen)}" alt="">
                <div class="cart-item-info">
                    <strong>${escapeHTML(item.nombre)}</strong>
                    <span>${formatearPrecio(item.precio)} c/u</span>
                </div>
                <div class="quantity-control">
                    <label>Cantidad</label>
                    <input class="js-cart-quantity" data-index="${index}" type="number"
                           min="1" max="${item.stockDisponible}" value="${item.cantidad}">
                </div>
                <button type="button" class="btn btn-small btn-danger js-remove-cart" data-index="${index}">
                    Quitar
                </button>
            </div>
        `).join("")}
    </div>
`;

export const plantillaResumen = total => `
    <strong>Total estimado:</strong> ${formatearPrecio(total)}
`;
