import { Cargando, EstadoVacio } from "./Estados.jsx";

/**
 * Tabla de datos.
 *
 * Recibe las columnas como descripción en vez de recibir el `<thead>` armado,
 * para que cada pantalla sólo declare qué muestra y no repita la estructura.
 *
 * Cada columna es: { clave, titulo, celda(fila), numerica?, principal?, ancho? }
 */
export function Tabla({
  columnas,
  filas,
  claveDeFila = (fila) => fila.id,
  cargando = false,
  vacio,
  compacta = false,
  alHacerClicEnFila,
}) {
  if (cargando) return <Cargando />;

  if (!filas || filas.length === 0) {
    return vacio ?? <EstadoVacio titulo="No hay datos para mostrar." />;
  }

  return (
    <div className="tabla-envoltorio">
      <table className={`tabla${compacta ? " tabla--compacta" : ""}`}>
        <thead>
          <tr>
            {columnas.map((columna) => (
              <th
                key={columna.clave}
                className={columna.numerica ? "tabla__numero" : columna.acciones ? "tabla__acciones" : undefined}
                style={columna.ancho ? { width: columna.ancho } : undefined}
              >
                {columna.titulo}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {filas.map((fila) => (
            <tr
              key={claveDeFila(fila)}
              onClick={alHacerClicEnFila ? () => alHacerClicEnFila(fila) : undefined}
              style={alHacerClicEnFila ? { cursor: "pointer" } : undefined}
            >
              {columnas.map((columna) => (
                <td
                  key={columna.clave}
                  className={[
                    columna.numerica && "tabla__numero",
                    columna.acciones && "tabla__acciones",
                    columna.principal && "tabla__principal",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {columna.celda(fila)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Controles de paginación para los listados que devuelven ResultadoPaginado. */
export function Paginador({ resultado, alCambiarPagina }) {
  if (!resultado || resultado.totalPaginas <= 1) return null;

  const { pagina, totalPaginas, totalRegistros } = resultado;

  return (
    <div className="paginador">
      <span>
        Página {pagina} de {totalPaginas} · {totalRegistros} registros
      </span>

      <div className="fila">
        <button
          type="button"
          className="boton boton--secundario"
          disabled={!resultado.hayPaginaAnterior}
          onClick={() => alCambiarPagina(pagina - 1)}
        >
          Anterior
        </button>

        <button
          type="button"
          className="boton boton--secundario"
          disabled={!resultado.hayPaginaSiguiente}
          onClick={() => alCambiarPagina(pagina + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
