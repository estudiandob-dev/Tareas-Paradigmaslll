"use strict";

/* ---------- Configuración ---------- */
const FICHAS_POR_JUGADOR = 3;

// Líneas ganadoras (índices del tablero 0..8)
const LINEAS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // horizontales
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // verticales
  [0, 4, 8], [2, 4, 6]             // diagonales
];

/* Casilla "más cercana": contiguas en horizontal, vertical y diagonal.
   Si se quiere permitir solo horizontal y vertical, usar DIAGONALES = false. */
const DIAGONALES = true;

/* ---------- Estado ---------- */
let tablero;            // Array(9): null | "X" | "O"
let turno;              // "X" | "O"
let colocadas;          // { X: n, O: n }
let seleccion;          // índice de la ficha elegida para mover, o null
let terminado;
const puntos = { X: 0, O: 0 };

/* ---------- Elementos del DOM ---------- */
const elTablero = document.getElementById("tablero");
const elEstado = document.getElementById("estado");
const celdas = [];

/* ---------- Utilidades ---------- */
const otro = (j) => (j === "X" ? "O" : "X");

function vecinos(i) {
  const f = Math.floor(i / 3);
  const c = i % 3;
  const res = [];
  for (let df = -1; df <= 1; df++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (df === 0 && dc === 0) continue;
      if (!DIAGONALES && df !== 0 && dc !== 0) continue;
      const nf = f + df;
      const nc = c + dc;
      if (nf >= 0 && nf < 3 && nc >= 0 && nc < 3) res.push(nf * 3 + nc);
    }
  }
  return res;
}

const destinosDe = (i) => vecinos(i).filter((v) => tablero[v] === null);

const enFaseColocar = () =>
  colocadas.X < FICHAS_POR_JUGADOR || colocadas.O < FICHAS_POR_JUGADOR;

function lineaGanadora(jugador) {
  return LINEAS.find((l) => l.every((i) => tablero[i] === jugador)) || null;
}

function tieneMovimientos(jugador) {
  return tablero.some((v, i) => v === jugador && destinosDe(i).length > 0);
}

/* ---------- Construcción del tablero ---------- */
function crearTablero() {
  for (let i = 0; i < 9; i++) {
    const b = document.createElement("button");
    b.className = "celda";
    b.type = "button";
    b.setAttribute("role", "gridcell");
    b.dataset.i = i;
    b.addEventListener("click", () => alHacerClic(i));
    elTablero.appendChild(b);
    celdas.push(b);
  }
}

/* ---------- Flujo de juego ---------- */
function nuevaPartida() {
  tablero = Array(9).fill(null);
  colocadas = { X: 0, O: 0 };
  seleccion = null;
  terminado = false;
  // Alterna quién empieza según el marcador total de partidas jugadas
  turno = (puntos.X + puntos.O) % 2 === 0 ? "X" : "O";
  pintar();
}

function alHacerClic(i) {
  if (terminado) return;

  if (enFaseColocar()) {
    colocar(i);
  } else {
    mover(i);
  }
}

function colocar(i) {
  if (tablero[i] !== null) return;
  tablero[i] = turno;
  colocadas[turno]++;
  finDeTurno(i);
}

function mover(i) {
  // 1) Elegir (o cambiar) ficha propia
  if (tablero[i] === turno) {
    seleccion = seleccion === i ? null : i;
    pintar();
    return;
  }
  // 2) Elegir destino
  if (seleccion !== null && tablero[i] === null && destinosDe(seleccion).includes(i)) {
    tablero[i] = turno;
    tablero[seleccion] = null;
    seleccion = null;
    finDeTurno(i);
  }
}

function finDeTurno(ultimaCasilla) {
  const linea = lineaGanadora(turno);
  if (linea) {
    terminado = true;
    puntos[turno]++;
    pintar(linea, ultimaCasilla);
    return;
  }

  turno = otro(turno);

  // En la fase de movimiento, si el jugador no puede mover, pierde el turno
  if (!enFaseColocar() && !tieneMovimientos(turno)) {
    const bloqueado = turno;
    turno = otro(turno);
    pintar(null, ultimaCasilla, `${bloqueado} no tiene movimientos y pierde el turno.`);
    return;
  }
  pintar(null, ultimaCasilla);
}

/* ---------- Render ---------- */
function pintar(lineaGan = null, ultima = null, aviso = "") {
  const destinos = seleccion !== null ? destinosDe(seleccion) : [];

  celdas.forEach((b, i) => {
    const v = tablero[i];
    b.textContent = v ?? "";
    b.className = "celda" + (v ? " " + v.toLowerCase() : "");
    if (i === ultima && v) b.classList.add("nueva");
    if (i === seleccion) b.classList.add("seleccionada");
    if (destinos.includes(i)) b.classList.add("destino");
    if (lineaGan && lineaGan.includes(i)) b.classList.add("ganadora");

    // Habilitación de casillas
    let activa = false;
    if (!terminado) {
      activa = enFaseColocar() ? v === null : v === turno || destinos.includes(i);
    }
    b.disabled = !activa;

    const fila = Math.floor(i / 3) + 1;
    const col = (i % 3) + 1;
    b.setAttribute("aria-label", `Fila ${fila}, columna ${col}: ${v ?? "vacía"}`);
  });

  // Marcador
  ["X", "O"].forEach((j) => {
    document.getElementById(`puntos-${j}`).textContent = puntos[j];
    const restantes = FICHAS_POR_JUGADOR - colocadas[j];
    document.getElementById(`restantes-${j}`).textContent =
      restantes > 0 ? `Por colocar: ${restantes}` : "";
    document.getElementById(`score-${j}`).classList.toggle("activo", !terminado && turno === j);
  });

  // Mensaje de estado
  let msg;
  if (terminado) {
    msg = `¡Ganó ${lineaGan ? tablero[lineaGan[0]] : turno}! Tres en línea.`;
  } else if (enFaseColocar()) {
    msg = `Turno de ${turno}: colocá una ficha en una casilla vacía.`;
  } else if (seleccion === null) {
    msg = `Turno de ${turno}: elegí una de tus fichas para moverla.`;
  } else {
    msg = `Turno de ${turno}: elegí una casilla vacía contigua.`;
  }
  elEstado.textContent = aviso ? `${aviso} ${msg}` : msg;
}

/* ---------- Eventos globales ---------- */
document.getElementById("btn-reiniciar").addEventListener("click", nuevaPartida);
document.getElementById("btn-puntajes").addEventListener("click", () => {
  puntos.X = 0;
  puntos.O = 0;
  nuevaPartida();
});

/* ---------- Inicio ---------- */
crearTablero();
nuevaPartida();
