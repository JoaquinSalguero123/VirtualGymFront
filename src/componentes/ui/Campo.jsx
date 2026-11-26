import { useId } from "react";

/**
 * Campo de formulario con etiqueta, mensaje de ayuda y mensaje de error.
 *
 * Une la etiqueta con el control mediante un id generado, para que los lectores
 * de pantalla la anuncien y para que se pueda hacer clic en el texto.
 */
export function Campo({
  etiqueta,
  error,
  ayuda,
  ancho = false,
  children,
  ...resto
}) {
  const id = useId();
  const idError = `${id}-error`;
  const idAyuda = `${id}-ayuda`;

  const clases = ["campo__control", error && "campo__control--invalido"]
    .filter(Boolean)
    .join(" ");

  const descritoPor = [error && idError, ayuda && idAyuda].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`campo${ancho ? " campo--ancho" : ""}`}>
      {etiqueta && (
        <label className="campo__etiqueta" htmlFor={id}>
          {etiqueta}
        </label>
      )}

      {/* Si viene un hijo (un select o textarea armado afuera) se le inyectan
          los atributos de accesibilidad; si no, se dibuja un input. */}
      {children ? (
        <SlotDeControl id={id} clases={clases} descritoPor={descritoPor}>
          {children}
        </SlotDeControl>
      ) : (
        <input id={id} className={clases} aria-describedby={descritoPor} {...resto} />
      )}

      {ayuda && !error && (
        <span id={idAyuda} className="campo__ayuda">
          {ayuda}
        </span>
      )}

      {error && (
        <span id={idError} className="campo__error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

/** Clona el control recibido agregándole id, clases y descripción. */
function SlotDeControl({ id, clases, descritoPor, children }) {
  const elemento = Array.isArray(children) ? children[0] : children;

  if (!elemento?.type) return children;

  const Etiqueta = elemento.type;

  return (
    <Etiqueta
      {...elemento.props}
      id={id}
      className={`${clases} ${elemento.props.className ?? ""}`.trim()}
      aria-describedby={descritoPor}
    />
  );
}

/** Lista desplegable. Las opciones se pasan como [{ valor, texto }]. */
export function Seleccion({ etiqueta, error, ayuda, ancho, opciones = [], vacio, ...resto }) {
  return (
    <Campo etiqueta={etiqueta} error={error} ayuda={ayuda} ancho={ancho}>
      <select {...resto}>
        {vacio && <option value="">{vacio}</option>}

        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.texto}
          </option>
        ))}
      </select>
    </Campo>
  );
}

/** Área de texto para observaciones y contenido largo. */
export function AreaDeTexto({ etiqueta, error, ayuda, ancho, ...resto }) {
  return (
    <Campo etiqueta={etiqueta} error={error} ayuda={ayuda} ancho={ancho}>
      <textarea {...resto} />
    </Campo>
  );
}

/** Casilla de verificación con su texto al costado. */
export function Casilla({ etiqueta, ...resto }) {
  return (
    <label className="casilla">
      <input type="checkbox" {...resto} />
      <span>{etiqueta}</span>
    </label>
  );
}
