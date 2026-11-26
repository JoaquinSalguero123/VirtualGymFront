import { useState } from "react";
import { LineChart, Plus } from "lucide-react";

import { mediciones, socios } from "../../api/endpoints.js";
import { usePeticion } from "../../hooks/usePeticion.js";
import { useAccion } from "../../hooks/useAccion.js";
import { fecha, numero } from "../../dominio/formato.js";
import { EncabezadoDePagina } from "../../componentes/estructura/EncabezadoDePagina.jsx";
import { Boton } from "../../componentes/ui/Boton.jsx";
import { AreaDeTexto, Campo } from "../../componentes/ui/Campo.jsx";
import { Dialogo } from "../../componentes/ui/Dialogo.jsx";
import { Panel } from "../../componentes/ui/Panel.jsx";
import { Metrica } from "../../componentes/ui/Metrica.jsx";
import { AvisoDeError } from "../../componentes/ui/Aviso.jsx";
import { Cargando, EstadoVacio } from "../../componentes/ui/Estados.jsx";

/** Evolución física del socio a partir de sus mediciones. */
export default function MiProgreso() {
  const { datos, cargando, recargar } = usePeticion(() => mediciones.mias(), []);
  const { datos: ficha } = usePeticion(() => socios.miFicha().catch(() => ({ data: null })), []);

  const [cargandoNueva, setCargandoNueva] = useState(false);

  /* Las mediciones vienen de la más reciente a la más antigua. */
  const ultima = datos?.[0];
  const primera = datos?.[datos.length - 1];
  const hayComparacion = datos && datos.length > 1;

  return (
    <>
      <EncabezadoDePagina
        titulo="Mi progreso"
        descripcion="Las mediciones que te toma el equipo del gimnasio, o que cargás vos mismo."
        acciones={
          ficha && (
            <Boton variante="principal" icono={Plus} onClick={() => setCargandoNueva(true)}>
              Cargar medición
            </Boton>
          )
        }
      />

      <DialogoCargarMiMedicion
        key={cargandoNueva}
        abierto={cargandoNueva}
        idSocio={ficha?.id}
        alCerrar={() => setCargandoNueva(false)}
        alGuardar={() => {
          setCargandoNueva(false);
          recargar();
        }}
      />

      {cargando ? (
        <Cargando />
      ) : !datos || datos.length === 0 ? (
        <Panel>
          <EstadoVacio icono={LineChart} titulo="Todavía no tenés mediciones cargadas.">
            <p>
              Cargá tu peso con el botón de arriba, o pedile a tu entrenador o al
              nutricionista que te tome una medición: a partir de la segunda vas a poder
              ver tu evolución acá.
            </p>
          </EstadoVacio>
        </Panel>
      ) : (
        <div className="pila">
          <Panel
            titulo="Última medición"
            descripcion={`Tomada el ${fecha(ultima.fecha)}${ultima.registradoPor ? ` por ${ultima.registradoPor}` : ""}`}
          >
            <div className="progreso">
              <Metrica valor={`${numero(ultima.peso, 1)} kg`} etiqueta="Peso" acento />

              {ultima.grasaPct != null && (
                <Metrica valor={`${numero(ultima.grasaPct, 1)}%`} etiqueta="Grasa corporal" />
              )}

              {ultima.musculoPct != null && (
                <Metrica valor={`${numero(ultima.musculoPct, 1)}%`} etiqueta="Masa muscular" />
              )}

              {ultima.cintura != null && (
                <Metrica valor={`${numero(ultima.cintura, 1)} cm`} etiqueta="Cintura" />
              )}
            </div>
          </Panel>

          {hayComparacion && (
            <Panel
              titulo="Desde tu primera medición"
              descripcion={`Comparado con el ${fecha(primera.fecha)}`}
            >
              <div className="progreso">
                <Diferencia
                  etiqueta="Peso"
                  desde={primera.peso}
                  hasta={ultima.peso}
                  unidad="kg"
                  bajarEsBueno
                />

                <Diferencia
                  etiqueta="Grasa corporal"
                  desde={primera.grasaPct}
                  hasta={ultima.grasaPct}
                  unidad="%"
                  bajarEsBueno
                />

                <Diferencia
                  etiqueta="Masa muscular"
                  desde={primera.musculoPct}
                  hasta={ultima.musculoPct}
                  unidad="%"
                />

                <Diferencia
                  etiqueta="Cintura"
                  desde={primera.cintura}
                  hasta={ultima.cintura}
                  unidad="cm"
                  bajarEsBueno
                />
              </div>
            </Panel>
          )}

          <Panel titulo="Historial" sinRelleno>
            <div className="tabla-envoltorio">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th className="tabla__numero">Peso</th>
                    <th className="tabla__numero">Grasa</th>
                    <th className="tabla__numero">Músculo</th>
                    <th className="tabla__numero">Cintura</th>
                    <th>Observaciones</th>
                  </tr>
                </thead>

                <tbody>
                  {datos.map((medicion) => (
                    <tr key={medicion.id}>
                      <td className="tabla__principal">{fecha(medicion.fecha)}</td>
                      <td className="tabla__numero">{numero(medicion.peso, 1)} kg</td>
                      <td className="tabla__numero">
                        {medicion.grasaPct != null ? `${numero(medicion.grasaPct, 1)}%` : "—"}
                      </td>
                      <td className="tabla__numero">
                        {medicion.musculoPct != null ? `${numero(medicion.musculoPct, 1)}%` : "—"}
                      </td>
                      <td className="tabla__numero">
                        {medicion.cintura != null ? `${numero(medicion.cintura, 1)} cm` : "—"}
                      </td>
                      <td className="texto-tenue">{medicion.observaciones ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}
    </>
  );
}

/**
 * Diferencia entre dos mediciones.
 *
 * El color depende de la dirección deseada: bajar de peso o de grasa se marca
 * como bueno, y ganar músculo también, aunque vaya para el otro lado.
 */
function Diferencia({ etiqueta, desde, hasta, unidad, bajarEsBueno = false }) {
  if (desde == null || hasta == null) return null;

  const delta = hasta - desde;
  const sinCambio = Math.abs(delta) < 0.05;

  const tono = sinCambio ? "neutra" : (delta < 0) === bajarEsBueno ? "baja" : "sube";
  const signo = delta > 0 ? "+" : "";

  return (
    <div className="metrica">
      <span className={`metrica__valor metrica__valor--chico delta delta--${tono}`}>
        {sinCambio ? "Sin cambios" : `${signo}${numero(delta, 1)} ${unidad}`}
      </span>

      <span className="metrica__etiqueta">{etiqueta}</span>

      <span className="metrica__detalle">
        {numero(desde, 1)} → {numero(hasta, 1)} {unidad}
      </span>
    </div>
  );
}

const FORMULARIO_VACIO = {
  fecha: "",
  peso: "",
  grasaPct: "",
  musculoPct: "",
  cintura: "",
  cadera: "",
  pecho: "",
  brazo: "",
  pierna: "",
  observaciones: "",
};

const numeroOVacio = (valor) => (valor === "" ? null : Number(valor));

/**
 * Carga una medición propia.
 *
 * Usa el mismo endpoint que el entrenador o el nutricionista, sólo que acá
 * "idSocio" siempre es el del usuario autenticado: llevar el propio registro
 * entre visita y visita no debería depender de que alguien más lo cargue.
 */
function DialogoCargarMiMedicion({ abierto, idSocio, alCerrar, alGuardar }) {
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const guardar = useAccion((datos) => mediciones.crear(datos));

  const cambiar = (campo) => (evento) =>
    setFormulario({ ...formulario, [campo]: evento.target.value });

  async function confirmar() {
    const resultado = await guardar.ejecutar({
      idSocio,
      fecha: formulario.fecha || null,
      peso: Number(formulario.peso),
      grasaPct: numeroOVacio(formulario.grasaPct),
      musculoPct: numeroOVacio(formulario.musculoPct),
      cintura: numeroOVacio(formulario.cintura),
      cadera: numeroOVacio(formulario.cadera),
      pecho: numeroOVacio(formulario.pecho),
      brazo: numeroOVacio(formulario.brazo),
      pierna: numeroOVacio(formulario.pierna),
      observaciones: formulario.observaciones || null,
    });

    if (resultado) alGuardar();
  }

  return (
    <Dialogo
      abierto={abierto}
      titulo="Cargar una medición"
      descripcion="Sumá tu peso y lo que quieras medirte hoy."
      alCerrar={alCerrar}
      pie={
        <>
          <Boton variante="fantasma" onClick={alCerrar}>
            Cancelar
          </Boton>

          <Boton
            variante="principal"
            enCurso={guardar.enCurso}
            disabled={!formulario.peso}
            onClick={confirmar}
          >
            Guardar
          </Boton>
        </>
      }
    >
      <div className="pila">
        <AvisoDeError error={guardar.error} />

        <div className="rejilla-formulario">
          <Campo
            etiqueta="Fecha"
            type="date"
            value={formulario.fecha}
            onChange={cambiar("fecha")}
            ayuda="Dejalo vacío para usar la fecha de hoy"
          />

          <Campo
            etiqueta="Peso (kg)"
            type="number"
            min={0}
            step="0.1"
            value={formulario.peso}
            onChange={cambiar("peso")}
            required
          />

          <Campo
            etiqueta="Grasa corporal (%)"
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={formulario.grasaPct}
            onChange={cambiar("grasaPct")}
          />

          <Campo
            etiqueta="Masa muscular (%)"
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={formulario.musculoPct}
            onChange={cambiar("musculoPct")}
          />

          <Campo
            etiqueta="Cintura (cm)"
            type="number"
            min={0}
            step="0.1"
            value={formulario.cintura}
            onChange={cambiar("cintura")}
          />

          <Campo
            etiqueta="Cadera (cm)"
            type="number"
            min={0}
            step="0.1"
            value={formulario.cadera}
            onChange={cambiar("cadera")}
          />

          <Campo
            etiqueta="Pecho (cm)"
            type="number"
            min={0}
            step="0.1"
            value={formulario.pecho}
            onChange={cambiar("pecho")}
          />

          <Campo
            etiqueta="Brazo (cm)"
            type="number"
            min={0}
            step="0.1"
            value={formulario.brazo}
            onChange={cambiar("brazo")}
          />

          <Campo
            etiqueta="Pierna (cm)"
            type="number"
            min={0}
            step="0.1"
            value={formulario.pierna}
            onChange={cambiar("pierna")}
          />
        </div>

        <AreaDeTexto
          etiqueta="Observaciones"
          value={formulario.observaciones}
          onChange={cambiar("observaciones")}
          ancho
        />
      </div>
    </Dialogo>
  );
}
