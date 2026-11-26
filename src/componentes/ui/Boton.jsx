/**
 * Botón de la aplicación.
 *
 * El texto siempre dice qué va a pasar ("Guardar cambios", "Aprobar pago"),
 * nunca "Enviar": el nombre de la acción se mantiene igual en el botón, en el
 * diálogo de confirmación y en el mensaje de resultado.
 */
export function Boton({
  variante = "secundario",
  grande = false,
  bloque = false,
  soloIcono = false,
  enCurso = false,
  icono: Icono,
  children,
  className = "",
  ...resto
}) {
  const clases = [
    "boton",
    `boton--${variante}`,
    grande && "boton--grande",
    bloque && "boton--bloque",
    soloIcono && "boton--icono",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={clases} disabled={enCurso || resto.disabled} {...resto}>
      {enCurso ? <span className="cargando__disco" aria-hidden="true" /> : Icono && <Icono size={15} />}
      {children}
    </button>
  );
}
