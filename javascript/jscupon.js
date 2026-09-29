
function validarCupon() {

    // Capturar el texto ingresado
    let cupon = document.getElementById("cupon").value;

    // Limpiar espacios y convertir a mayúsculas
    cupon = cupon.trim().toUpperCase();

    // Obtener el lugar donde se mostrará el mensaje
    let mensaje = document.getElementById("mensajeCupon");

    // Limpiar clases anteriores
    mensaje.classList.remove("mensaje-error");
    mensaje.classList.remove("mensaje-exito");

    // Evaluar el código
    if (cupon === "") {

        mensaje.textContent = "Por favor, ingrese un código";
        mensaje.classList.add("mensaje-error");

    } else if (cupon === "UCP10") {

        mensaje.textContent = "¡Cupón aplicado! Tenés un 10% de descuento";
        mensaje.classList.add("mensaje-exito");

    } else {

        mensaje.textContent = "Código inválido o vencido";
        mensaje.classList.add("mensaje-error");
    }
}
