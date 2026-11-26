import { useState } from "react";
import { Download, Dumbbell, Wand2 } from "lucide-react";

import { objetivos, rutinas, rutinasDeSocio } from "../../api/endpoints.js";
import { useSesion } from "../../contexto/SesionContexto.jsx";
import { usePeticion } from "../../hooks/usePeticion.js";
import { useAccion } from "../../hooks/useAccion.js";
import { fecha } from "../../dominio/formato.js";
import { descargarRutinaEnPdf } from "../../dominio/pdf.js";
import { EncabezadoDePagina } from "../../componentes/estructura/EncabezadoDePagina.jsx";
import { Boton } from "../../componentes/ui/Boton.jsx";
import { Campo, Seleccion } from "../../componentes/ui/Campo.jsx";
import { Panel } from "../../componentes/ui/Panel.jsx";
import { Dialogo } from "../../componentes/ui/Dialogo.jsx";
import { Aviso, AvisoDeError } from "../../componentes/ui/Aviso.jsx";
import { Insignia } from "../../componentes/ui/Insignia.jsx";
import { Cargando, EstadoVacio } from "../../componentes/ui/Estados.jsx";

/**
 * Caso de uso "Generar y guardar una rutina" desde la cuenta del socio.
 *
 * El flujo tiene dos etapas a propósito: primero se genera una propuesta que
 * el socio puede mirar, y sólo si le gusta la confirma. Así nunca se le
 * reemplaza la rutina vigente sin que lo haya decidido.
 */
export default function MiRutina() {
  const { usuario } = useSesion();

  const { datos: rutina, cargando, recargar } = usePeticion(() => rutinasDeSocio.mia(), []);
  const [propuesta, setPropuesta] = useState(null);
  const [generadorAbierto, setGeneradorAbierto] = useState(false);

  const nombreDelSocio = `${usuario?.nombre ?? ""} ${usuario?.apellido ?? ""}`.trim();

  return (
    <>
      <EncabezadoDePagina
        titulo="Mi rutina"
        descripcion="Tu plan de entrenamiento, día por día."
        acciones={
          <>
            {rutina && (
              <Boton
                icono={Download}
                onClick={() => descargarRutinaEnPdf(rutina, nombreDelSocio)}
              >
                Descargar en PDF
              </Boton>
            )}

            <Boton variante="principal" icono={Wand2} onClick={() => setGeneradorAbierto(true)}>
              {rutina ? "Generar otra rutina" : "Armar mi rutina"}
            </Boton>
          </>
        }
      />

      {cargando ? (
        <Cargando />
      ) : propuesta ? (
        <PropuestaDeRutina
          propuesta={propuesta}
          alDescartar={() => setPropuesta(null)}
          alGuardar={() => {
            setPropuesta(null);
            recargar();
          }}
        />
      ) : rutina ? (
        <RutinaVigente rutina={rutina} />
      ) : (
        <Panel>
          <EstadoVacio icono={Dumbbell} titulo="Todavía no tenés una rutina cargada.">
            <p>
              Podés generar una según tu objetivo en un minuto, o pedirle al entrenador
              de tu sucursal que te arme una.
            </p>

            <Boton variante="principal" icono={Wand2} onClick={() => setGeneradorAbierto(true)}>
              Armar mi rutina
            </Boton>
          </EstadoVacio>
        </Panel>
      )}

      <GeneradorDeRutina
        abierto={generadorAbierto}
        alCerrar={() => setGeneradorAbierto(false)}
        alGenerar={(dias) => {
          setPropuesta(dias);
          setGeneradorAbierto(false);
        }}
      />
    </>
  );
}

/** Muestra la rutina que el socio tiene vigente. */
function RutinaVigente({ rutina }) {
  return (
    <div className="pila">
      <div className="fila-separada">
        <div>
          <h2>{rutina.nombre}</h2>
          <p className="texto-tenue">
            Desde el {fecha(rutina.fechaInicio)}
            {rutina.entrenador ? ` · la armó ${rutina.entrenador}` : " · la armaste vos"}
            {rutina.plantilla ? ` · basada en "${rutina.plantilla}"` : ""}
          </p>
        </div>

        {rutina.activa && <Insignia tono="ok">Vigente</Insignia>}
      </div>

      <DiasDeRutina dias={rutina.dias} />
    </div>
  );
}

/** Propuesta generada, todavía sin guardar. */
function PropuestaDeRutina({ propuesta, alDescartar, alGuardar }) {
  const [nombre, setNombre] = useState("Mi rutina");
  const guardar = useAccion((datos) => rutinasDeSocio.guardarMia(datos));

  async function confirmar() {
    const datos = {
      nombre,
      dias: propuesta.map((dia) => ({
        dia: dia.dia,
        ejercicios: dia.ejercicios.map((ejercicio) => ({
          idEjercicio: ejercicio.idEjercicio,
          series: ejercicio.series,
          repeticiones: ejercicio.repeticiones,
          descansoSeg: ejercicio.descansoSeg,
        })),
      })),
    };

    if (await guardar.ejecutar(datos)) alGuardar();
  }

  return (
    <div className="pila">
      <Aviso tono="atencion" titulo="Esta rutina todavía no está guardada.">
        Revisala y confirmala. Si ya tenías una rutina, la anterior queda archivada en tu
        historial.
      </Aviso>

      <AvisoDeError error={guardar.error} />

      <Panel ajustado>
        <div className="fila-separada">
          <Campo
            etiqueta="Nombre de la rutina"
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
          />

          <div className="fila">
            <Boton variante="fantasma" onClick={alDescartar}>
              Descartar
            </Boton>

            <Boton variante="principal" enCurso={guardar.enCurso} onClick={confirmar}>
              Guardar esta rutina
            </Boton>
          </div>
        </div>
      </Panel>

      <DiasDeRutina dias={propuesta} />
    </div>
  );
}

