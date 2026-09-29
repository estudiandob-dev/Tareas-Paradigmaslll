/* Carga los productos entregados en localStorage cuando se carga la página */
function loadDeliveredProducts() {
    const storedProducts = JSON.parse(localStorage.getItem('deliveredProducts')) || [];
    const table = document.getElementById('deliveredProductTable').getElementsByTagName('tbody')[0];

    /* Añade cada producto entregado en una nueva fila en la tabla */
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
            <td contenteditable="true">${product.deliveryDate}</td>
            <td contenteditable="true">${product.receiver}</td>
            <td contenteditable="true">$${parseFloat(product.deliveryPrice).toFixed(2)}</td>
            <td>
                <button class="edit-button" onclick="editDeliveredProduct(this, ${index})">Editar</button>
                <button class="delete-button" onclick="deleteDeliveredProduct(${index})">Eliminar</button>
            </td>
        `;
    });

    // Muestra la tabla solo si hay productos entregados
    const tableContainer = document.getElementById('deliveredProductTableContainer');
    tableContainer.style.display = storedProducts.length > 0 ? 'block' : 'none';
}

/* Muestra la vista previa de la imagen seleccionada para un producto entregado */
function previewDeliveredImage(event, previewId) {
    const input = event.target;
    const reader = new FileReader();

    reader.onload = function() {
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

/* Guarda un nuevo producto entregado en localStorage y lo añade a la tabla */
function saveDeliveredProduct() {
    const productName = document.getElementById('deliveredProductName').value;
    const quantity = document.getElementById('deliveredQuantity').value;
    const deliveryDate = document.getElementById('deliveredDate').value;
    const receiver = document.getElementById('receiver').value;
    const deliveryPrice = document.getElementById('deliveryPrice').value;
    const image = document.getElementById('deliveredPreview').src;

    /* Valida que todos los campos estén completos antes de guardar */
    if (!productName || !quantity || !deliveryDate || !receiver || !deliveryPrice || image === "") {
        document.getElementById('errorMessage').style.display = 'block';
        return false;
    }

    const storedProducts = JSON.parse(localStorage.getItem('deliveredProducts')) || [];
    storedProducts.push({
        productName,
        quantity,
        deliveryDate,
        receiver,
        deliveryPrice,
        image
    });

    localStorage.setItem('deliveredProducts', JSON.stringify(storedProducts));

    /* Añade el nuevo producto entregado como una fila en la tabla */
    const table = document.getElementById('deliveredProductTable').getElementsByTagName('tbody')[0];
    const newRow = table.insertRow();

    newRow.innerHTML = `
        <td>
            <div class="image-upload">
                <img src="${image}" class="preview">
            </div>
        </td>
        <td contenteditable="true">${productName}</td>
        <td contenteditable="true">${quantity}</td>
        <td contenteditable="true">${deliveryDate}</td>
        <td contenteditable="true">${receiver}</td>
        <td contenteditable="true">$${parseFloat(deliveryPrice).toFixed(2)}</td>
        <td>
            <button class="edit-button" onclick="editDeliveredProduct(this)">Editar</button>
            <button class="delete-button" onclick="deleteDeliveredProduct(${storedProducts.length - 1})">Eliminar</button>
        </td>
    `;

    /* Limpia los campos del formulario después de guardar */
    resetDeliveredForm();

    document.getElementById('errorMessage').style.display = 'none';

    return false;
}

/* Permite editar un producto entregado existente */
function editDeliveredProduct(button, index) {
    const row = button.parentElement.parentElement;
    const cells = row.getElementsByTagName('td');

    /* Habilita la edición de la imagen del producto entregado */
    const imageUploadDiv = cells[0].querySelector('.image-upload');
    const currentImage = imageUploadDiv.querySelector('img').src;
    imageUploadDiv.innerHTML = `
        <input type="file" accept="image/*" onchange="previewDeliveredImage(event, 'deliveredPreview_${index}')">
        <img id="deliveredPreview_${index}" class="preview" src="${currentImage}" style="display: block;">
    `;

    /* Habilita la edición de los demás campos */
    for (let i = 1; i < cells.length - 1; i++) {
        cells[i].setAttribute('contenteditable', 'true');
    }

    button.textContent = "Guardar";
    button.onclick = function() {
        saveDeliveredEdits(index);
    };
}

/* Guarda los cambios realizados en un producto entregado existente */
function saveDeliveredEdits(index) {
    const storedProducts = JSON.parse(localStorage.getItem('deliveredProducts')) || [];
    const product = storedProducts[index];

    product.productName = document.querySelector(`#deliveredProductTable tbody tr:nth-child(${index + 1}) td:nth-child(2)`).innerText;
    product.quantity = document.querySelector(`#deliveredProductTable tbody tr:nth-child(${index + 1}) td:nth-child(3)`).innerText;
    product.deliveryDate = document.querySelector(`#deliveredProductTable tbody tr:nth-child(${index + 1}) td:nth-child(4)`).innerText;
    product.receiver = document.querySelector(`#deliveredProductTable tbody tr:nth-child(${index + 1}) td:nth-child(5)`).innerText;
    product.deliveryPrice = document.querySelector(`#deliveredProductTable tbody tr:nth-child(${index + 1}) td:nth-child(6)`).innerText.replace('$', '');

    /* Actualiza la imagen si hay una nueva */
    const imageUploadDiv = document.querySelector(`#deliveredProductTable tbody tr:nth-child(${index + 1}) .image-upload`);
    const inputFile = imageUploadDiv.querySelector('input[type="file"]');
    if (inputFile.files.length > 0) {
        const reader = new FileReader();
        reader.onload = function() {
            product.image = reader.result;
            updateDeliveredProductTable();
        };
        reader.readAsDataURL(inputFile.files[0]);
    } else {
        updateDeliveredProductTable();
    }

    /* Actualiza el localStorage */
    localStorage.setItem('deliveredProducts', JSON.stringify(storedProducts));
}

