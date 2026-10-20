/* ==========================================================
   api.js — CAPA DE DATOS (comunicación asíncrona).
   Única responsabilidad: hablar con el servidor / los .json.
   No conoce el DOM ni el estado de la aplicación.
   Todas las funciones usan async/await y propagan los errores
   con throw para que los maneje quien las llama (try/catch).
   ========================================================== */

/* Error propio: el servidor respondió algo que no es JSON
   (por ejemplo, PHP sin ejecutar o una página de error HTML). */
export class RespuestaInvalidaError extends Error {
    constructor(status, cuerpo) {
        super(`Respuesta no válida del servidor (HTTP ${status})`);
        this.name = "RespuestaInvalidaError";
        this.status = status;
        this.cuerpo = cuerpo;
    }
}

/* GET de un archivo .json local. fetch() solo rechaza la promesa ante
   errores de red; un 404 o 500 NO la rechaza, por eso se revisa respuesta.ok. */
async function leerJSON(url) {
    const respuesta = await fetch(url, { cache: "no-store" });

    if (!respuesta.ok) {
        throw new Error(`HTTP ${respuesta.status} al leer ${url}`);
    }

    return await respuesta.json();
}

export function obtenerInventario() {
    return leerJSON("data/inventario.json");
}

/* Vista técnica (VSDM avanzada): se descarga una sola vez y se reutiliza.
   Se guarda la PROMESA (no el resultado) para que dos clics rápidos
   no disparen dos fetch en paralelo. Si falla, se descarta para reintentar. */
let promesaDetalles = null;

export function obtenerDetalles() {
    if (!promesaDetalles) {
        promesaDetalles = leerJSON("data/detalles.json").catch(error => {
            promesaDetalles = null;
            throw error;
        });
    }
    return promesaDetalles;
}

/* POST con JSON. Devuelve { exito, datos }.
   Lanza RespuestaInvalidaError si el cuerpo no es JSON, y el error
   original de fetch si no hay conexión. */
export async function enviarJSON(url, cuerpo) {
    const respuesta = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo)
    });

    const texto = await respuesta.text();
    let datos;

    try {
        datos = JSON.parse(texto);
    } catch {
        throw new RespuestaInvalidaError(respuesta.status, texto);
    }

    return { exito: respuesta.ok && Boolean(datos.ok), datos };
}

export const reponerStock = (id, cantidad) => enviarJSON("api/reponer.php", { id, cantidad });
export const registrarCompra = items => enviarJSON("api/comprar.php", { items });
