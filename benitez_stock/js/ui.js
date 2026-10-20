/* ==========================================================
   ui.js — utilidades de DOM reutilizables.
   Única responsabilidad: seleccionar elementos y mostrar mensajes.
   Se usa querySelector / querySelectorAll en todo el proyecto.
   ========================================================== */

export const $ = (selector, raiz = document) => raiz.querySelector(selector);
export const $$ = (selector, raiz = document) => [...raiz.querySelectorAll(selector)];

/* Mensaje de resultado dentro de un contenedor (formularios). */
export function mostrarResultado(elemento, mensaje, esError = false) {
    if (!elemento) return;
    elemento.className = `result-message ${esError ? "result-error" : "result-success"}`;
    elemento.textContent = mensaje;
}

/* Aviso flotante: reemplaza a alert(), que bloquea la página. */
export function avisar(mensaje, esError = false) {
    const aviso = document.createElement("div");
    aviso.className = `toast ${esError ? "toast-error" : "toast-ok"}`;
    aviso.setAttribute("role", "status");
    aviso.textContent = mensaje;
    document.body.append(aviso);
    setTimeout(() => aviso.remove(), 2800);
}

export function mostrarErrorGlobal(mensaje) {
    const main = $("main");
    if (!main) return;

    const aviso = document.createElement("div");
    aviso.className = "alert alert-critical";
    aviso.textContent = mensaje;
    main.prepend(aviso);
}
