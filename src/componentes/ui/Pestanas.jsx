/**
 * Pestañas de navegación dentro de una pantalla.
 * Cada pestaña es { clave, texto }.
 */
export function Pestanas({ pestanas, activa, alCambiar }) {
  return (
    <div className="pestanas" role="tablist">
      {pestanas.map((pestana) => (
        <button
          key={pestana.clave}
          type="button"
          role="tab"
          aria-selected={activa === pestana.clave}
          className={`pestana${activa === pestana.clave ? " pestana--activa" : ""}`}
          onClick={() => alCambiar(pestana.clave)}
        >
          {pestana.texto}
        </button>
      ))}
    </div>
  );
}
