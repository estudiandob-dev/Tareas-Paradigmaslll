$(document).ready(function () {
    // Ocultamos inicialmente los enlaces de la barra de navegación
    $(".navbar a").hide();

    // Efecto de deslizamiento para mostrar los enlaces de la barra de navegación uno por uno
    $(".navbar a").each(function (index) {
        $(this).delay(200 * index).slideDown(500);
    });
});
