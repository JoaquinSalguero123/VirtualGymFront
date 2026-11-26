/**
 * Mapa de las sucursales y enlaces a Google Maps.
 *
 * El mapa del sitio lo dibuja MapLibre con los mapas base de OpenFreeMap: no hace falta
 * API key ni cuenta de nadie. Los enlaces a Google Maps tampoco usan ninguna API: arman
 * la URL pública de búsqueda.
 */

/**
 * Estilo del mapa base. OpenFreeMap es gratis y sin límites, pero se ofrece "tal cual",
 * sin garantía de disponibilidad: si algún día deja de andar, alcanza con cambiar esta
 * URL por la de otro proveedor compatible con MapLibre (MapTiler, Stadia, Protomaps...).
 *
 * Se eligió "positron" (claro y minimalista) por legibilidad: se probó "dark", que
 * combina mejor con el verde del sitio, pero las calles y los nombres quedaban casi
 * invisibles. Los pines y el globo ya están pensados para un mapa claro.
 */
export const ESTILO_DE_MAPA = "https://tiles.openfreemap.org/styles/positron";

/** Dónde arranca el mapa antes de ajustarse a las sedes: Córdoba capital, como [longitud, latitud]. */
export const CENTRO_POR_DEFECTO = [-64.1888, -31.4201];

/** Quien pidió menos animaciones en su sistema no tiene que ver vuelos de cámara ni desplazamientos suaves. */
export function prefiereMenosMovimiento() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** True si el valor es un número usable como coordenada (null, "" y NaN no lo son). */
function esCoordenada(valor) {
  return typeof valor === "number" && Number.isFinite(valor);
}

/** True si la sucursal tiene latitud y longitud cargadas, o sea, si puede llevar un pin. */
export function tieneUbicacion(sucursal) {
  return esCoordenada(sucursal?.latitud) && esCoordenada(sucursal?.longitud);
}

/**
 * Ubicación de una sucursal en Google Maps.
 *
 * Si la sucursal tiene coordenadas se usan ésas, así el pin de Google cae en el mismo
 * lugar que el del mapa del sitio; si no, se busca por la dirección escrita.
 */
export function urlDeGoogleMaps(direccion, latitud, longitud) {
  const consulta = esCoordenada(latitud) && esCoordenada(longitud) ? `${latitud},${longitud}` : direccion;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consulta)}`;
}

/**
 * Ruta hasta la sucursal, en vez de sólo mostrar el pin.
 * Google Maps arma el origen solo, a partir de la ubicación de quien lo abre.
 */
export function urlDeComoLlegar(direccion, latitud, longitud) {
  const destino = esCoordenada(latitud) && esCoordenada(longitud) ? `${latitud},${longitud}` : direccion;

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destino)}`;
}
