/**
 * Formateo para mostrar datos al usuario.
 *
 * Todo en español de Argentina: el peso con separador de miles por punto y
 * decimales por coma, y las fechas en día/mes/año.
 */

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export function nombreDeMes(numero) {
  return MESES[numero - 1] ?? "";
}

export function nombreDeDia(numero) {
  return DIAS[numero - 1] ?? "";
}

export function mesesDelAnio() {
  return MESES.map((nombre, indice) => ({ numero: indice + 1, nombre }));
}

const formateadorDeMoneda = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/** Importe en pesos, sin centavos: las cuotas son montos redondos. */
export function moneda(valor) {
  if (valor == null) return "—";

  return formateadorDeMoneda.format(valor);
}

/** Número con separadores de miles. */
export function numero(valor, decimales = 0) {
  if (valor == null) return "—";

  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valor);
}

/** Fecha corta: 17/09/2026. Acepta "2026-09-17" y fechas ISO completas. */
export function fecha(valor) {
  if (!valor) return "—";

  const d = new Date(valor.length <= 10 ? `${valor}T00:00:00` : valor);

  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Fecha y hora: 17/09/2026 14:30. */
export function fechaYHora(valor) {
  if (!valor) return "—";

  const d = new Date(valor);

  if (Number.isNaN(d.getTime())) return "—";

  return `${d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })} ${d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`;
}

/** Sólo la hora: 14:30. */
export function hora(valor) {
  if (!valor) return "—";

  const d = new Date(valor);

  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

/** Iniciales para el avatar, a partir del nombre completo. */
export function iniciales(nombreCompleto) {
  if (!nombreCompleto) return "?";

  return nombreCompleto
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

/** Edad en años a partir de la fecha de nacimiento. */
export function edad(fechaNacimiento) {
  if (!fechaNacimiento) return null;

  const nacimiento = new Date(`${fechaNacimiento}T00:00:00`);
  const hoy = new Date();

  let anios = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();

  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) anios--;

  return anios;
}
