import axios from "axios";

/**
 * Cliente HTTP único de la aplicación.
 *
 * Concentra las dos cosas que el backend espera en CADA petición protegida:
 *   - el token JWT en la cabecera Authorization,
 *   - la sucursal activa en la cabecera X-Gimnasio-Id.
 *
 * Al resolverlo con interceptores, ninguna pantalla tiene que acordarse de
 * mandarlas: se pasa el token y la sucursal una sola vez al iniciar sesión o
 * al cambiar de sede.
 */
const cliente = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? "http://localhost:5180"}/api`,
  headers: { "Content-Type": "application/json" },
});

/** Claves con las que se recuerda la sesión entre recargas de la página. */
export const CLAVES = {
  token: "vga.token",
  sucursal: "vga.sucursal",
};

/* Estado en memoria. Se sincroniza con localStorage para sobrevivir a un F5. */
let token = localStorage.getItem(CLAVES.token) ?? null;
let idSucursal = localStorage.getItem(CLAVES.sucursal) ?? null;

/** Guarda (o borra, con null) el token de la sesión. */
export function definirToken(nuevoToken) {
  token = nuevoToken;

  if (nuevoToken) localStorage.setItem(CLAVES.token, nuevoToken);
  else localStorage.removeItem(CLAVES.token);
}

/** Guarda (o borra, con null) la sucursal sobre la que se está trabajando. */
export function definirSucursal(nuevoId) {
  idSucursal = nuevoId ? String(nuevoId) : null;

  if (idSucursal) localStorage.setItem(CLAVES.sucursal, idSucursal);
  else localStorage.removeItem(CLAVES.sucursal);
}

export function obtenerToken() {
  return token;
}

export function obtenerSucursal() {
  return idSucursal ? Number(idSucursal) : null;
}

/* Interceptor de salida: agrega las cabeceras a cada petición. */
cliente.interceptors.request.use((config) => {
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Los endpoints públicos no necesitan sucursal, pero mandarla no molesta:
  // el backend la ignora cuando no hace falta.
  if (idSucursal) config.headers["X-Gimnasio-Id"] = idSucursal;

  return config;
});

/**
 * Interceptor de entrada: traduce los errores del backend a un mensaje que se
 * pueda mostrar tal cual en la pantalla.
 *
 * El backend responde siempre en formato ProblemDetails, así que el texto útil
 * está en `detail` o, cuando son errores de validación, en `errors`.
 */
cliente.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const problema = error.response?.data;

    const errorAmigable = new Error(
      problema?.detail ??
        problema?.title ??
        (error.code === "ERR_NETWORK"
          ? "No se pudo conectar con el servidor. Verificá que la API esté levantada."
          : "Ocurrió un error inesperado."),
    );

    errorAmigable.estado = error.response?.status ?? 0;

    // Errores por campo, para poder marcarlos en el formulario.
    errorAmigable.errores = problema?.errors ?? null;

    // Código propio (no HTTP) para distinguir casos puntuales de un mismo status,
    // como "todavía no verificaste tu email" dentro de los 403. Ver
    // ManejadorGlobalDeExcepciones en el backend.
    errorAmigable.codigo = problema?.codigo ?? null;

    // La sesión venció o el token es inválido: se limpia para que el resto de
    // la aplicación reaccione y vuelva a la pantalla de acceso.
    if (errorAmigable.estado === 401 && token) {
      definirToken(null);
      definirSucursal(null);
      window.dispatchEvent(new Event("vga:sesion-expirada"));
    }

    return Promise.reject(errorAmigable);
  },
);

export default cliente;