/* Actualiza la tabla con los productos entregados editados */
function updateDeliveredProductTable() {
    const storedProducts = JSON.parse(localStorage.getItem('deliveredProducts')) || [];
    const table = document.getElementById('deliveredProductTable').getElementsByTagName('tbody')[0];
    table.innerHTML = '';

    /* Vuelve a añadir todos los productos entregados en la tabla */
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
            <td contenteditable="true">${product.deliveryDate}</td>
            <td contenteditable="true">${product.receiver}</td>
            <td contenteditable="true">$${parseFloat(product.deliveryPrice).toFixed(2)}</td>
            <td>
                <button class="edit-button" onclick="editDeliveredProduct(this, ${index})">Editar</button>
                <button class="delete-button" onclick="deleteDeliveredProduct(${index})">Eliminar</button>
            </td>
        `;
    });

    // Muestra la tabla solo si hay productos entregados
    const tableContainer = document.getElementById('deliveredProductTableContainer');
    tableContainer.style.display = storedProducts.length > 0 ? 'block' : 'none';
}

/* Elimina un producto entregado */
function deleteDeliveredProduct(index) {
    const storedProducts = JSON.parse(localStorage.getItem('deliveredProducts')) || [];
    storedProducts.splice(index, 1);
    localStorage.setItem('deliveredProducts', JSON.stringify(storedProducts));
    updateDeliveredProductTable();
}

/* Reinicia el formulario de productos entregados */
function resetDeliveredForm() {
    document.getElementById('deliveredProductName').value = '';
    document.getElementById('deliveredQuantity').value = '';
    document.getElementById('deliveredDate').value = '';
    document.getElementById('receiver').value = '';
    document.getElementById('deliveryPrice').value = '';
    document.getElementById('deliveredPreview').style.display = 'none';
}
