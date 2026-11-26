import { useEffect, useRef } from "react";
import { X } from "lucide-react";

import { Boton } from "./Boton.jsx";
import { AvisoDeError } from "./Aviso.jsx";

/**
 * Diálogo modal.
 *
 * Se cierra con Escape y haciendo clic fuera, y al abrirse lleva el foco
 * adentro para que se pueda operar con el teclado. Mientras está abierto se
 * bloquea el scroll de la página de atrás.
 */
export function Dialogo({ abierto, titulo, descripcion, ancho = false, alCerrar, pie, children }) {
  const contenedor = useRef(null);

  useEffect(() => {
    if (!abierto) return;

    const alPresionarTecla = (evento) => {
      if (evento.key === "Escape") alCerrar();
    };

    document.addEventListener("keydown", alPresionarTecla);

    const desbordeOriginal = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // El primer control del diálogo recibe el foco al abrirse.
    contenedor.current?.querySelector("input, select, textarea, button")?.focus();

    return () => {
      document.removeEventListener("keydown", alPresionarTecla);
      document.body.style.overflow = desbordeOriginal;
    };
  }, [abierto, alCerrar]);

  if (!abierto) return null;

  return (
    <div
      className="dialogo-fondo"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) alCerrar();
      }}
    >
      <div
        className={`dialogo${ancho ? " dialogo--ancho" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        ref={contenedor}
      >
        <header className="dialogo__cabecera">
          <div>
            <h2 className="dialogo__titulo">{titulo}</h2>
            {descripcion && <p className="dialogo__descripcion">{descripcion}</p>}
          </div>

          <Boton variante="fantasma" soloIcono onClick={alCerrar} aria-label="Cerrar">
            <X size={18} />
          </Boton>
        </header>

        <div className="dialogo__cuerpo">{children}</div>

        {pie && <footer className="dialogo__pie">{pie}</footer>}
      </div>
    </div>
  );
}

/**
 * Diálogo de confirmación para acciones que no se pueden deshacer.
 * El botón repite el verbo de la acción, no dice "Aceptar".
 */
export function DialogoDeConfirmacion({
  abierto,
  titulo,
  mensaje,
  textoDeAccion = "Confirmar",
  peligrosa = false,
  enCurso = false,
  error = null,
  alConfirmar,
  alCerrar,
}) {
  return (
    <Dialogo
      abierto={abierto}
      titulo={titulo}
      alCerrar={alCerrar}
      pie={
        <>
          <Boton variante="fantasma" onClick={alCerrar}>
            Cancelar
          </Boton>

          <Boton
            variante={peligrosa ? "peligro" : "principal"}
            onClick={alConfirmar}
            enCurso={enCurso}
          >
            {textoDeAccion}
          </Boton>
        </>
      }
    >
      <p>{mensaje}</p>
      <AvisoDeError error={error} />
    </Dialogo>
  );
}
