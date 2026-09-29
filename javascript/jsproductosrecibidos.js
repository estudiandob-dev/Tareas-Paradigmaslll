/* Carga los productos guardados en localStorage cuando se carga la página */
function loadProducts() {
    const storedProducts = JSON.parse(localStorage.getItem('receivedProducts')) || [];
    const table = document.getElementById('productTable').getElementsByTagName('tbody')[0];

    /* Añade cada producto guardado en una nueva fila en la tabla */
    storedProducts.forEach((product, index) => {
        const newRow = table.insertRow();
        newRow.innerHTML = `
            <td>
                <div class="image-upload">
                    <img src="${product.image}" class="preview">
                </div>
            </td>
            <td contenteditable="true">${product.productName}</td>
            <td contenteditable="true">${product.quantity}</td>
            <td contenteditable="true">${product.receiptDate}</td>
            <td contenteditable="true">${product.supplier}</td>
            <td contenteditable="true">$${parseFloat(product.purchasePrice).toFixed(2)}</td>
            <td>
                <button class="edit-button" onclick="editProduct(this, ${index})">Editar</button>
                <button class="delete-button" onclick="deleteProduct(${index})">Eliminar</button>
            </td>
        `;
    });

    // Muestra la tabla solo si hay productos
    const tableContainer = document.getElementById('productTableContainer');
    tableContainer.style.display = storedProducts.length > 0 ? 'block' : 'none';
}

/* Muestra la vista previa de la imagen seleccionada para un producto */
function previewImage(event, previewId) {
    const input = event.target;
    const reader = new FileReader();

    reader.onload = function(){
        const output = document.getElementById(previewId);
        output.src = reader.result;
        output.style.display = 'block';
    };

    if (input.files && input.files[0]) {
        reader.readAsDataURL(input.files[0]);
    } else {
        const output = document.getElementById(previewId);
        output.src = "";
        output.style.display = 'none';
    }
}

/* Guarda un nuevo producto en localStorage y lo añade a la tabla */
function saveProduct() {
    const productName = document.getElementById('productName').value;
    const quantity = document.getElementById('quantity').value;
    const receiptDate = document.getElementById('receiptDate').value;
    const supplier = document.getElementById('supplier').value;
    const purchasePrice = document.getElementById('purchasePrice').value;
    const image = document.getElementById('preview').src;

    /* Valida que todos los campos estén completos antes de guardar */
    if (!productName || !quantity || !receiptDate || !supplier || !purchasePrice || image === "") {
        document.getElementById('errorMessage').style.display = 'block';
        return false;
    }

    const storedProducts = JSON.parse(localStorage.getItem('receivedProducts')) || [];
    storedProducts.push({
        productName,
        quantity,
        receiptDate,
        supplier,
        purchasePrice,
        image
    });

    localStorage.setItem('receivedProducts', JSON.stringify(storedProducts));

    /* Añade el nuevo producto como una fila en la tabla */
    const table = document.getElementById('productTable').getElementsByTagName('tbody')[0];
    const newRow = table.insertRow();

    newRow.innerHTML = `
        <td>
            <div class="image-upload">
                <img src="${image}" class="preview">
            </div>
        </td>
        <td contenteditable="true">${productName}</td>
        <td contenteditable="true">${quantity}</td>
        <td contenteditable="true">${receiptDate}</td>
        <td contenteditable="true">${supplier}</td>
        <td contenteditable="true">$${parseFloat(purchasePrice).toFixed(2)}</td>
        <td>
            <button class="edit-button" onclick="editProduct(this)">Editar</button>
            <button class="delete-button" onclick="deleteProduct(${storedProducts.length - 1})">Eliminar</button>
        </td>
    `;

    /* Limpia los campos del formulario después de guardar */
    resetForm();

    document.getElementById('errorMessage').style.display = 'none';

    return false;
}

