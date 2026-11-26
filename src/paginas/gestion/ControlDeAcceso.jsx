import { useState } from "react";
import { CalendarCheck } from "lucide-react";

import { asistencias, socios } from "../../api/endpoints.js";
import { useSesion } from "../../contexto/SesionContexto.jsx";
import { usePeticion } from "../../hooks/usePeticion.js";
import { useAccion } from "../../hooks/useAccion.js";
import { mesesDelAnio, nombreDeMes, numero } from "../../dominio/formato.js";
import { ROLES } from "../../dominio/roles.js";
import { EncabezadoDePagina } from "../../componentes/estructura/EncabezadoDePagina.jsx";
import { Boton } from "../../componentes/ui/Boton.jsx";
import { Buscador } from "../../componentes/ui/Buscador.jsx";
import { Seleccion } from "../../componentes/ui/Campo.jsx";
import { Panel } from "../../componentes/ui/Panel.jsx";
import { Metrica } from "../../componentes/ui/Metrica.jsx";
import { Pestanas } from "../../componentes/ui/Pestanas.jsx";
import { AvisoDeError } from "../../componentes/ui/Aviso.jsx";
import { EstadoDeSocio, Insignia } from "../../componentes/ui/Insignia.jsx";
import { Cargando, EstadoVacio } from "../../componentes/ui/Estados.jsx";

/**
 * Casos de uso "Registrar asistencia" desde el mostrador y "Ver la grilla de
 * asistencias del mes".
 *
 * La pestaña de mostrador está pensada para usarse con el socio enfrente: se
 * busca por nombre y se marca la entrada con un clic.
 */
export default function ControlDeAcceso() {
  const { tieneRol } = useSesion();
  const puedeMarcar = tieneRol(ROLES.recepcionista, ROLES.administrador);

  const [pestana, setPestana] = useState(puedeMarcar ? "mostrador" : "grilla");

  const { datos: concurrencia, recargar: recargarConcurrencia } = usePeticion(
    () => asistencias.resumen(),
    [],
  );

  return (
    <>
      <EncabezadoDePagina
        titulo="Control de acceso"
        descripcion="Entradas del día y asistencias del mes en la sucursal activa."
      />

      <div className="pila">
        {concurrencia && (
          <div className="tablero__cifras">
            <Metrica
              valor={numero(concurrencia.sociosDistintosHoy)}
              etiqueta="Vinieron hoy"
              acento
            />
            <Metrica
              valor={numero(concurrencia.sociosEnElGimnasio)}
              etiqueta="Están en el gimnasio"
              detalle="Entraron y no registraron salida"
            />
            <Metrica
              valor={numero(concurrencia.asistenciasDelMes)}
              etiqueta="Asistencias del mes"
            />
            <Metrica
              valor={numero(concurrencia.promedioPorSocioEnElMes, 1)}
              etiqueta="Promedio por socio"
              detalle="Días entrenados en el mes"
            />
          </div>
        )}

        <Pestanas
          activa={pestana}
          alCambiar={setPestana}
          pestanas={[
            ...(puedeMarcar ? [{ clave: "mostrador", texto: "Marcar entrada" }] : []),
            { clave: "grilla", texto: "Grilla del mes" },
          ]}
        />

        {pestana === "mostrador" && <Mostrador alMarcar={recargarConcurrencia} />}
        {pestana === "grilla" && <GrillaDeAsistencias />}
      </div>
    </>
  );
}

