import { useTitulo } from "../../hooks/useTitulo.js";

/**
 * Encabezado de una pantalla de la aplicación: título, descripción y acciones.
 * También fija el título de la pestaña del navegador.
 */
export function EncabezadoDePagina({ titulo, descripcion, acciones }) {
  useTitulo(titulo);

  return (
    <header className="encabezado">
      <div>
        <h1 className="encabezado__titulo">{titulo}</h1>
        {descripcion && <p className="encabezado__descripcion">{descripcion}</p>}
      </div>

      {acciones && <div className="fila">{acciones}</div>}
    </header>
  );
}
