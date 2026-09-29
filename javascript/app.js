/**
 * app.js — Opción 12: Monitor de Inventario y Alerta de Estado Crítico
 * Requisitos:
 *  - Desacoplamiento: eventos con addEventListener (sin onclick/onsubmit en HTML)
 *  - Asincronía: carga de datos con fetch() + async/await desde stock.json
 *  - Alertas visuales en el DOM cuando la cantidad < umbral crítico
 *  - CRUD: agregar, editar y eliminar productos (con imágenes)
 */

const STORAGE_KEY = 'stockProducts_v2';
const JSON_URL = './data/stock.json';
const DEFAULT_THRESHOLD = 10;

/** Estado en memoria del inventario */
let products = [];
let nextId = 1;
let previewDataUrl = '';

/* ---------- Utilidades ---------- */

function getThreshold() {
    const el = document.getElementById('criticalThreshold');
    const val = parseInt(el?.value, 10);
    return Number.isFinite(val) && val >= 0 ? val : DEFAULT_THRESHOLD;
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function loadFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : null;
    } catch {
        return null;
    }
}

/**
 * Carga el stock: primero intenta localStorage (cambios del usuario),
 * si no hay, hace fetch al JSON local (simula respuesta del servidor).
 */
async function loadStock() {
    const loadingMsg = document.getElementById('loadingMsg');
    const tableWrapper = document.getElementById('tableWrapper');
    const emptyMsg = document.getElementById('emptyMsg');

    try {
        const stored = loadFromStorage();
        if (stored && stored.length >= 0) {
            products = stored;
        } else {
            const response = await fetch(JSON_URL);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            products = await response.json();
            saveToStorage();
        }

        nextId = products.reduce((max, p) => Math.max(max, p.id || 0), 0) + 1;
        renderTable();
        checkCriticalStock();
    } catch (err) {
        console.error('Error al cargar stock:', err);
        if (loadingMsg) {
            loadingMsg.textContent = 'No se pudo cargar el stock. Verifique que exista data/stock.json.';
            loadingMsg.classList.add('error-load');
        }
    } finally {
        if (loadingMsg) loadingMsg.hidden = true;
        if (tableWrapper) tableWrapper.hidden = products.length === 0;
        if (emptyMsg) emptyMsg.hidden = products.length > 0;
    }
}

/* ---------- Renderizado ---------- */