/** Búsqueda de socio y marcado de entrada. */
function Mostrador({ alMarcar }) {
  const [texto, setTexto] = useState("");

  const { datos, cargando, recargar } = usePeticion(
    () => socios.listar({ texto: texto || undefined, soloActivos: true, tamanioPagina: 12 }),
    [texto],
  );

  const marcar = useAccion((idSocio) => asistencias.marcarParaSocio(idSocio));

  return (
    <div className="pila">
      <AvisoDeError error={marcar.error} />

      <Panel ajustado>
        <Buscador
          valor={texto}
          alCambiar={setTexto}
          marcador="Buscar el socio por nombre, email o número"
        />
      </Panel>

      {cargando ? (
        <Cargando />
      ) : datos?.items.length === 0 ? (
        <Panel>
          <EstadoVacio icono={CalendarCheck} titulo="No se encontró ningún socio.">
            <p>Probá con el apellido o con el número de socio.</p>
          </EstadoVacio>
        </Panel>
      ) : (
        <Panel sinRelleno>
          <div className="pila-corta" style={{ padding: "var(--e-normal) var(--e-amplio)" }}>
            {datos?.items.map((socio) => (
              <div className="fila-separada" key={socio.id}>
                <div>
                  <span className="tabla__principal">{socio.nombreCompleto}</span>
                  <span className="texto-tenue" style={{ display: "block" }}>
                    {socio.numeroSocio ? `N.º ${socio.numeroSocio} · ` : ""}
                    {socio.planActivo ?? "sin plan"}
                  </span>
                </div>

                <div className="fila">
                  <EstadoDeSocio estado={socio.estado} />

                  {socio.cuotaAlDia ? (
                    <Insignia tono="ok">Cuota al día</Insignia>
                  ) : (
                    <Insignia tono="alerta">Debe la cuota</Insignia>
                  )}

                  <Boton
                    variante="principal"
                    icono={CalendarCheck}
                    enCurso={marcar.enCurso}
                    onClick={async () => {
                      if (await marcar.ejecutar(socio.id)) {
                        recargar();
                        alMarcar();
                      }
                    }}
                  >
                    Marcar entrada
                  </Boton>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

/** Grilla mensual: un renglón por socio con los días que asistió. */
function GrillaDeAsistencias() {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);

  const { datos, cargando } = usePeticion(
    () => asistencias.grillaMensual({ anio, mes }),
    [anio, mes],
  );

  const diasEnElMes = new Date(anio, mes, 0).getDate();

  return (
    <div className="pila">
      <Panel ajustado>
        <div className="filtros">
          <Seleccion
            etiqueta="Mes"
            value={mes}
            onChange={(evento) => setMes(Number(evento.target.value))}
            opciones={mesesDelAnio().map((m) => ({ valor: m.numero, texto: m.nombre }))}
          />

          <Seleccion
            etiqueta="Año"
            value={anio}
            onChange={(evento) => setAnio(Number(evento.target.value))}
            opciones={[hoy.getFullYear(), hoy.getFullYear() - 1].map((a) => ({
              valor: a,
              texto: a,
            }))}
          />
        </div>
      </Panel>

      {cargando ? (
        <Cargando />
      ) : !datos || datos.length === 0 ? (
        <Panel>
          <EstadoVacio icono={CalendarCheck} titulo="Todavía no hay socios en esta sucursal." />
        </Panel>
      ) : (
        <Panel sinRelleno>
          <div className="tabla-envoltorio">
            <table className="tabla grilla-anual">
              <thead>
                <tr>
                  <th>Socio</th>

                  {Array.from({ length: diasEnElMes }, (_, indice) => (
                    <th key={indice} style={{ textAlign: "center" }}>
                      {indice + 1}
                    </th>
                  ))}

                  <th className="tabla__numero">Total</th>
                </tr>
              </thead>

              <tbody>
                {datos.map((fila) => {
                  const asistidos = new Set(fila.diasAsistidos);

                  return (
                    <tr key={fila.idSocio}>
                      <td className="tabla__principal">{fila.socio}</td>

                      {Array.from({ length: diasEnElMes }, (_, indice) => {
                        const dia = indice + 1;
                        const vino = asistidos.has(dia);

                        return (
                          <td key={dia} style={{ padding: 2 }}>
                            <span
                              className={`grilla-anual__celda grilla-anual__celda--${vino ? "pagado" : "vacio"}`}
                              title={`${nombreDeMes(mes)} ${dia}: ${vino ? "asistió" : "no vino"}`}
                            >
                              {vino ? "·" : ""}
                            </span>
                          </td>
                        );
                      })}

                      <td className="tabla__numero">{fila.total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}
