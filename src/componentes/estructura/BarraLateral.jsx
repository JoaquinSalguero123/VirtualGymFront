import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";

import { useSesion } from "../../contexto/SesionContexto.jsx";
import { iniciales } from "../../dominio/formato.js";
import { Boton } from "../ui/Boton.jsx";
import { Marca } from "./Marca.jsx";
import { SelectorDeSucursal } from "./SelectorDeSucursal.jsx";
import { GRUPOS_DE_NAVEGACION } from "./navegacion.js";

/** Barra lateral: marca, sucursal activa, navegación y cuenta. */
export function BarraLateral({ abierta, alNavegar }) {
  const { usuario, tieneRol, cerrarSesion } = useSesion();

  const gruposVisibles = GRUPOS_DE_NAVEGACION.filter(
    (grupo) => !grupo.roles || tieneRol(...grupo.roles),
  );

  return (
    <aside className={`cascaron__barra${abierta ? " cascaron__barra--abierta" : ""}`}>
      <div className="cascaron__marca">
        <Marca a="/app" />
      </div>

      <SelectorDeSucursal />

      <nav className="navegacion" aria-label="Secciones">
        {gruposVisibles.map((grupo) => (
          <div className="navegacion__grupo" key={grupo.titulo ?? "principal"}>
            {grupo.titulo && <p className="navegacion__titulo">{grupo.titulo}</p>}

            {grupo.items.map(({ ruta, texto, icono: Icono, exacto }) => (
              <NavLink
                key={ruta}
                to={ruta}
                end={exacto}
                onClick={alNavegar}
                className={({ isActive }) =>
                  `navegacion__enlace${isActive ? " navegacion__enlace--activo" : ""}`
                }
              >
                <Icono size={16} className="navegacion__icono" aria-hidden="true" />
                {texto}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="cuenta">
        <span className="cuenta__avatar" aria-hidden="true">
          {iniciales(`${usuario?.nombre ?? ""} ${usuario?.apellido ?? ""}`)}
        </span>

        <span className="cuenta__datos">
          <span className="cuenta__nombre">
            {usuario?.nombre} {usuario?.apellido}
          </span>
          <span className="cuenta__mail">{usuario?.email}</span>
        </span>

        <Boton variante="fantasma" soloIcono onClick={cerrarSesion} aria-label="Cerrar sesión" title="Cerrar sesión">
          <LogOut size={16} />
        </Boton>
      </div>
    </aside>
  );
}
