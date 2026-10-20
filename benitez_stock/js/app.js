/* ==========================================================
   BENÍTEZ DESPENSAS - APP
   HTML = estructura
   JSON = datos
   JS = lógica
   CSS = presentación
   ========================================================== */

const APP = {
    productos: [],
    detalles: null,
    sesion: null,
    compras: [],
    umbral: Number(localStorage.getItem("umbralStock")) || 10,
    carrito: JSON.parse(localStorage.getItem("carritoBenitez")) || []
};

document.addEventListener("DOMContentLoaded", iniciarApp);

// Imágenes rotas: el evento "error" no burbujea, por eso se escucha en fase de captura.
// Reemplaza a los atributos onerror="..." que antes estaban dentro del HTML generado.
document.addEventListener("error", evento => {
    const imagen = evento.target;
    if (!(imagen instanceof HTMLImageElement)) return;

    imagen.classList.add("image-error");

    if (imagen.classList.contains("product-thumb")) {
        imagen.alt = "Imagen no disponible";
    }
}, true);

async function iniciarApp() {
    construirEstructuraComun();
    await verificarSesion();
    pintarSesionEnNav();

    try {
        APP.productos = await obtenerInventario();
        sincronizarControles();
        detectarPagina();
    } catch (error) {
        mostrarErrorGlobal("No se pudo cargar el inventario. Verificá que estés ejecutando el proyecto mediante Apache/XAMPP.");
        console.error(error);
    }
}

/* -------------------- DATOS -------------------- */

async function obtenerInventario() {
    const respuesta = await fetch("data/inventario.json", {
        cache: "no-store"
    });

    if (!respuesta.ok) {
        throw new Error(`HTTP ${respuesta.status}`);
    }

    return await respuesta.json();
}

/* -------------------- ESTRUCTURA -------------------- */

function construirEstructuraComun() {
    const header = document.getElementById("site-header");
    const footer = document.getElementById("site-footer");

    if (header) {
        header.innerHTML = `
            <nav class="main-nav">
                <div class="brand">
                    <a href="index.html">Benítez Despensas</a>
                </div>
                <div class="nav-links">
                    <a href="index.html">Monitor</a>
                    <a href="listado_tabla.html">Tabla</a>
                    <a href="listado_box.html">Productos</a>
                    <a id="nav-comprar" href="comprar.html" hidden>Comprar <span id="cart-count" class="cart-count">0</span></a>
                    <div id="nav-session" class="nav-session"></div>
                </div>
            </nav>
        `;
    }

    if (footer) {
        footer.innerHTML = `
            <footer class="site-footer-inner">
                <span>© 2026 Benítez Despensas</span>
                <span>Monitor de Inventario</span>
            </footer>
        `;
    }
}

function detectarPagina() {
    const pagina = location.pathname.split("/").pop() || "index.html";

    if (pagina === "index.html" || pagina === "") {
        renderMonitor();
    }

    if (pagina === "listado_tabla.html") {
        renderListadoTabla();
    }

    if (pagina === "listado_box.html") {
        renderListadoBox();
    }

    if (pagina === "producto.html") {
        renderProducto();
    }

    if (pagina === "comprar.html") {
        renderCompra();
    }

    if (pagina === "login.html") {
        renderLogin();
    }

    if (pagina === "mis_compras.html") {
        renderMisCompras();
    }

    actualizarContadorCarrito();
}

/* -------------------- MONITOR -------------------- */

function renderMonitor() {
    const thresholdInput = document.getElementById("threshold-input");
    const applyButton = document.getElementById("apply-threshold");
    const search = document.getElementById("search-input");

    if (thresholdInput) thresholdInput.value = APP.umbral;

    renderAlertas(APP.productos);
    renderTabla(APP.productos, "inventory-table", true);
    activarReposicion();

    if (search) {
        search.addEventListener("input", () => {
            const filtrados = filtrarProductos(search.value);
            renderTabla(filtrados, "inventory-table", true);
        });
    }

    if (applyButton) {
        applyButton.addEventListener("click", () => {
            const nuevoUmbral = Number(thresholdInput.value);

            if (nuevoUmbral < 0 || Number.isNaN(nuevoUmbral)) return;

            APP.umbral = nuevoUmbral;
            localStorage.setItem("umbralStock", nuevoUmbral);

            renderAlertas(APP.productos);
            renderTabla(filtrarProductos(search?.value || ""), "inventory-table", true);
        });
    }
}

