/**
 * Monitor de Inventario y Alerta de Estado Crítico
 * Opción 12 - Cátedra Paradigmas 3
 * - addEventListener only (no inline handlers)
 * - fetch + async/await for stock data
 * - Visual alerts when qty < threshold
 * - CRUD with localStorage persistence
 * - DOM updates without page reload
 */

const STORAGE_KEY = 'paradigmas_stock';
const THRESHOLD_KEY = 'paradigmas_threshold';
const DEFAULT_THRESHOLD = 10;

let productos = [];
let umbral = DEFAULT_THRESHOLD;
let editandoId = null;

/* ---------- Helpers ---------- */
function $(sel) {
  return document.querySelector(sel);
}

function $$(sel) {
  return document.querySelectorAll(sel);
}

function formatPrice(n) {
  return '$' + Number(n).toFixed(2);
}

/* ---------- Data loading ---------- */
async function cargarStock() {
  // Prefer localStorage (user changes), fallback to fetch JSON
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    try {
      productos = JSON.parse(cached);
      return;
    } catch (e) {
      console.warn('localStorage corrupt, falling back to fetch');
    }
  }

  try {
    const res = await fetch('data/stock.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    productos = await res.json();
    guardarLocal();
  } catch (err) {
    console.error('Error al cargar stock:', err);
    productos = [];
  }
}

function guardarLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(productos));
}

function cargarUmbral() {
  const saved = localStorage.getItem(THRESHOLD_KEY);
  umbral = saved !== null ? Number(saved) : DEFAULT_THRESHOLD;
  const input = $('#umbral');
  if (input) input.value = umbral;
}

/* ---------- Rendering ---------- */
function renderAlertas() {
  const banner = $('#alert-banner');
  const lista = $('#alert-list');
  if (!banner || !lista) return;

  const umbralTexto = $('#umbral-texto');
  if (umbralTexto) umbralTexto.textContent = umbral;

  const criticos = productos.filter(p => p.cantidad < umbral);

  if (criticos.length === 0) {
    banner.classList.remove('visible');
    return;
  }

  lista.innerHTML = criticos
    .map(p => `<li><strong>${p.nombre}</strong>: ${p.cantidad} u. (umbral: ${umbral})</li>`)
    .join('');
  banner.classList.add('visible');
}

