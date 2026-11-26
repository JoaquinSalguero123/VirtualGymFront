import cliente from "./cliente.js";

/**
 * Todas las llamadas al backend, agrupadas por módulo igual que en la API.
 *
 * Tener un solo lugar donde figuran las rutas evita que las URL queden
 * desparramadas por los componentes: si el backend cambia un endpoint, se
 * corrige acá y nada más.
 */

/* ============================ 1. CUENTA Y ACCESO ============================ */
export const auth = {
  registrar: (datos) => cliente.post("/auth/register", datos),
  iniciarSesion: (datos) => cliente.post("/auth/login", datos),
  sesionActual: () => cliente.get("/auth/me"),
  solicitarRecuperacion: (datos) => cliente.post("/auth/solicitar-recuperacion", datos),
  restablecerClave: (datos) => cliente.post("/auth/restablecer-clave", datos),
  cambiarClave: (datos) => cliente.post("/auth/cambiar-clave", datos),
  verificarEmail: (datos) => cliente.post("/auth/verificar-email", datos),
  reenviarVerificacion: (datos) => cliente.post("/auth/reenviar-verificacion", datos),
};

/* ============================ 2. ORGANIZACIONES ============================ */
export const organizaciones = {
  listar: () => cliente.get("/organizaciones"),
  obtener: (id) => cliente.get(`/organizaciones/${id}`),
  crear: (datos) => cliente.post("/organizaciones", datos),
  actualizar: (id, datos) => cliente.put(`/organizaciones/${id}`, datos),
  darDeBaja: (id) => cliente.delete(`/organizaciones/${id}`),
};

/* ============================= 3. SUCURSALES ============================= */
export const sucursales = {
  publicas: () => cliente.get("/sucursales/publicas"),
  listar: () => cliente.get("/sucursales"),
  obtener: (id) => cliente.get(`/sucursales/${id}`),
  zonas: () => cliente.get("/sucursales/zonas"),
  crear: (datos) => cliente.post("/sucursales", datos),
  actualizar: (id, datos) => cliente.put(`/sucursales/${id}`, datos),
  marcarCasaMatriz: (id) => cliente.put(`/sucursales/${id}/casa-matriz`),
  darDeBaja: (id) => cliente.delete(`/sucursales/${id}`),
  reactivar: (id) => cliente.put(`/sucursales/${id}/reactivar`),
};

/* ========================== 4. PERSONAL Y ROLES ========================== */
export const usuarios = {
  roles: () => cliente.get("/usuarios/roles"),
  listar: (params) => cliente.get("/usuarios", { params }),
  obtener: (id) => cliente.get(`/usuarios/${id}`),
  asignaciones: (id) => cliente.get(`/usuarios/${id}/asignaciones`),
  crear: (datos) => cliente.post("/usuarios", datos),
  actualizar: (id, datos) => cliente.put(`/usuarios/${id}`, datos),
  asignarEnSucursal: (id, datos) => cliente.post(`/usuarios/${id}/asignaciones`, datos),
  quitarDeSucursal: (id) => cliente.delete(`/usuarios/${id}`),
};

/* ================================ 5. SOCIOS ================================ */
export const socios = {
  listar: (params) => cliente.get("/socios", { params }),
  miFicha: () => cliente.get("/socios/mi-ficha"),
  obtener: (id) => cliente.get(`/socios/${id}`),
  actualizar: (id, datos) => cliente.put(`/socios/${id}`, datos),
  estados: () => cliente.get("/socios/estados"),
  unirme: (datos) => cliente.post("/socios/unirme", datos),
};

/* ======================== 6. PLANES Y MEMBRESÍAS ======================== */
export const planes = {
  /** Planes vigentes para el sitio público. No requiere token. */
  publicos: (params) => cliente.get("/planes/publicos", { params }),

  listar: (params) => cliente.get("/planes", { params }),
  obtener: (id) => cliente.get(`/planes/${id}`),
  crear: (datos) => cliente.post("/planes", datos),
  actualizar: (id, datos) => cliente.put(`/planes/${id}`, datos),
  darDeBaja: (id) => cliente.delete(`/planes/${id}`),
};