/* -------------------- REPOSICIÓN DE STOCK -------------------- */

function activarReposicion() {
    const formulario = document.getElementById("restock-form");
    const selector = document.getElementById("restock-product");
    const cantidadInput = document.getElementById("restock-quantity");
    const resultado = document.getElementById("restock-result");

    if (!formulario || !selector || !cantidadInput) return;

    // Vista según sesión: el formulario solo se muestra a usuarios autenticados.
    formulario.hidden = !APP.sesion;
    if (!APP.sesion) return;

    const llenarSelector = () => {
        const seleccionado = selector.value;

        selector.innerHTML = APP.productos.map(producto => `
            <option value="${producto.id}">
                ${escapeHTML(producto.nombre)} (stock: ${producto.cantidad})
            </option>
        `).join("");

        if (seleccionado) selector.value = seleccionado;
    };

    const mostrar = (mensaje, error = false) => {
        resultado.className = `result-message ${error ? "result-error" : "result-success"}`;
        resultado.textContent = mensaje;
    };

    llenarSelector();

    formulario.addEventListener("submit", async evento => {
        evento.preventDefault();

        const cantidad = Number(cantidadInput.value);

        if (!Number.isInteger(cantidad) || cantidad < 1) {
            mostrar("Ingresá una cantidad entera mayor a cero.", true);
            return;
        }

        const boton = formulario.querySelector('button[type="submit"]');
        boton.disabled = true;

        try {
            const respuesta = await fetch("api/reponer.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: Number(selector.value), cantidad })
            });

            const texto = await respuesta.text();
            let datos;

            try {
                datos = JSON.parse(texto);
            } catch (errorJSON) {
                console.error("Respuesta inesperada del servidor:", respuesta.status, texto);
                mostrar(`El servidor no devolvió datos válidos (HTTP ${respuesta.status}). Abrí el sitio desde Apache/XAMPP con PHP activo.`, true);
                return;
            }

            if (datos.productos) APP.productos = datos.productos;

            if (!respuesta.ok || !datos.ok) {
                mostrar(datos.mensaje || "No se pudo reponer el stock.", true);
                return;
            }

            // Se refleja todo el monitor con el inventario ya guardado.
            const buscador = document.getElementById("search-input");
            renderAlertas(APP.productos);
            renderTabla(filtrarProductos(buscador?.value || ""), "inventory-table", true);
            llenarSelector();

            cantidadInput.value = "";
            mostrar(datos.mensaje);
        } catch (error) {
            console.error(error);
            mostrar("No se pudo conectar con el servidor. Verificá que Apache con PHP (XAMPP) esté activo.", true);
        } finally {
            boton.disabled = false;
        }
    });
}

