import { Boton } from "./Boton.jsx";

/** Indicador de carga para el contenido de un panel o una tabla. */
export function Cargando({ texto = "Cargando" }) {
  return (
    <div className="cargando" role="status">
      <span className="cargando__disco" aria-hidden="true" />
      {texto}
    </div>
  );
}

/** Filas grises que ocupan el lugar de una lista mientras llega la respuesta. */
export function EsqueletoDeFilas({ filas = 5 }) {
  return (
    <div className="pila-corta" style={{ padding: "var(--e-normal) var(--e-amplio)" }} aria-hidden="true">
      {Array.from({ length: filas }, (_, indice) => (
        <div key={indice} className="esqueleto" style={{ width: `${88 - indice * 6}%` }} />
      ))}
    </div>
  );
}

/**
 * Pantalla sin datos. Siempre dice qué se puede hacer, en vez de limitarse a
 * informar que no hay nada.
 */
export function EstadoVacio({ icono: Icono, titulo, children, accion }) {
  return (
    <div className="estado-vacio">
      {Icono && <Icono size={28} className="estado-vacio__icono" />}

      {titulo && <p className="estado-vacio__titulo">{titulo}</p>}
      {children}

      {accion && (
        <Boton variante="principal" onClick={accion.onClick} icono={accion.icono}>
          {accion.texto}
        </Boton>
      )}
    </div>
  );
}
