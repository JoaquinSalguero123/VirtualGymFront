/**
 * Superficie con borde y radio visible. Es la única pieza que "flota" sobre el
 * fondo de hormigón, y se usa con moderación: no todo el contenido necesita
 * estar dentro de una tarjeta.
 */
export function Panel({
  titulo,
  descripcion,
  acciones,
  ajustado = false,
  sinRelleno = false,
  children,
  className = "",
}) {
  const clases = [
    "panel",
    ajustado && "panel--ajustado",
    sinRelleno && "panel--sin-relleno",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={clases}>
      {(titulo || acciones) && (
        <header className="panel__cabecera">
          <div>
            {titulo && <h3 className="panel__titulo">{titulo}</h3>}
            {descripcion && <p className="texto-tenue">{descripcion}</p>}
          </div>

          {acciones && <div className="fila">{acciones}</div>}
        </header>
      )}

      {children}
    </section>
  );
}
