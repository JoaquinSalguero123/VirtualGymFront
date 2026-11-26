import { Link } from "react-router-dom";
import { Check } from "lucide-react";

import { planes } from "../../api/endpoints.js";
import { usePeticion } from "../../hooks/usePeticion.js";
import { useTitulo } from "../../hooks/useTitulo.js";
import { moneda } from "../../dominio/formato.js";
import { Cargando, EstadoVacio } from "../../componentes/ui/Estados.jsx";

/** Listado de planes para el visitante. */
export default function PaginaDePlanes() {
  useTitulo("Planes");

  const { datos, cargando } = usePeticion(() => planes.publicos(), []);

  return (
    <section className="seccion" style={{ borderTop: "none" }}>
      <h1 className="seccion__titulo">Planes</h1>
      <p className="seccion__bajada">
        Todos los planes incluyen rutina y plan de alimentación desde tu cuenta.
      </p>

      {cargando ? (
        <Cargando />
      ) : !datos || datos.length === 0 ? (
        <EstadoVacio titulo="Todavía no hay planes publicados.">
          <p>Consultá en el mostrador del gimnasio por los planes disponibles.</p>
        </EstadoVacio>
      ) : (
        <>
          <div className="planes">
            {datos.map((plan) => (
              <article className="plan" key={plan.id}>
                <h2 className="plan__nombre">{plan.nombre}</h2>

                <div>
                  <span className="plan__precio">{moneda(plan.precio)}</span>
                  <span className="plan__periodo">por {plan.duracionDias} días</span>
                </div>

                <p className="plan__detalle">{plan.descripcion}</p>

                <ul className="plan__rasgos">
                  {plan.nivel && (
                    <li>
                      <Check size={14} style={{ marginTop: 3, flexShrink: 0 }} />
                      Nivel {plan.nivel}
                    </li>
                  )}
                  <li>
                    <Check size={14} style={{ marginTop: 3, flexShrink: 0 }} />
                    {plan.accesoMultiSede ? "Acceso a todas las sucursales" : "Acceso a tu sucursal"}
                  </li>
                </ul>

                <Link to="/crear-cuenta" className="boton boton--principal">
                  Sumarme con este plan
                </Link>
              </article>
            ))}
          </div>

          <p className="texto-tenue" style={{ marginTop: "var(--e-amplio)" }}>
            La cuota se paga desde tu cuenta y la confirma el mostrador del gimnasio.
          </p>
        </>
      )}
    </section>
  );
}
