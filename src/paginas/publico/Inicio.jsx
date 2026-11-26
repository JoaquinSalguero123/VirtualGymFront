import { Link } from "react-router-dom";
import { Check } from "lucide-react";

import { horarios, planes, sitioWeb, sucursales, urlDeArchivo } from "../../api/endpoints.js";
import { usePeticion } from "../../hooks/usePeticion.js";
import { useTitulo } from "../../hooks/useTitulo.js";
import { moneda, nombreDeDia } from "../../dominio/formato.js";

/** Día de la semana de hoy con la numeración del backend: 1 = lunes … 7 = domingo. */
function diaDeHoy() {
  const domingoEsCero = new Date().getDay();

  return domingoEsCero === 0 ? 7 : domingoEsCero;
}

/** True si la hora actual cae dentro de la franja "HH:mm – HH:mm". */
function estaAbiertoAhora(apertura, cierre) {
  const ahora = new Date();
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();

  const aMinutos = (texto) => {
    const [h, m] = texto.split(":").map(Number);
    return h * 60 + m;
  };

  return minutosAhora >= aMinutos(apertura) && minutosAhora < aMinutos(cierre);
}

/**
 * Portada del sitio público.
 *
 * El héroe no abre con una imagen de archivo: abre con el estado real del
 * gimnasio —qué sedes hay y hasta qué hora abren hoy—, que es lo primero que
 * quiere saber alguien que está pensando en ir a entrenar.
 */
export default function Inicio() {
  useTitulo(null);

  const { datos: sedes } = usePeticion(() => sucursales.publicas(), []);

  return (
    <>
      <section className="heroe">
        <div>
          <h1 className="heroe__titulo">
            Tu rutina, tu plan de comidas y tu cuota, sin preguntarle a nadie
            <span className="heroe__punto">.</span>
          </h1>

          <p className="heroe__bajada">
            Cada socio entra con su cuenta y ve lo suyo. El gimnasio deja de llevar
            la cuenta en planillas y cuadernos.
          </p>

          <div className="heroe__acciones">
            <Link to="/crear-cuenta" className="boton boton--principal boton--grande">
              Crear mi cuenta
            </Link>

            <Link to="/planes" className="boton boton--secundario boton--grande">
              Ver los planes
            </Link>
          </div>
        </div>

        <EstadoDeHoy sedes={sedes} />
      </section>

      <Servicios />
      <Planes />
      <Frases />
    </>
  );
}

/** Panel con los horarios de hoy de cada sucursal. */
function EstadoDeHoy({ sedes }) {
  const hoy = diaDeHoy();

  if (!sedes || sedes.length === 0) return null;

  return (
    <aside className="hoy">
      <p className="hoy__cabecera">Hoy es {nombreDeDia(hoy).toLowerCase()}</p>

      {sedes.map((sede) => (
        <HorarioDeSede key={sede.id} sede={sede} dia={hoy} />
      ))}
    </aside>
  );
}

function HorarioDeSede({ sede, dia }) {
  const { datos: franjas } = usePeticion(() => horarios.publicos(sede.id), [sede.id]);

  const deHoy = franjas?.find((franja) => franja.diaSemana === dia);
  const abierto = deHoy ? estaAbiertoAhora(deHoy.apertura, deHoy.cierre) : false;

  return (
    <div className="hoy__sede">
      <span>
        <span className="hoy__nombre">{sede.nombre}</span>
        <span className="hoy__direccion">{sede.direccion}</span>
      </span>

      {deHoy ? (
        <span className="hoy__horario">
          {abierto && <span className="hoy__senal" aria-hidden="true" />}
          {deHoy.apertura} a {deHoy.cierre}
        </span>
      ) : (
        <span className="hoy__horario hoy__cerrado">Cerrado</span>
      )}
    </div>
  );
}

/** Servicios que carga el gimnasio desde el panel. */
function Servicios() {
  const { datos } = usePeticion(() => sitioWeb.carouselPublico({ tipo: "servicios" }), []);

  if (!datos || datos.length === 0) return null;

  return (
    <section className="seccion" id="servicios">
      <h2 className="seccion__titulo">Lo que vas a encontrar</h2>
      <p className="seccion__bajada">Los servicios que ofrece el gimnasio.</p>

      <div className="servicios">
        {datos.map((item) => (
          <article key={item.id}>
            {item.imagen && (
              <img className="servicio__imagen" src={urlDeArchivo(item.imagen)} alt={item.titulo ?? ""} />
            )}

            <h3 className="servicio__titulo">{item.titulo}</h3>
            <p className="servicio__texto">{item.descripcion}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/** Planes con su precio. El precio es el dato que se compara: va como cifra. */
function Planes() {
  const { datos: listaDePlanes } = usePeticion(() => planes.publicos(), []);

  if (!listaDePlanes || listaDePlanes.length === 0) return null;

  return (
    <section className="seccion" id="planes">
      <h2 className="seccion__titulo">Planes</h2>
      <p className="seccion__bajada">Elegís el plan al crear tu cuenta y lo podés cambiar cuando quieras.</p>

      <div className="planes">
        {listaDePlanes.map((plan) => (
          <article className="plan" key={plan.id}>
            <h3 className="plan__nombre">{plan.nombre}</h3>

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
          </article>
        ))}
      </div>
    </section>
  );
}

/** Frases que carga el gimnasio. Se muestran como citas. */
function Frases() {
  const { datos } = usePeticion(() => sitioWeb.carouselPublico({ tipo: "frases" }), []);

  if (!datos || datos.length === 0) return null;

  return (
    <section className="seccion">
      <div className="frases">
        {datos.map((item) => (
          <blockquote className="frase" key={item.id}>
            <p className="frase__texto">{item.descripcion || item.titulo}</p>
            {item.descripcion && item.titulo && <p className="frase__autor">{item.titulo}</p>}
          </blockquote>
        ))}
      </div>
    </section>
  );
}