function renderAlertas(productos) {
    const contenedor = document.getElementById("stock-alerts");
    if (!contenedor) return;

    const criticos = productos.filter(producto => producto.cantidad < APP.umbral);

    if (criticos.length === 0) {
        contenedor.innerHTML = `
            <div class="alert alert-ok">
                <strong>✓ Stock controlado</strong>
                <p>No hay productos por debajo del umbral crítico de ${APP.umbral} unidades.</p>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = `
        <div class="alert alert-critical">
            <strong>⚠ Alerta de stock crítico</strong>
            <p>Los siguientes productos están por debajo del umbral (${APP.umbral}):</p>
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

/* -------------------- TABLA -------------------- */

function renderListadoTabla() {
    const search = document.getElementById("search-input");

    renderTabla(APP.productos, "inventory-table", false);

    if (search) {
        search.addEventListener("input", () => {
            renderTabla(filtrarProductos(search.value), "inventory-table", false);
        });
    }
}

function renderTabla(productos, contenedorId, modoMonitor) {
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;

    const counter = document.getElementById("inventory-counter");
    if (counter) {
        counter.textContent = `${productos.length} producto(s)`;
    }

    if (productos.length === 0) {
        contenedor.innerHTML = `<div class="empty-state">No se encontraron productos.</div>`;
        return;
    }

    contenedor.innerHTML = `
        <table class="inventory-table">
            <thead>
                <tr>
                    <th>Imagen</th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Stock</th>
                    <th>Precio</th>
                    <th>Proveedor</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${productos.map(producto => filaProducto(producto)).join("")}
            </tbody>
        </table>
    `;

    activarEventosTabla(contenedor);
}

function filaProducto(producto) {
    const critico = producto.cantidad < APP.umbral;

    return `
        <tr class="${critico ? "row-critical" : ""}">
            <td>
                <img class="product-thumb"
                     src="${escapeAttribute(producto.imagen)}"
                     alt="${escapeAttribute(producto.nombre)}">
            </td>
            <td>
                <strong>${escapeHTML(producto.nombre)}</strong>
            </td>
            <td>${escapeHTML(producto.categoria)}</td>
            <td><strong>${producto.cantidad}</strong></td>
            <td>${formatearPrecio(producto.precio)}</td>
            <td>${escapeHTML(producto.proveedor)}</td>
            <td>
                <span class="status ${critico ? "status-critical" : "status-ok"}">
                    ${critico ? "CRÍTICO" : "OK"}
                </span>
            </td>
            <td class="actions">
                <a class="btn btn-small btn-info" href="producto.html?id=${producto.id}">Ver</a>
                ${APP.sesion ? `<button class="btn btn-small btn-primary js-add-cart" data-id="${producto.id}">
                    Comprar
                </button>` : ""}
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

function activarEventosTabla(contenedor) {
    // addEventListener: el HTML no contiene onclick.
    contenedor.querySelectorAll(".js-add-cart").forEach(boton => {
        boton.addEventListener("click", () => {
            agregarAlCarrito(Number(boton.dataset.id));
        });
    });

    activarEventosDetalle(contenedor);
}

/* -------------------- BOX -------------------- */

function renderListadoBox() {
    const grid = document.getElementById("product-grid");
    const search = document.getElementById("search-input");

    if (!grid) return;

    const dibujar = () => {
        const productos = filtrarProductos(search?.value || "");

        grid.innerHTML = productos.length
            ? productos.map(producto => tarjetaProducto(producto)).join("")
            : `<div class="empty-state">No se encontraron productos.</div>`;

        grid.querySelectorAll(".js-add-cart").forEach(boton => {
            boton.addEventListener("click", () => {
                agregarAlCarrito(Number(boton.dataset.id));
            });
        });

        activarEventosDetalle(grid);
    };

    dibujar();

    if (search) {
        search.addEventListener("input", dibujar);
    }
}

function tarjetaProducto(producto) {
    const critico = producto.cantidad < APP.umbral;

    return `
        <article class="product-card ${critico ? "card-critical" : ""}">
            <img src="${escapeAttribute(producto.imagen)}"
                 alt="${escapeAttribute(producto.nombre)}">
            <div class="product-card-body">
                <span class="category">${escapeHTML(producto.categoria)}</span>
                <h2>${escapeHTML(producto.nombre)}</h2>
                <p>${escapeHTML(producto.descripcion)}</p>
                <div class="card-data">
                    <span>Stock: <strong>${producto.cantidad}</strong></span>
                    <span>${formatearPrecio(producto.precio)}</span>
                </div>
                <span class="status ${critico ? "status-critical" : "status-ok"}">
                    ${critico ? "CRÍTICO" : "OK"}
                </span>
                <div class="card-actions">
                    <a class="btn btn-info" href="producto.html?id=${producto.id}">Ver ficha</a>
                    ${APP.sesion ? `<button class="btn btn-primary js-add-cart" data-id="${producto.id}">
                        Comprar
                    </button>` : ""}
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

/* -------------------- PRODUCTO -------------------- */

function renderProducto() {
    const contenedor = document.getElementById("product-detail");
    if (!contenedor) return;

    const id = Number(new URLSearchParams(location.search).get("id"));
    const producto = APP.productos.find(item => item.id === id);

    if (!producto) {
        contenedor.innerHTML = `
            <div class="panel empty-state">
                <h1>Producto no encontrado</h1>
                <a class="btn btn-primary" href="index.html">Volver al monitor</a>
            </div>
        `;
        return;
    }

    const critico = producto.cantidad < APP.umbral;

    contenedor.innerHTML = `
        <article class="product-detail panel">
            <div class="detail-image">
                <img src="${escapeAttribute(producto.imagen)}"
                     alt="${escapeAttribute(producto.nombre)}">
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
                    <span class="status ${critico ? "status-critical" : "status-ok"}">
                        ${critico ? "STOCK CRÍTICO" : "STOCK OK"}
                    </span>
                </div>

                <div class="form-actions">
                    ${APP.sesion ? `<button id="detail-buy" class="btn btn-primary">Agregar a compra</button>` : ""}
                    <a href="index.html" class="btn btn-secondary">Volver</a>
                </div>
            </div>
        </article>
    `;

    document.getElementById("detail-buy")?.addEventListener("click", () => {
        agregarAlCarrito(producto.id);
    });
}

/* -------------------- SESIÓN (login / registro / vista según usuario) -------------------- */

function crearElemento(etiqueta, texto, clase) {
    // Todo texto de usuario entra por textContent: nunca se interpreta como HTML (anti-XSS).
    const elemento = document.createElement(etiqueta);
    if (clase) elemento.className = clase;
    if (texto) elemento.textContent = texto;
    return elemento;
}

async function enviarJSON(url, cuerpo) {
    const respuesta = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo)
    });

    const texto = await respuesta.text();
    let datos = null;

    try {
        datos = JSON.parse(texto);
    } catch (error) {
        console.error("Respuesta inesperada del servidor:", respuesta.status, texto);
    }

    return { ok: respuesta.ok, status: respuesta.status, datos };
}

