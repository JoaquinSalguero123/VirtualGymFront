import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { useSesion } from "../../contexto/SesionContexto.jsx";

/**
 * Cambia la sucursal sobre la que se está trabajando.
 *
 * Es el control más importante de la barra lateral. En este sistema el rol de
 * una persona depende de la sede, así que cambiar de sucursal puede cambiar lo
 * que puede hacer: por eso muestra siempre el rol vigente debajo del nombre.
 */
export function SelectorDeSucursal() {
  const { sucursales, sucursalActiva, cambiarSucursal } = useSesion();
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef(null);

  /* Se cierra al hacer clic afuera o con Escape. */
  useEffect(() => {
    if (!abierto) return;

    const alHacerClic = (evento) => {
      if (!contenedor.current?.contains(evento.target)) setAbierto(false);
    };

    const alPresionarTecla = (evento) => {
      if (evento.key === "Escape") setAbierto(false);
    };

    document.addEventListener("mousedown", alHacerClic);
    document.addEventListener("keydown", alPresionarTecla);

    return () => {
      document.removeEventListener("mousedown", alHacerClic);
      document.removeEventListener("keydown", alPresionarTecla);
    };
  }, [abierto]);

  if (!sucursalActiva) return null;

  // Con una sola sucursal no hay nada que elegir: se muestra como dato.
  const unicaSucursal = sucursales.length <= 1;

  return (
    <div className="selector-sucursal" ref={contenedor}>
      <button
        type="button"
        className="selector-sucursal__boton"
        onClick={() => !unicaSucursal && setAbierto((estaAbierto) => !estaAbierto)}
        aria-expanded={abierto}
        aria-haspopup={unicaSucursal ? undefined : "listbox"}
        style={unicaSucursal ? { cursor: "default" } : undefined}
      >
        <span className="crece" style={{ minWidth: 0 }}>
          <span className="selector-sucursal__nombre">{sucursalActiva.gimnasio}</span>
          <span className="selector-sucursal__rol">{sucursalActiva.rol}</span>
        </span>

        {!unicaSucursal && <ChevronsUpDown size={14} aria-hidden="true" />}
      </button>

      {abierto && (
        <div className="selector-sucursal__lista" role="listbox">
          {sucursales.map((sucursal) => {
            const esActiva = sucursal.idGimnasio === sucursalActiva.idGimnasio;

            return (
              <button
                key={sucursal.idGimnasio}
                type="button"
                role="option"
                aria-selected={esActiva}
                className={`selector-sucursal__opcion${esActiva ? " selector-sucursal__opcion--activa" : ""}`}
                onClick={() => {
                  cambiarSucursal(sucursal.idGimnasio);
                  setAbierto(false);
                }}
              >
                <span>
                  {sucursal.gimnasio}
                  <span className="texto-tenue" style={{ display: "block" }}>
                    {sucursal.rol}
                  </span>
                </span>

                {esActiva && <Check size={14} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