function renderTabla() {
  const tbody = $('#tabla-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  productos.forEach(p => {
    const esCritico = p.cantidad < umbral;
    const tr = document.createElement('tr');
    if (esCritico) tr.classList.add('critico');

    tr.innerHTML = `
      <td><img src="${p.imagen || 'https://via.placeholder.com/48'}" alt="${p.nombre}"></td>
      <td>${p.nombre}</td>
      <td>${p.cantidad}</td>
      <td>${p.fechaRecepcion || '-'}</td>
      <td>${p.proveedor || '-'}</td>
      <td>${formatPrice(p.precio)}</td>
      <td><span class="badge ${esCritico ? 'badge-critico' : 'badge-ok'}">${esCritico ? 'CRÍTICO' : 'OK'}</span></td>
      <td class="actions">
        <button class="btn btn-primary btn-sm btn-editar" data-id="${p.id}">Editar</button>
        <button class="btn btn-danger btn-sm btn-eliminar" data-id="${p.id}">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderProductosSelect() {
  // For comprar.html checkboxes
  const container = $('#productos-checkboxes');
  if (!container) return;

  container.innerHTML = productos
    .map(p => `
      <label>
        <input type="checkbox" name="productos" value="${p.id}" data-precio="${p.precio}" data-nombre="${p.nombre}">
        ${p.nombre} - ${formatPrice(p.precio)}
      </label>
    `)
    .join('');
}

function renderTablaPublica() {
  // listado_tabla.html - read only
  const tbody = $('#tabla-publica-body');
  if (!tbody) return;

  tbody.innerHTML = productos
    .map(p => {
      const esCritico = p.cantidad < umbral;
      return `
        <tr class="${esCritico ? 'critico' : ''}">
          <td><img src="${p.imagen || 'https://via.placeholder.com/48'}" alt="${p.nombre}"></td>
          <td><a href="producto.html?id=${p.id}">${p.nombre}</a></td>
          <td>${p.descripcion ? p.descripcion.substring(0, 60) + '...' : '-'}</td>
          <td>${p.cantidad}</td>
          <td>${formatPrice(p.precio)}</td>
          <td><span class="badge ${esCritico ? 'badge-critico' : 'badge-ok'}">${esCritico ? 'CRÍTICO' : 'OK'}</span></td>
        </tr>
      `;
    })
    .join('');
}

function renderCards() {
  const grid = $('#products-grid');
  if (!grid) return;

  grid.innerHTML = productos
    .map(p => `
      <article class="product-card">
        <img src="${p.imagen || 'https://via.placeholder.com/260x160'}" alt="${p.nombre}">
        <div class="body">
          <h3>${p.nombre}</h3>
          <p class="desc">${p.descripcion || ''}</p>
          <p class="price">${formatPrice(p.precio)}</p>
          <p class="stock-info">Stock: ${p.cantidad} u.</p>
          <a href="producto.html?id=${p.id}" class="btn btn-primary btn-sm">Ver detalle</a>
        </div>
      </article>
    `)
    .join('');
}

function renderProductoDetalle() {
  const container = $('#producto-detalle');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get('id'));
  const p = productos.find(x => x.id === id);

  if (!p) {
    container.innerHTML = '<p>Producto no encontrado. <a href="listado_tabla.html">Volver al listado</a></p>';
    return;
  }

  const esCritico = p.cantidad < umbral;

  container.innerHTML = `
    <div class="product-detail">
      <img src="${p.imagen || 'https://via.placeholder.com/400'}" alt="${p.nombre}">
      <div class="info">
        <h1>${p.nombre}</h1>
        <p>${p.descripcion || ''}</p>
        <p class="price">${formatPrice(p.precio)}</p>
        <div class="meta">
          <div><span>Stock disponible:</span> <strong>${p.cantidad}</strong>
            <span class="badge ${esCritico ? 'badge-critico' : 'badge-ok'}" style="margin-left:8px">${esCritico ? 'CRÍTICO' : 'OK'}</span>
          </div>
          <div><span>Proveedor:</span> ${p.proveedor || '-'}</div>
          <div><span>Fecha de recepción:</span> ${p.fechaRecepcion || '-'}</div>
        </div>
        <a href="comprar.html" class="btn btn-success">Comprar</a>
        <a href="listado_tabla.html" class="btn btn-secondary" style="margin-left:0.5rem">Volver</a>
      </div>
    </div>
  `;
}

/* ---------- CRUD ---------- */
function siguienteId() {
  return productos.length ? Math.max(...productos.map(p => p.id)) + 1 : 1;
}

function agregarOEditarProducto(e) {
  e.preventDefault();

  const nombre = $('#input-nombre').value.trim();
  const cantidad = Number($('#input-cantidad').value);
  const precio = Number($('#input-precio').value);
  const proveedor = $('#input-proveedor').value.trim();
  const fecha = $('#input-fecha').value || new Date().toISOString().slice(0, 10);
  const imgInput = $('#input-imagen');
  let imagen = 'https://via.placeholder.com/80x80?text=Prod';

  if (!nombre || isNaN(cantidad) || isNaN(precio)) {
    alert('Completá nombre, cantidad y precio.');
    return;
  }

  // If file selected, use object URL (session only)
  if (imgInput && imgInput.files && imgInput.files[0]) {
    imagen = URL.createObjectURL(imgInput.files[0]);
  } else if (editandoId !== null) {
    const existing = productos.find(p => p.id === editandoId);
    if (existing) imagen = existing.imagen;
  }

  if (editandoId !== null) {
    const idx = productos.findIndex(p => p.id === editandoId);
    if (idx !== -1) {
      productos[idx] = {
        ...productos[idx],
        nombre,
        cantidad,
        precio,
        proveedor,
        fechaRecepcion: fecha,
        imagen
      };
    }
    editandoId = null;
    $('#btn-guardar').textContent = 'Guardar';
    $('#btn-cancelar').classList.add('hidden');
  } else {
    productos.push({
      id: siguienteId(),
      nombre,
      descripcion: nombre,
      cantidad,
      precio,
      proveedor,
      fechaRecepcion: fecha,
      imagen
    });
  }

  guardarLocal();
  limpiarFormulario();
  actualizarVista();
}

function eliminarProducto(id) {
  if (!confirm('¿Eliminar este producto?')) return;
  productos = productos.filter(p => p.id !== id);
  guardarLocal();
  actualizarVista();
}

function iniciarEdicion(id) {
  const p = productos.find(x => x.id === id);
  if (!p) return;

  editandoId = id;
  $('#input-nombre').value = p.nombre;
  $('#input-cantidad').value = p.cantidad;
  $('#input-precio').value = p.precio;
  $('#input-proveedor').value = p.proveedor || '';
  $('#input-fecha').value = p.fechaRecepcion || '';
  $('#btn-guardar').textContent = 'Actualizar';
  $('#btn-cancelar').classList.remove('hidden');
}

function limpiarFormulario() {
  const form = $('#form-agregar');
  if (form) form.reset();
  const preview = $('#img-preview');
  if (preview) {
    preview.src = '';
    preview.classList.remove('visible');
  }
  editandoId = null;
  const btn = $('#btn-guardar');
  if (btn) btn.textContent = 'Guardar';
  const cancel = $('#btn-cancelar');
  if (cancel) cancel.classList.add('hidden');
}

function actualizarVista() {
  renderAlertas();
  renderTabla();
  renderTablaPublica();
  renderCards();
  renderProductosSelect();
  renderProductoDetalle();
}

/* ---------- Event listeners (all via addEventListener) ---------- */
function registrarEventos() {
  // Form submit (stock page)
  const form = $('#form-agregar');
  if (form) {
    form.addEventListener('submit', agregarOEditarProducto);
  }

  // Cancel edit
  const btnCancel = $('#btn-cancelar');
  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      limpiarFormulario();
    });
  }

  // Threshold change
  const umbralInput = $('#umbral');
  if (umbralInput) {
    umbralInput.addEventListener('change', () => {
      umbral = Number(umbralInput.value) || DEFAULT_THRESHOLD;
      localStorage.setItem(THRESHOLD_KEY, umbral);
      actualizarVista();
    });
    umbralInput.addEventListener('input', () => {
      umbral = Number(umbralInput.value) || DEFAULT_THRESHOLD;
      localStorage.setItem(THRESHOLD_KEY, umbral);
      actualizarVista();
    });
  }

  // Image preview
  const imgInput = $('#input-imagen');
  if (imgInput) {
    imgInput.addEventListener('change', () => {
      const preview = $('#img-preview');
      if (imgInput.files && imgInput.files[0] && preview) {
        preview.src = URL.createObjectURL(imgInput.files[0]);
        preview.classList.add('visible');
      }
    });
  }

  // Delegate edit / delete on table
  const tbody = $('#tabla-body');
  if (tbody) {
    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const id = Number(btn.dataset.id);
      if (btn.classList.contains('btn-editar')) {
        iniciarEdicion(id);
      } else if (btn.classList.contains('btn-eliminar')) {
        eliminarProducto(id);
      }
    });
  }

  // Purchase form
  const formCompra = $('#form-compra');
  if (formCompra) {
    formCompra.addEventListener('submit', (e) => {
      e.preventDefault();
      const nombre = $('#cliente-nombre').value.trim();
      const direccion = $('#cliente-direccion').value.trim();
      const telefono = $('#cliente-telefono').value.trim();
      const email = $('#cliente-email').value.trim();
      const pago = $('#medio-pago').value;
      const checks = $$('input[name="productos"]:checked');

      if (!nombre || !direccion || !telefono || !email || !pago || checks.length === 0) {
        alert('Por favor complete todos los campos y seleccione al menos un producto.');
        return;
      }

      const items = Array.from(checks).map(c => ({
        id: c.value,
        nombre: c.dataset.nombre,
        precio: c.dataset.precio
      }));

      // Simulate order (could reduce stock here)
      items.forEach(item => {
        const p = productos.find(x => x.id === Number(item.id));
        if (p && p.cantidad > 0) {
          p.cantidad -= 1;
        }
      });
      guardarLocal();

      alert(`¡Pedido confirmado!\nCliente: ${nombre}\nProductos: ${items.map(i => i.nombre).join(', ')}\nTotal estimado: ${formatPrice(items.reduce((s, i) => s + Number(i.precio), 0))}`);
      formCompra.reset();
      // If we are on a page that shows stock, refresh
      actualizarVista();
    });
  }
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  cargarUmbral();
  await cargarStock();
  registrarEventos();
  actualizarVista();
});