function mostrarMensaje(elemento, texto, esError = false) {
    elemento.hidden = false;
    elemento.className = `result-message ${esError ? "result-error" : "result-success"}`;
    elemento.textContent = texto;
}

async function verificarSesion() {
    // Se consulta al endpoint privado: 200 = sesión activa, 401 = visitante.
    APP.sesion = null;
    APP.compras = [];

    try {
        const respuesta = await fetch("api/mis_compras.php", { cache: "no-store" });
        if (!respuesta.ok) return;

        const datos = await respuesta.json();

        if (datos.ok && datos.usuario) {
            APP.sesion = datos.usuario;
            APP.compras = datos.compras || [];
        }
    } catch (error) {
        // Sin servidor PHP o sin red: se trata como visitante.
        console.error(error);
    }
}

function pintarSesionEnNav() {
    const zona = document.getElementById("nav-session");
    const enlaceCompra = document.getElementById("nav-comprar");
    if (!zona) return;

    zona.replaceChildren();

    // Vista de visitante vs. vista de usuario autenticado.
    if (enlaceCompra) enlaceCompra.hidden = !APP.sesion;

    // Todo elemento marcado con data-requiere-sesion en el HTML se muestra solo con sesión.
    document.querySelectorAll("[data-requiere-sesion]").forEach(elemento => {
        elemento.hidden = !APP.sesion;
    });

    if (!APP.sesion) {
        const ingresar = crearElemento("a", "Ingresar");
        ingresar.href = "login.html";
        zona.append(ingresar);
        return;
    }

    const misCompras = crearElemento("a", "Mis compras");
    misCompras.href = "mis_compras.html";

    const saludo = crearElemento("span", "", "nav-user");
    saludo.append("Hola, ", crearElemento("strong", APP.sesion.nombre));

    const salir = crearElemento("button", "Salir", "btn btn-small btn-secondary");
    salir.type = "button";
    salir.addEventListener("click", cerrarSesion);

    zona.append(misCompras, saludo, salir);
}

async function cerrarSesion() {
    try {
        await fetch("api/logout.php", { method: "POST" });
    } catch (error) {
        console.error(error);
    }

    // El carrito es de la sesión que termina.
    APP.carrito = [];
    guardarCarrito();

    location.href = "index.html";
}