/**
 * Los días de la rutina en columnas.
 *
 * Los ejercicios van numerados porque el orden importa: es la secuencia en la
 * que se ejecutan dentro de la sesión.
 */
export function DiasDeRutina({ dias }) {
  return (
    <div className="rutina">
      {dias.map((dia) => (
        <section className="rutina__dia" key={dia.dia}>
          <header className="rutina__cabecera">
            <span className="rutina__titulo">Día {dia.dia}</span>
            <span className="texto-tenue">{dia.ejercicios.length} ejercicios</span>
          </header>

          {dia.ejercicios.map((ejercicio) => (
            <div className="rutina__ejercicio" key={`${ejercicio.orden}-${ejercicio.idEjercicio}`}>
              <span className="rutina__orden">{ejercicio.orden}</span>

              <span className="crece">
                <span className="rutina__nombre">{ejercicio.ejercicio}</span>

                <span className="rutina__series">
                  {ejercicio.series ? `${ejercicio.series} series` : "series a definir"}
                  {ejercicio.repeticiones ? ` · ${ejercicio.repeticiones}` : ""}
                  {ejercicio.descansoSeg ? ` · ${ejercicio.descansoSeg} s de descanso` : ""}
                </span>

                {ejercicio.notas && <span className="rutina__series">{ejercicio.notas}</span>}
              </span>

              <span className="rutina__grupo">{ejercicio.grupo}</span>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

/** Diálogo que pide los parámetros y llama al generador del backend. */
function GeneradorDeRutina({ abierto, alCerrar, alGenerar }) {
  const { datos: listaDeObjetivos } = usePeticion(() => objetivos.listar(), []);
  const { datos: plantillas } = usePeticion(() => rutinas.listar(), []);

  const [idObjetivo, setIdObjetivo] = useState("");
  const [idPlantilla, setIdPlantilla] = useState("");
  const [diasPorSemana, setDiasPorSemana] = useState(3);
  const [ejerciciosPorDia, setEjerciciosPorDia] = useState(5);

  const generar = useAccion((datos) => rutinasDeSocio.generar(datos));

  async function ejecutar() {
    const dias = await generar.ejecutar({
      idPlantilla: idPlantilla ? Number(idPlantilla) : null,
      idObjetivo: idObjetivo ? Number(idObjetivo) : null,
      diasPorSemana: Number(diasPorSemana),
      ejerciciosPorDia: Number(ejerciciosPorDia),
    });

    if (dias) alGenerar(dias);
  }

  return (
    <Dialogo
      abierto={abierto}
      titulo="Armar una rutina"
      descripcion="Elegí una plantilla del gimnasio o dejá que el sistema la arme según tu objetivo."
      alCerrar={alCerrar}
      pie={
        <>
          <Boton variante="fantasma" onClick={alCerrar}>
            Cancelar
          </Boton>

          <Boton variante="principal" enCurso={generar.enCurso} onClick={ejecutar}>
            Generar la propuesta
          </Boton>
        </>
      }
    >
      <div className="pila">
        <AvisoDeError error={generar.error} />

        <Seleccion
          etiqueta="Plantilla del gimnasio"
          value={idPlantilla}
          onChange={(evento) => setIdPlantilla(evento.target.value)}
          vacio="Que la arme el sistema"
          ayuda="Las plantillas las preparan los entrenadores del gimnasio."
          opciones={(plantillas ?? []).map((plantilla) => ({
            valor: plantilla.id,
            texto: `${plantilla.nombre}${plantilla.diasPorSemana ? ` — ${plantilla.diasPorSemana} días` : ""}`,
          }))}
        />

        {!idPlantilla && (
          <>
            <Seleccion
              etiqueta="Mi objetivo"
              value={idObjetivo}
              onChange={(evento) => setIdObjetivo(evento.target.value)}
              vacio="Sin objetivo puntual"
              opciones={(listaDeObjetivos ?? []).map((objetivo) => ({
                valor: objetivo.id,
                texto: objetivo.nombre,
              }))}
            />

            <div className="rejilla-formulario">
              <Campo
                etiqueta="Días por semana"
                type="number"
                min={1}
                max={7}
                value={diasPorSemana}
                onChange={(evento) => setDiasPorSemana(evento.target.value)}
              />

              <Campo
                etiqueta="Ejercicios por día"
                type="number"
                min={1}
                max={15}
                value={ejerciciosPorDia}
                onChange={(evento) => setEjerciciosPorDia(evento.target.value)}
              />
            </div>
          </>
        )}
      </div>
    </Dialogo>
  );
}