/* Permite editar un producto existente */
function editProduct(button, index) {
    const row = button.parentElement.parentElement;
    const cells = row.getElementsByTagName('td');

    /* Habilita la edición de la imagen del producto */
    const imageUploadDiv = cells[0].querySelector('.image-upload');
    const currentImage = imageUploadDiv.querySelector('img').src;
    imageUploadDiv.innerHTML = `
        <input type="file" accept="image/*" onchange="previewImage(event, 'preview_${index}')">
        <img id="preview_${index}" class="preview" src="${currentImage}" style="display: block;">
    `;

    /* Habilita la edición de los demás campos */
    for (let i = 1; i < cells.length - 1; i++) {
        cells[i].setAttribute('contenteditable', 'true');
    }

    button.textContent = "Guardar";
    button.onclick = function() {
        saveEdits(index);
    };
}

/* Guarda los cambios realizados en un producto existente */
function saveEdits(index) {
    const storedProducts = JSON.parse(localStorage.getItem('receivedProducts')) || [];
    const product = storedProducts[index];

    product.productName = document.querySelector(`#productTable tbody tr:nth-child(${index + 1}) td:nth-child(2)`).innerText;
    product.quantity = document.querySelector(`#productTable tbody tr:nth-child(${index + 1}) td:nth-child(3)`).innerText;
    product.receiptDate = document.querySelector(`#productTable tbody tr:nth-child(${index + 1}) td:nth-child(4)`).innerText;
    product.supplier = document.querySelector(`#productTable tbody tr:nth-child(${index + 1}) td:nth-child(5)`).innerText;
    product.purchasePrice = document.querySelector(`#productTable tbody tr:nth-child(${index + 1}) td:nth-child(6)`).innerText.replace('$', '');

    /* Actualiza la imagen si hay una nueva */
    const imageUploadDiv = document.querySelector(`#productTable tbody tr:nth-child(${index + 1}) .image-upload`);
    const inputFile = imageUploadDiv.querySelector('input[type="file"]');
    if (inputFile.files.length > 0) {
        const reader = new FileReader();
        reader.onload = function() {
            product.image = reader.result;
            updateProductTable();
        };
        reader.readAsDataURL(inputFile.files[0]);
    } else {
        updateProductTable();
    }

    /* Actualiza el localStorage */
    localStorage.setItem('receivedProducts', JSON.stringify(storedProducts));
}

/* Actualiza la tabla con los productos editados */
function updateProductTable() {
    const storedProducts = JSON.parse(localStorage.getItem('receivedProducts')) || [];
    const table = document.getElementById('productTable').getElementsByTagName('tbody')[0];
    table.innerHTML = '';

    /* Vuelve a añadir todos los productos en la tabla */
    storedProducts.forEach((product, index) => {
        const newRow = table.insertRow();
        newRow.innerHTML = `
            <td>
                <div class="image-upload">
                    <img src="${product.image}" class="preview">
                </div>
            </td>
            <td contenteditable="true">${product.productName}</td>
            <td contenteditable="true">${product.quantity}</td>
            <td contenteditable="true">${product.receiptDate}</td>
            <td contenteditable="true">${product.supplier}</td>
            <td contenteditable="true">$${parseFloat(product.purchasePrice).toFixed(2)}</td>
            <td>
                <button class="edit-button" onclick="editProduct(this, ${index})">Editar</button>
                <button class="delete-button" onclick="deleteProduct(${index})">Eliminar</button>
            </td>
        `;
    });

    // Muestra la tabla solo si hay productos
    const tableContainer = document.getElementById('productTableContainer');
    tableContainer.style.display = storedProducts.length > 0 ? 'block' : 'none';
}

/* Elimina un producto de la lista y del localStorage */
function deleteProduct(index) {
    const storedProducts = JSON.parse(localStorage.getItem('receivedProducts')) || [];
    storedProducts.splice(index, 1);
    localStorage.setItem('receivedProducts', JSON.stringify(storedProducts));
    
    // Actualiza la tabla después de eliminar el producto
    updateProductTable();

    // Restablece el formulario y la tabla si la tabla está vacía
    if (storedProducts.length === 0) {
        resetForm();
    }
}

/* Restablece el formulario */
function resetForm() {
    document.getElementById('productName').value = '';
    document.getElementById('quantity').value = '';
    document.getElementById('receiptDate').value = '';
    document.getElementById('supplier').value = '';
    document.getElementById('purchasePrice').value = '';
    document.getElementById('preview').src = '';
}

/* Se ejecuta al cargar la página */
window.onload = function() {
    loadProducts();
};