export const membresias = {
  deSocio: (idSocio) => cliente.get(`/membresias/socio/${idSocio}`),
  activaDeSocio: (idSocio) => cliente.get(`/membresias/socio/${idSocio}/activa`),
  asignar: (datos) => cliente.post("/membresias", datos),
  darDeBajaActiva: (idSocio) => cliente.delete(`/membresias/socio/${idSocio}/activa`),
};

/* ================================ 7. PAGOS ================================ */
export const formasDePago = {
  listar: (params) => cliente.get("/formas-de-pago", { params }),
  crear: (datos) => cliente.post("/formas-de-pago", datos),
  actualizar: (id, datos) => cliente.put(`/formas-de-pago/${id}`, datos),
  eliminar: (id) => cliente.delete(`/formas-de-pago/${id}`),
};

export const pagos = {
  registrar: (datos) => cliente.post("/pagos", datos),
  cobroPresencial: (datos) => cliente.post("/pagos/cobro-presencial", datos),
  mios: (params) => cliente.get("/pagos/mios", { params }),
  pendientes: (params) => cliente.get("/pagos/pendientes", { params }),
  listar: (params) => cliente.get("/pagos", { params }),
  cambiarEstado: (id, datos) => cliente.put(`/pagos/${id}/estado`, datos),
  enviarConstancia: (id, datos) => cliente.post(`/pagos/${id}/enviar-constancia`, datos),
  grillaAnual: (params) => cliente.get("/pagos/grilla-anual", { params }),
  resumen: (params) => cliente.get("/pagos/resumen", { params }),
};

/* ============================= 8. ASISTENCIAS ============================= */
export const asistencias = {
  marcar: () => cliente.post("/asistencias/marcar"),
  marcarParaSocio: (idSocio) => cliente.post(`/asistencias/socio/${idSocio}/marcar`),
  registrarSalida: () => cliente.put("/asistencias/salida"),
  mias: (params) => cliente.get("/asistencias/mias", { params }),
  grillaMensual: (params) => cliente.get("/asistencias/grilla-mensual", { params }),
  resumen: () => cliente.get("/asistencias/resumen"),
};

/* ============================== 9. CATÁLOGOS ============================== */
/** Los tres catálogos simples comparten forma, así que se arman con una fábrica. */
function catalogo(ruta) {
  return {
    listar: () => cliente.get(`/catalogos/${ruta}`),
    crear: (datos) => cliente.post(`/catalogos/${ruta}`, datos),
    actualizar: (id, datos) => cliente.put(`/catalogos/${ruta}/${id}`, datos),
    eliminar: (id) => cliente.delete(`/catalogos/${ruta}/${id}`),
  };
}

export const objetivos = catalogo("objetivos");
export const gruposMusculares = catalogo("grupos-musculares");
export const categoriasDeAlimentos = catalogo("categorias-de-alimentos");

/* ============================ 10. ENTRENAMIENTO ============================ */
export const ejercicios = {
  listar: (params) => cliente.get("/ejercicios", { params }),
  obtener: (id) => cliente.get(`/ejercicios/${id}`),
  crear: (datos) => cliente.post("/ejercicios", datos),
  actualizar: (id, datos) => cliente.put(`/ejercicios/${id}`, datos),
  eliminar: (id) => cliente.delete(`/ejercicios/${id}`),
};

export const rutinas = {
  listar: (params) => cliente.get("/rutinas", { params }),
  obtener: (id) => cliente.get(`/rutinas/${id}`),
  crear: (datos) => cliente.post("/rutinas", datos),
  actualizar: (id, datos) => cliente.put(`/rutinas/${id}`, datos),
  darDeBaja: (id) => cliente.delete(`/rutinas/${id}`),
};

