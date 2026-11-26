import { useState } from "react";
import { CalendarCheck, LogOut } from "lucide-react";

import { asistencias } from "../../api/endpoints.js";
import { usePeticion } from "../../hooks/usePeticion.js";
import { useAccion } from "../../hooks/useAccion.js";
import { fechaYHora, hora, mesesDelAnio, nombreDeMes } from "../../dominio/formato.js";
import { EncabezadoDePagina } from "../../componentes/estructura/EncabezadoDePagina.jsx";
import { Boton } from "../../componentes/ui/Boton.jsx";
import { Seleccion } from "../../componentes/ui/Campo.jsx";
import { Panel } from "../../componentes/ui/Panel.jsx";
import { Metrica } from "../../componentes/ui/Metrica.jsx";
import { Aviso, AvisoDeError } from "../../componentes/ui/Aviso.jsx";
import { Cargando, EstadoVacio } from "../../componentes/ui/Estados.jsx";
import { CalendarioDelMes } from "../../componentes/app/CalendarioDelMes.jsx";

/** Casos de uso "Registrar asistencia" y "Consultar asistencias del mes". */
export default function MisAsistencias() {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);

  const { datos, cargando, recargar } = usePeticion(
    () => asistencias.mias({ anio, mes }),
    [anio, mes],
  );

  const marcar = useAccion(() => asistencias.marcar());
  const salir = useAccion(() => asistencias.registrarSalida());

  const hoyISO = hoy.toISOString().slice(0, 10);
  const deHoy = datos?.find((asistencia) => asistencia.fecha === hoyISO);
  const esElMesActual = anio === hoy.getFullYear() && mes === hoy.getMonth() + 1;

  const diasAsistidos = (datos ?? []).map((asistencia) => asistencia.dia);

  return (
    <>
      <EncabezadoDePagina
        titulo="Mis asistencias"
        descripcion="Marcá tu entrada al llegar y consultá tu historial del mes."
        acciones={
          <>
            <Seleccion
              value={mes}
              onChange={(evento) => setMes(Number(evento.target.value))}
              opciones={mesesDelAnio().map((m) => ({ valor: m.numero, texto: m.nombre }))}
            />

            <Seleccion
              value={anio}
              onChange={(evento) => setAnio(Number(evento.target.value))}
              opciones={[hoy.getFullYear(), hoy.getFullYear() - 1].map((a) => ({
                valor: a,
                texto: a,
              }))}
            />
          </>
        }
      />

      <div className="pila">
        {esElMesActual && (
          <div className="accion-rapida">
            <span className="accion-rapida__texto">
              {deHoy
                ? `Entraste hoy a las ${hora(deHoy.fechaHoraEntrada)}`
                : "Todavía no marcaste tu entrada de hoy"}

              <span className="accion-rapida__detalle">
                {deHoy?.fechaHoraSalida
                  ? `Salida registrada a las ${hora(deHoy.fechaHoraSalida)} · ${deHoy.minutosEnElGimnasio} minutos`
                  : deHoy
                    ? "Cuando te vayas podés registrar la salida"
                    : "Se puede marcar una sola vez por día"}
              </span>
            </span>

            {!deHoy ? (
              <Boton
                variante="principal"
                icono={CalendarCheck}
                enCurso={marcar.enCurso}
                onClick={async () => {
                  if (await marcar.ejecutar()) recargar();
                }}
              >
                Marcar entrada
              </Boton>
            ) : (
              !deHoy.fechaHoraSalida && (
                <Boton
                  variante="principal"
                  icono={LogOut}
                  enCurso={salir.enCurso}
                  onClick={async () => {
                    if (await salir.ejecutar()) recargar();
                  }}
                >
                  Registrar salida
                </Boton>
              )
            )}
          </div>
        )}

        <AvisoDeError error={marcar.error} />
        <AvisoDeError error={salir.error} />

        {cargando ? (
          <Cargando />
        ) : (
          <div className="tablero__columnas">
            <Panel titulo={`${nombreDeMes(mes)} de ${anio}`}>
              {diasAsistidos.length === 0 ? (
                <EstadoVacio icono={CalendarCheck} titulo="No hay asistencias en este mes.">
                  <p>
                    {esElMesActual
                      ? "Marcá tu entrada cuando llegues al gimnasio y va a aparecer acá."
                      : "Probá con otro mes."}
                  </p>
                </EstadoVacio>
              ) : (
                <div className="pila">
                  <CalendarioDelMes anio={anio} mes={mes} diasMarcados={diasAsistidos} />

                  <div className="fila" style={{ gap: "var(--e-generoso)" }}>
                    <Metrica valor={diasAsistidos.length} etiqueta="Días entrenados" acento chica />
                    <Metrica
                      valor={`${Math.round((diasAsistidos.length / new Date(anio, mes, 0).getDate()) * 100)}%`}
                      etiqueta="Del mes"
                      chica
                    />
                  </div>
                </div>
              )}
            </Panel>

            {datos && datos.length > 0 && (
              <Panel titulo="Detalle" sinRelleno>
                <div className="tabla-envoltorio">
                  <table className="tabla tabla--compacta">
                    <thead>
                      <tr>
                        <th>Entrada</th>
                        <th>Salida</th>
                        <th className="tabla__numero">Minutos</th>
                      </tr>
                    </thead>

                    <tbody>
                      {datos.map((asistencia) => (
                        <tr key={asistencia.id}>
                          <td>{fechaYHora(asistencia.fechaHoraEntrada)}</td>
                          <td>{asistencia.fechaHoraSalida ? hora(asistencia.fechaHoraSalida) : "—"}</td>
                          <td className="tabla__numero">{asistencia.minutosEnElGimnasio ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            )}
          </div>
        )}

        {!esElMesActual && (
          <Aviso tono="info">
            Estás viendo un mes pasado. Para marcar asistencia volvé al mes actual.
          </Aviso>
        )}
      </div>
    </>
  );
}