function renderLogin() {
    if (APP.sesion) {
        location.replace("index.html");
        return;
    }

    const tabLogin = document.getElementById("tab-login");
    const tabRegistro = document.getElementById("tab-registro");
    const formLogin = document.getElementById("login-form");
    const formRegistro = document.getElementById("register-form");
    const mensajeLogin = document.getElementById("login-result");
    const mensajeRegistro = document.getElementById("register-result");

    if (!tabLogin || !tabRegistro || !formLogin || !formRegistro) return;

    const mostrarPestana = pestana => {
        const esLogin = pestana === "login";

        tabLogin.classList.toggle("active", esLogin);
        tabRegistro.classList.toggle("active", !esLogin);
        tabLogin.setAttribute("aria-selected", String(esLogin));
        tabRegistro.setAttribute("aria-selected", String(!esLogin));
        formLogin.hidden = !esLogin;
        formRegistro.hidden = esLogin;
    };

    tabLogin.addEventListener("click", () => mostrarPestana("login"));
    tabRegistro.addEventListener("click", () => mostrarPestana("registro"));

    formLogin.addEventListener("submit", async evento => {
        evento.preventDefault();

        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;

        if (!email || !password) {
            mostrarMensaje(mensajeLogin, "Ingresá correo y contraseña.", true);
            return;
        }

        const boton = formLogin.querySelector('button[type="submit"]');
        boton.disabled = true;

        try {
            const { ok, datos } = await enviarJSON("api/login.php", { email, password });

            if (ok && datos?.ok) {
                location.href = "index.html";
                return;
            }

            mostrarMensaje(mensajeLogin, datos?.mensaje || "No se pudo iniciar sesión. Verificá que Apache con PHP esté activo.", true);
        } catch (error) {
            console.error(error);
            mostrarMensaje(mensajeLogin, "No se pudo conectar con el servidor.", true);
        } finally {
            boton.disabled = false;
        }
    });

    formRegistro.addEventListener("submit", async evento => {
        evento.preventDefault();

        const nombre = document.getElementById("reg-nombre").value.trim();
        const email = document.getElementById("reg-email").value.trim();
        const password = document.getElementById("reg-password").value;
        const repetida = document.getElementById("reg-password2").value;

        if (!nombre || !email || !password) {
            mostrarMensaje(mensajeRegistro, "Completá todos los campos.", true);
            return;
        }

        if (password.length < 8) {
            mostrarMensaje(mensajeRegistro, "La contraseña debe tener al menos 8 caracteres.", true);
            return;
        }

        if (password !== repetida) {
            mostrarMensaje(mensajeRegistro, "Las contraseñas no coinciden.", true);
            return;
        }

        const boton = formRegistro.querySelector('button[type="submit"]');
        boton.disabled = true;

        try {
            const { ok, datos } = await enviarJSON("api/registro.php", { nombre, email, password });

            if (ok && datos?.ok) {
                formRegistro.reset();
                mostrarPestana("login");
                document.getElementById("login-email").value = email;
                mostrarMensaje(mensajeLogin, "Cuenta creada. Ya podés iniciar sesión.");
                return;
            }

            mostrarMensaje(mensajeRegistro, datos?.mensaje || "No se pudo crear la cuenta. Verificá que Apache con PHP esté activo.", true);
        } catch (error) {
            console.error(error);
            mostrarMensaje(mensajeRegistro, "No se pudo conectar con el servidor.", true);
        } finally {
            boton.disabled = false;
        }
    });
}

function formatearFechaHora(valor) {
    const [fecha, hora = ""] = String(valor).split(" ");
    const [anio, mes, dia] = fecha.split("-");
    return `${dia}/${mes}/${anio} ${hora.slice(0, 5)}`.trim();
}

function renderMisCompras() {
    // Página privada: sin sesión se redirige al acceso.
    if (!APP.sesion) {
        location.replace("login.html");
        return;
    }

    document.getElementById("account-name").textContent = APP.sesion.nombre;
    document.getElementById("account-email").textContent = APP.sesion.email;

    const lista = document.getElementById("purchases-list");
    if (!lista) return;

    lista.replaceChildren();

    if (APP.compras.length === 0) {
        lista.append(crearElemento("div", "Todavía no realizaste compras.", "panel empty-state"));
        return;
    }

    APP.compras.forEach(compra => {
        const tarjeta = crearElemento("article", "", "panel purchase-card");
        const cabecera = crearElemento("div", "", "panel-header");

        const titulo = crearElemento("div");
        titulo.append(
            crearElemento("h2", `Compra #${compra.id}`),
            crearElemento("span", `${formatearFechaHora(compra.fecha)} · ${compra.medio_pago}`, "muted")
        );

        cabecera.append(titulo, crearElemento("strong", formatearPrecio(compra.total), "purchase-total"));

        const items = crearElemento("ul", "", "purchase-items");
        compra.items.forEach(item => {
            items.append(crearElemento("li", `${item.cantidad} × ${item.nombre} — ${formatearPrecio(item.precio)} c/u`));
        });

        tarjeta.append(cabecera, items);
        lista.append(tarjeta);
    });
}

/* -------------------- DETALLE TÉCNICO (VSDM: vista avanzada) -------------------- */

async function obtenerDetalles() {
    // Se descarga una sola vez y queda en memoria.
    if (APP.detalles) return APP.detalles;

    const respuesta = await fetch("data/detalles.json", {
        cache: "no-store"
    });

    if (!respuesta.ok) {
        throw new Error(`HTTP ${respuesta.status}`);
    }

    APP.detalles = await respuesta.json();
    return APP.detalles;
}