export const rutinasDeSocio = {
  generar: (datos) => cliente.post("/rutinas-de-socio/generar", datos),
  mia: () => cliente.get("/rutinas-de-socio/mia"),
  guardarMia: (datos) => cliente.post("/rutinas-de-socio/mia", datos),
  deSocio: (idSocio) => cliente.get(`/rutinas-de-socio/socio/${idSocio}`),
  historialDeSocio: (idSocio) => cliente.get(`/rutinas-de-socio/socio/${idSocio}/historial`),
  asignar: (datos) => cliente.post("/rutinas-de-socio/asignar", datos),
};

/* ============================== 11. NUTRICIÓN ============================== */
export const alimentos = {
  listar: (params) => cliente.get("/alimentos", { params }),
  obtener: (id) => cliente.get(`/alimentos/${id}`),
  crear: (datos) => cliente.post("/alimentos", datos),
  actualizar: (id, datos) => cliente.put(`/alimentos/${id}`, datos),
  eliminar: (id) => cliente.delete(`/alimentos/${id}`),
};

export const dietas = {
  generar: (datos) => cliente.post("/dietas/generar", datos),
  mia: () => cliente.get("/dietas/mia"),
  guardarMia: (datos) => cliente.post("/dietas/mia", datos),
  deSocio: (idSocio) => cliente.get(`/dietas/socio/${idSocio}`),
  historialDeSocio: (idSocio) => cliente.get(`/dietas/socio/${idSocio}/historial`),
  asignar: (datos) => cliente.post("/dietas/asignar", datos),
};

/* ============================== 12. HORARIOS ============================== */
export const horarios = {
  publicos: (idGimnasio) => cliente.get(`/horarios/publicos/${idGimnasio}`),
  listar: () => cliente.get("/horarios"),
  crear: (datos) => cliente.post("/horarios", datos),
  actualizar: (id, datos) => cliente.put(`/horarios/${id}`, datos),
  eliminar: (id) => cliente.delete(`/horarios/${id}`),
};

/* ============================= 13. MEDICIONES ============================= */
export const mediciones = {
  mias: () => cliente.get("/mediciones/mias"),
  deSocio: (idSocio) => cliente.get(`/mediciones/socio/${idSocio}`),
  progresoDeSocio: (idSocio) => cliente.get(`/mediciones/socio/${idSocio}/progreso`),
  crear: (datos) => cliente.post("/mediciones", datos),
  eliminar: (id) => cliente.delete(`/mediciones/${id}`),
};

/* ============================== 14. SITIO WEB ============================== */
export const sitioWeb = {
  carouselPublico: (params) => cliente.get("/sitio-web/carousel/publico", { params }),
  carousel: (params) => cliente.get("/sitio-web/carousel", { params }),

  // El carrusel usa multipart porque admite subir una imagen.
  crearCarousel: (formData) =>
    cliente.post("/sitio-web/carousel", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  actualizarCarousel: (id, formData) =>
    cliente.put(`/sitio-web/carousel/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  eliminarCarousel: (id) => cliente.delete(`/sitio-web/carousel/${id}`),

  footerPublico: (params) => cliente.get("/sitio-web/footer/publico", { params }),
  crearFooter: (datos) => cliente.post("/sitio-web/footer", datos),
  actualizarFooter: (id, datos) => cliente.put(`/sitio-web/footer/${id}`, datos),
  eliminarFooter: (id) => cliente.delete(`/sitio-web/footer/${id}`),
};

/* ================================ 15. FORO ================================ */
export const foro = {
  listar: (params) => cliente.get("/foro", { params }),
  publicar: (formData) =>
    cliente.post("/foro", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  eliminar: (id) => cliente.delete(`/foro/${id}`),
};

/** URL pública de un archivo subido (imágenes del carrusel, adjuntos del foro). */
export function urlDeArchivo(nombre) {
  if (!nombre) return null;

  const base = import.meta.env.VITE_API_URL ?? "http://localhost:5180";

  return `${base}/uploads/${nombre}`;
}
