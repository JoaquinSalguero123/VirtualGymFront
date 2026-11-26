import { Link, Outlet } from "react-router-dom";

import { useSesion } from "../../contexto/SesionContexto.jsx";
import { sitioWeb } from "../../api/endpoints.js";
import { usePeticion } from "../../hooks/usePeticion.js";
import { Marca } from "./Marca.jsx";

/**
 * Estructura del sitio público: cabecera, contenido y pie.
 *
 * Toda esta zona va sobre la superficie verde inmersiva. El pie se arma con
 * los datos que el gimnasio configura desde el panel, no con texto fijo.
 */
export function CascaronPublico() {
  const { autenticado } = useSesion();

  return (
    <div className="publico superficie-oscura">
      <header className="publico__cabecera">
        <Marca />

        <nav className="publico__navegacion" aria-label="Sitio">
          <Link to="/planes" className="ocultar-movil">
            Planes
          </Link>
          <Link to="/sucursales" className="ocultar-movil">
            Sucursales
          </Link>

          {autenticado ? (
            <Link to="/app" className="boton boton--principal">
              Ir a mi cuenta
            </Link>
          ) : (
            <>
              <Link to="/ingresar">Ingresar</Link>
              <Link to="/crear-cuenta" className="boton boton--principal">
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </header>

      <div className="publico__cuerpo">
        <Outlet />
      </div>

      <PieDelSitio />
    </div>
  );
}

/** Pie del sitio, armado con la configuración que carga la administración. */
function PieDelSitio() {
  const { datos: secciones } = usePeticion(() => sitioWeb.footerPublico(), []);

  const grupos = Object.entries(secciones ?? {});

  return (
    <footer className="publico__pie">
      <div className="publico__pie-rejilla">
        <div>
          <Marca />
          <p className="publico__pie-dato" style={{ marginTop: "var(--e-corto)" }}>
            Gestión de entrenamiento, alimentación y cuotas en un solo lugar.
          </p>
        </div>

        {grupos.map(([seccion, datos]) => (
          <div key={seccion}>
            <p className="publico__pie-titulo">{seccion}</p>

            <div className="pila-corta">
              {datos.map((dato) => (
                <span key={dato.id} className="publico__pie-dato">
                  {dato.valor}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="publico__pie-legal">
        VirtualGym · Trabajo Final Integrador, Tecnicatura Universitaria en Programación
      </p>
    </footer>
  );
}