function activarEventosDetalle(contenedor) {
    // Escuchador desacoplado: el HTML no contiene onclick.
    contenedor.querySelectorAll(".js-toggle-detalle").forEach(boton => {
        boton.addEventListener("click", () => alternarDetalle(boton));
    });
}

async function alternarDetalle(boton) {
    const id = boton.dataset.id;
    const envoltorio = document.getElementById(`detalle-${id}`);
    if (!envoltorio) return;

    const panel = envoltorio.querySelector(".tech-panel");

    // Si ya está abierto, se oculta.
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
        panel.innerHTML = renderDetalleTecnico(detalles[id]);
        panel.classList.remove("tech-error");
    } catch (error) {
        console.error(error);
        panel.textContent = "No se pudo cargar el detalle técnico.";
        panel.classList.add("tech-error");
    }

    envoltorio.hidden = false;
    boton.disabled = false;
    boton.setAttribute("aria-expanded", "true");
    boton.textContent = "Ocultar detalle";
}

function renderDetalleTecnico(detalle) {
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

/* -------------------- COMPRA -------------------- */

function renderCompra() {
    const contenedor = document.getElementById("purchase-products");
    const formulario = document.getElementById("purchase-form");
    const summary = document.getElementById("purchase-summary");

    if (!contenedor || !formulario) return;

    // Vista según sesión: sin sesión se oculta el formulario y se invita a ingresar.
    const aviso = document.getElementById("purchase-login-notice");
    formulario.hidden = !APP.sesion;
    if (aviso) aviso.hidden = Boolean(APP.sesion);
    if (!APP.sesion) return;

    // .value asigna texto plano (no interpreta HTML).
    const campoNombre = document.getElementById("customer-name");
    const campoEmail = document.getElementById("customer-email");
    if (campoNombre) campoNombre.value = APP.sesion.nombre;
    if (campoEmail) campoEmail.value = APP.sesion.email;

    dibujarCarrito();

    formulario.addEventListener("submit", async event => {
        event.preventDefault();

        if (APP.carrito.length === 0) {
            mostrarResultadoCompra("Agregá al menos un producto antes de confirmar.", true);
            return;
        }

        const datos = Object.fromEntries(new FormData(formulario).entries());
        const botonConfirmar = formulario.querySelector('button[type="submit"]');
        botonConfirmar.disabled = true;

        try {
            const respuesta = await fetch("api/comprar.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    medioPago: datos.medioPago,
                    items: APP.carrito.map(item => ({ id: item.id, cantidad: item.cantidad }))
                })
            });

            const texto = await respuesta.text();
            let resultado;

            try {
                resultado = JSON.parse(texto);
            } catch (errorJSON) {
                // Si llega HTML o código PHP en crudo, el servidor no está ejecutando PHP.
                console.error("Respuesta inesperada del servidor:", respuesta.status, texto);
                mostrarResultadoCompra(
                    `El servidor no devolvió datos válidos (HTTP ${respuesta.status}). Abrí el sitio desde Apache/XAMPP (http://localhost/...) con PHP activo.`,
                    true
                );
                return;
            }

            // El servidor devuelve el inventario vigente: se refleja siempre.
            if (resultado.productos) {
                APP.productos = resultado.productos;
            }

            if (!respuesta.ok || !resultado.ok) {
                sincronizarCarritoConStock();
                dibujarCarrito();
                actualizarContadorCarrito();
                mostrarResultadoCompra(resultado.mensaje || "No se pudo registrar la compra.", true);
                return;
            }

            console.log("Compra registrada:", { cliente: datos, productos: APP.carrito });

            mostrarResultadoCompra(
                `Compra registrada para ${datos.nombre}. El stock del inventario fue actualizado.`
            );

            APP.carrito = [];
            guardarCarrito();
            dibujarCarrito();
            formulario.reset();
            actualizarContadorCarrito();
        } catch (error) {
            console.error(error);
            mostrarResultadoCompra(
                "No se pudo conectar con el servidor. Verificá que Apache con PHP (XAMPP) esté activo.",
                true
            );
        } finally {
            botonConfirmar.disabled = false;
        }
    });

    function dibujarCarrito() {
        if (APP.carrito.length === 0) {
            contenedor.innerHTML = `<div class="empty-state">No hay productos seleccionados. Podés agregarlos desde el monitor.</div>`;
            summary.innerHTML = "";
            return;
        }

        contenedor.innerHTML = `
            <div class="cart-list">
                ${APP.carrito.map((item, index) => `
                    <div class="cart-item">
                        <img src="${escapeAttribute(item.imagen)}" alt="">
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

        summary.innerHTML = `
            <strong>Total estimado:</strong>
            ${formatearPrecio(calcularTotalCarrito())}
        `;

        contenedor.querySelectorAll(".js-remove-cart").forEach(button => {
            button.addEventListener("click", () => {
                APP.carrito.splice(Number(button.dataset.index), 1);
                guardarCarrito();
                dibujarCarrito();
                actualizarContadorCarrito();
            });
        });

        contenedor.querySelectorAll(".js-cart-quantity").forEach(input => {
            input.addEventListener("change", () => {
                const index = Number(input.dataset.index);
                const item = APP.carrito[index];
                const valor = Math.max(1, Math.min(Number(input.value), item.stockDisponible));

                item.cantidad = valor;
                input.value = valor;

                guardarCarrito();
                summary.innerHTML = `
                    <strong>Total estimado:</strong>
                    ${formatearPrecio(calcularTotalCarrito())}
                `;
            });
        });
    }
}