function renderTable() {
    const tbody = document.getElementById('productTableBody');
    const tableWrapper = document.getElementById('tableWrapper');
    const emptyMsg = document.getElementById('emptyMsg');
    if (!tbody) return;

    tbody.innerHTML = '';
    const threshold = getThreshold();

    products.forEach((product) => {
        const qty = Number(product.quantity);
        const isCritical = qty < threshold;
        const row = document.createElement('tr');
        row.dataset.id = product.id;
        if (isCritical) row.classList.add('critical-row');

        const imgSrc = product.image || './imgstock/stockimage.jpeg';
        const price = parseFloat(product.purchasePrice);

        row.innerHTML = `
            <td>
                <div class="image-upload">
                    <img src="${imgSrc}" class="preview" alt="${escapeHtml(product.productName)}">
                </div>
            </td>
            <td class="cell-name">${escapeHtml(product.productName)}</td>
            <td class="cell-qty">${qty}</td>
            <td class="cell-date">${escapeHtml(product.receiptDate)}</td>
            <td class="cell-supplier">${escapeHtml(product.supplier)}</td>
            <td class="cell-price">$${price.toFixed(2)}</td>
            <td class="cell-status">
                ${isCritical
                    ? '<span class="badge badge-critical">CRÍTICO</span>'
                    : '<span class="badge badge-ok">OK</span>'}
            </td>
            <td class="cell-actions">
                <button type="button" class="edit-button" data-action="edit">Editar</button>
                <button type="button" class="delete-button" data-action="delete">Eliminar</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    if (tableWrapper) tableWrapper.hidden = products.length === 0;
    if (emptyMsg) emptyMsg.hidden = products.length > 0;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
}

/**
 * Alerta visual en el DOM cuando hay productos bajo el umbral crítico.
 */
function checkCriticalStock() {
    const banner = document.getElementById('alertBanner');
    if (!banner) return;

    const threshold = getThreshold();
    const critical = products.filter((p) => Number(p.quantity) < threshold);

    if (critical.length === 0) {
        banner.hidden = true;
        banner.innerHTML = '';
        return;
    }

    const list = critical
        .map((p) => `<li><strong>${escapeHtml(p.productName)}</strong>: ${p.quantity} u. (umbral: ${threshold})</li>`)
        .join('');

    banner.innerHTML = `
        <strong>⚠ Alerta de stock crítico</strong>
        <p>Los siguientes productos están por debajo del umbral (${threshold}):</p>
        <ul>${list}</ul>
    `;
    banner.hidden = false;
}

/* ---------- CRUD ---------- */

function addProduct(data) {
    const product = {
        id: nextId++,
        productName: data.productName,
        quantity: Number(data.quantity),
        receiptDate: data.receiptDate,
        supplier: data.supplier,
        purchasePrice: Number(data.purchasePrice),
        image: data.image || './imgstock/stockimage.jpeg'
    };
    products.push(product);
    saveToStorage();
    renderTable();
    checkCriticalStock();
}

function updateProduct(id, data) {
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return;
    products[idx] = { ...products[idx], ...data };
    saveToStorage();
    renderTable();
    checkCriticalStock();
}

function deleteProduct(id) {
    products = products.filter((p) => p.id !== id);
    saveToStorage();
    renderTable();
    checkCriticalStock();
}

/* ---------- Edición inline ---------- */

function startEdit(row) {
    const id = Number(row.dataset.id);
    const product = products.find((p) => p.id === id);
    if (!product) return;

    // Evitar múltiples ediciones simultáneas
    document.querySelectorAll('tr.editing').forEach((r) => cancelEdit(r));

    row.classList.add('editing');
    const imgSrc = product.image || '';

    row.innerHTML = `
        <td>
            <div class="image-upload">
                <input type="file" class="edit-image" accept="image/*">
                <img src="${imgSrc}" class="preview edit-preview" alt="Vista previa">
            </div>
        </td>
        <td><input type="text" class="edit-name" value="${escapeHtml(product.productName)}"></td>
        <td><input type="number" class="edit-qty" value="${product.quantity}" min="0"></td>
        <td><input type="date" class="edit-date" value="${product.receiptDate}"></td>
        <td><input type="text" class="edit-supplier" value="${escapeHtml(product.supplier)}"></td>
        <td>
            <div class="price-container">
                <span>$</span>
                <input type="number" class="edit-price" value="${product.purchasePrice}" min="0" step="0.01">
            </div>
        </td>
        <td class="cell-status">—</td>
        <td class="cell-actions">
            <button type="button" class="save-button" data-action="save">Guardar</button>
            <button type="button" class="cancel-button" data-action="cancel">Cancelar</button>
        </td>
    `;

    const fileInput = row.querySelector('.edit-image');
    const preview = row.querySelector('.edit-preview');
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            preview.src = reader.result;
            preview.dataset.newImage = reader.result;
        };
        reader.readAsDataURL(file);
    });
}

function saveEdit(row) {
    const id = Number(row.dataset.id);
    const name = row.querySelector('.edit-name')?.value?.trim();
    const qty = row.querySelector('.edit-qty')?.value;
    const date = row.querySelector('.edit-date')?.value;
    const supplier = row.querySelector('.edit-supplier')?.value?.trim();
    const price = row.querySelector('.edit-price')?.value;
    const preview = row.querySelector('.edit-preview');

    if (!name || qty === '' || !date || !supplier || price === '') {
        alert('Complete todos los campos para guardar.');
        return;
    }

    const data = {
        productName: name,
        quantity: Number(qty),
        receiptDate: date,
        supplier,
        purchasePrice: Number(price)
    };
    if (preview?.dataset?.newImage) {
        data.image = preview.dataset.newImage;
    }

    updateProduct(id, data);
}

function cancelEdit() {
    renderTable();
    checkCriticalStock();
}

/* ---------- Formulario de alta ---------- */

function resetForm() {
    const form = document.getElementById('productForm');
    form?.reset();
    previewDataUrl = '';
    const preview = document.getElementById('preview');
    if (preview) {
        preview.src = '';
        preview.hidden = true;
    }
    const err = document.getElementById('errorMessage');
    if (err) err.hidden = true;
}

function handleFormSubmit(e) {
    e.preventDefault();
    const errorMsg = document.getElementById('errorMessage');

    const productName = document.getElementById('productName')?.value?.trim();
    const quantity = document.getElementById('quantity')?.value;
    const receiptDate = document.getElementById('receiptDate')?.value;
    const supplier = document.getElementById('supplier')?.value?.trim();
    const purchasePrice = document.getElementById('purchasePrice')?.value;

    if (!productName || quantity === '' || !receiptDate || !supplier || purchasePrice === '') {
        if (errorMsg) errorMsg.hidden = false;
        return;
    }

    if (errorMsg) errorMsg.hidden = true;

    addProduct({
        productName,
        quantity,
        receiptDate,
        supplier,
        purchasePrice,
        image: previewDataUrl || './imgstock/stockimage.jpeg'
    });

    resetForm();
}

function handleImagePreview(e) {
    const file = e.target.files?.[0];
    const preview = document.getElementById('preview');
    if (!file || !preview) {
        previewDataUrl = '';
        if (preview) {
            preview.src = '';
            preview.hidden = true;
        }
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        previewDataUrl = reader.result;
        preview.src = reader.result;
        preview.hidden = false;
    };
    reader.readAsDataURL(file);
}

/* ---------- Delegación de eventos en la tabla ---------- */

function handleTableClick(e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const row = btn.closest('tr');
    if (!row) return;

    const action = btn.dataset.action;
    const id = Number(row.dataset.id);

    switch (action) {
        case 'edit':
            startEdit(row);
            break;
        case 'delete':
            if (confirm('¿Eliminar este producto del inventario?')) {
                deleteProduct(id);
            }
            break;
        case 'save':
            saveEdit(row);
            break;
        case 'cancel':
            cancelEdit();
            break;
    }
}

/* ---------- Inicialización (todo con addEventListener) ---------- */

document.addEventListener('DOMContentLoaded', () => {
    // Carga asíncrona del JSON
    loadStock();

    // Formulario de alta
    const form = document.getElementById('productForm');
    form?.addEventListener('submit', handleFormSubmit);

    // Vista previa de imagen al agregar
    const imageInput = document.getElementById('imageInput');
    imageInput?.addEventListener('change', handleImagePreview);

    // Acciones de la tabla (editar / eliminar / guardar / cancelar)
    const tbody = document.getElementById('productTableBody');
    tbody?.addEventListener('click', handleTableClick);

    // Recalcular alertas al cambiar el umbral
    const thresholdInput = document.getElementById('criticalThreshold');
    thresholdInput?.addEventListener('change', () => {
        renderTable();
        checkCriticalStock();
    });
    thresholdInput?.addEventListener('input', () => {
        renderTable();
        checkCriticalStock();
    });
});
