import { lazy, Suspense, useMemo, useRef, useState } from "react";
import { MapPin, MapPinned, Navigation } from "lucide-react";

import { horarios, sucursales } from "../../api/endpoints.js";
import { usePeticion } from "../../hooks/usePeticion.js";
import { useTitulo } from "../../hooks/useTitulo.js";
import { nombreDeDia } from "../../dominio/formato.js";
import {
  prefiereMenosMovimiento,
  tieneUbicacion,
  urlDeComoLlegar,
  urlDeGoogleMaps,
} from "../../dominio/mapas.js";
import { Cargando, EstadoVacio } from "../../componentes/ui/Estados.jsx";

/* MapLibre pesa unos 400 kB comprimidos y sólo se usa en esta pantalla: se descarga
   recién cuando se llega acá, para que el resto del sitio no cargue con ese peso. */
const MapaDeSucursales = lazy(() => import("../../componentes/app/MapaDeSucursales.jsx"));

/** Sucursales en un mapa grande, con su dirección y su grilla de horarios. */
export default function PaginaDeSucursales() {
  useTitulo("Sucursales");

  const { datos, cargando } = usePeticion(() => sucursales.publicas(), []);

  /* La sede elegida la comparten el mapa y la lista: tocar un pin resalta su tarjeta, y
     tocar "Ver en el mapa" en una tarjeta hace volar el mapa hasta su pin. */
  const [idActiva, setIdActiva] = useState(null);
  const zonaDelMapa = useRef(null);

  /* Sólo las que tienen coordenadas llevan pin; las demás aparecen igual en la lista.
     Se memoriza: el mapa vuelve a dibujar los pines cada vez que esta lista cambia de identidad. */
  const ubicadas = useMemo(() => (datos ?? []).filter(tieneUbicacion), [datos]);

  /** Elige la sede desde su tarjeta y sube a mostrar el mapa, que queda arriba de la lista. */
  function verEnElMapa(id) {
    setIdActiva(id);

    zonaDelMapa.current?.scrollIntoView({
      behavior: prefiereMenosMovimiento() ? "auto" : "smooth",
      block: "center",
    });
  }

  return (
    <section className="seccion" style={{ borderTop: "none" }}>
      <h1 className="seccion__titulo">Sucursales</h1>
      <p className="seccion__bajada">Elegís tu sede al crear la cuenta.</p>

      {cargando ? (
        <Cargando />
      ) : !datos || datos.length === 0 ? (
        <EstadoVacio titulo="Todavía no hay sucursales publicadas." />
      ) : (
        <>
          {ubicadas.length > 0 && (
            <div className="mapa-sedes" ref={zonaDelMapa}>
              <Suspense fallback={<Cargando texto="Cargando el mapa" />}>
                <MapaDeSucursales sedes={ubicadas} idActiva={idActiva} alElegir={setIdActiva} />
              </Suspense>
            </div>
          )}

          <div className="sedes">
            {datos.map((sede) => (
              <Sede
                key={sede.id}
                sede={sede}
                activa={sede.id === idActiva}
                alVerEnElMapa={tieneUbicacion(sede) ? () => verEnElMapa(sede.id) : undefined}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function Sede({ sede, activa, alVerEnElMapa }) {
  const { datos: franjas } = usePeticion(() => horarios.publicos(sede.id), [sede.id]);

  return (
    <article className={activa ? "sede sede--activa" : "sede"}>
      <h2 className="sede__nombre">{sede.nombre}</h2>
      <p className="texto-tenue">{sede.direccion}</p>

      <div className="sede__enlaces">
        {alVerEnElMapa && (
          <button type="button" className="sede__mapa" onClick={alVerEnElMapa}>
            <MapPinned size={14} />
            Ver en el mapa
          </button>
        )}

        <a
          className="sede__mapa"
          href={urlDeGoogleMaps(sede.direccion, sede.latitud, sede.longitud)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MapPin size={14} />
          Abrir en Google Maps
        </a>

        <a
          className="sede__mapa"
          href={urlDeComoLlegar(sede.direccion, sede.latitud, sede.longitud)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Navigation size={14} />
          Cómo llegar
        </a>
      </div>

      {franjas && franjas.length > 0 && (
        <table className="sede__tabla">
          <tbody>
            {franjas.map((franja) => (
              <tr key={franja.id}>
                <td>{nombreDeDia(franja.diaSemana)}</td>
                <td>
                  {franja.apertura} a {franja.cierre}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </article>
  );
}