function agregarAlCarrito(id) {
    if (!APP.sesion) {
        alert("Iniciá sesión para comprar.");
        return;
    }

    const producto = APP.productos.find(item => item.id === id);
    if (!producto) return;

    if (producto.cantidad <= 0) {
        alert("Este producto no tiene stock disponible.");
        return;
    }

    const existente = APP.carrito.find(item => item.id === id);

    if (existente) {
        if (existente.cantidad < producto.cantidad) {
            existente.cantidad++;
        } else {
            alert("No podés superar el stock disponible.");
        }
    } else {
        APP.carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.imagen,
            cantidad: 1,
            stockDisponible: producto.cantidad
        });
    }

    guardarCarrito();
    actualizarContadorCarrito();
}

function sincronizarCarritoConStock() {
    // Ajusta el carrito al stock real: quita lo agotado y recorta cantidades excedidas.
    APP.carrito = APP.carrito.filter(item => {
        const producto = APP.productos.find(p => p.id === item.id);
        if (!producto || producto.cantidad <= 0) return false;

        item.stockDisponible = producto.cantidad;
        item.cantidad = Math.min(item.cantidad, producto.cantidad);
        return true;
    });

    guardarCarrito();
}

function guardarCarrito() {
    localStorage.setItem("carritoBenitez", JSON.stringify(APP.carrito));
}

function actualizarContadorCarrito() {
    const contador = document.getElementById("cart-count");
    if (!contador) return;

    const cantidad = APP.carrito.reduce((total, item) => total + item.cantidad, 0);
    contador.textContent = cantidad;
}

function calcularTotalCarrito() {
    return APP.carrito.reduce(
        (total, item) => total + item.precio * item.cantidad,
        0
    );
}

function mostrarResultadoCompra(mensaje, error = false) {
    const resultado = document.getElementById("purchase-result");
    if (!resultado) return;

    resultado.className = `result-message ${error ? "result-error" : "result-success"}`;
    resultado.textContent = mensaje;
}

/* -------------------- UTILIDADES -------------------- */

function filtrarProductos(termino) {
    const texto = termino.trim().toLowerCase();

    if (!texto) return APP.productos;

    return APP.productos.filter(producto =>
        producto.nombre.toLowerCase().includes(texto) ||
        producto.categoria.toLowerCase().includes(texto) ||
        producto.proveedor.toLowerCase().includes(texto)
    );
}

function sincronizarControles() {
    const input = document.getElementById("threshold-input");
    if (input) input.value = APP.umbral;
}

function formatearPrecio(valor) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 2
    }).format(valor);
}

function formatearFecha(fecha) {
    const [year, month, day] = fecha.split("-");
    return `${day}/${month}/${year}`;
}

function escapeHTML(valor) {
    return String(valor)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeAttribute(valor) {
    return escapeHTML(valor);
}

function mostrarErrorGlobal(mensaje) {
    const main = document.querySelector("main");
    if (!main) return;

    const aviso = document.createElement("div");
    aviso.className = "alert alert-critical";
    aviso.textContent = mensaje;
    main.prepend(aviso);
}
