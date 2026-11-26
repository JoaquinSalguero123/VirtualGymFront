import { useState } from "react";

import { mediciones } from "../../api/endpoints.js";
import { usePeticion } from "../../hooks/usePeticion.js";
import { useAccion } from "../../hooks/useAccion.js";
import { fecha, numero } from "../../dominio/formato.js";
import { Boton } from "../../componentes/ui/Boton.jsx";
import { AreaDeTexto, Campo } from "../../componentes/ui/Campo.jsx";
import { Dialogo } from "../../componentes/ui/Dialogo.jsx";
import { AvisoDeError } from "../../componentes/ui/Aviso.jsx";

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
 * Caso de uso "el entrenador o el nutricionista le toma una medición a un socio".
 *
 * Muestra las últimas mediciones cargadas para tener contexto y, debajo, el
 * formulario para sumar una nueva. El padre monta este diálogo con
 * key={idDelSocio}, así que arranca en blanco sin necesitar un efecto que lo
 * resetee a mano.
 */
export default function DialogoCargarMedicion({ socio, alCerrar, alGuardar }) {
  const { datos: historial, recargar } = usePeticion(
    () => (socio ? mediciones.deSocio(socio.id) : Promise.resolve({ data: [] })),
    [socio?.id],
  );

  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const guardar = useAccion((datos) => mediciones.crear(datos));

  if (!socio) return <Dialogo abierto={false} alCerrar={alCerrar} titulo="" />;

  const cambiar = (campo) => (evento) =>
    setFormulario({ ...formulario, [campo]: evento.target.value });

  async function confirmar() {
    const resultado = await guardar.ejecutar({
      idSocio: socio.id,
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

    if (!resultado) return;

    setFormulario(FORMULARIO_VACIO);
    recargar();
    alGuardar();
  }

  const ultima = historial?.[0];

  return (
    <Dialogo
      abierto
      titulo={`Medición de ${socio.nombreCompleto}`}
      descripcion={
        ultima
          ? `Última carga: ${fecha(ultima.fecha)}, ${numero(ultima.peso, 1)} kg${ultima.registradoPor ? ` (${ultima.registradoPor})` : ""}.`
          : "Todavía no tiene mediciones cargadas."
      }
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
            Guardar medición
          </Boton>
        </>
      }
    >
      <div className="pila">
        <AvisoDeError error={guardar.error} />

        {historial && historial.length > 0 && (
          <div className="tabla-envoltorio">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th className="tabla__numero">Peso</th>
                  <th className="tabla__numero">Grasa</th>
                  <th className="tabla__numero">Músculo</th>
                  <th>Cargada por</th>
                </tr>
              </thead>

              <tbody>
                {historial.slice(0, 5).map((medicion) => (
                  <tr key={medicion.id}>
                    <td className="tabla__principal">{fecha(medicion.fecha)}</td>
                    <td className="tabla__numero">{numero(medicion.peso, 1)} kg</td>
                    <td className="tabla__numero">
                      {medicion.grasaPct != null ? `${numero(medicion.grasaPct, 1)}%` : "—"}
                    </td>
                    <td className="tabla__numero">
                      {medicion.musculoPct != null ? `${numero(medicion.musculoPct, 1)}%` : "—"}
                    </td>
                    <td className="texto-tenue">{medicion.registradoPor ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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
          placeholder="Contexto de la medición, lesiones, lo que sea útil para la próxima"
          ancho
        />
      </div>
    </Dialogo>
  );
}
