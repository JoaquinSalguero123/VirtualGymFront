import { useState } from "react";
import { ClipboardList, Eye, Pencil, Plus, Trash2, X } from "lucide-react";

import { ejercicios, objetivos, rutinas } from "../../api/endpoints.js";
import { usePeticion } from "../../hooks/usePeticion.js";
import { useAccion } from "../../hooks/useAccion.js";
import { EncabezadoDePagina } from "../../componentes/estructura/EncabezadoDePagina.jsx";
import { Boton } from "../../componentes/ui/Boton.jsx";
import { AreaDeTexto, Campo, Seleccion } from "../../componentes/ui/Campo.jsx";
import { Panel } from "../../componentes/ui/Panel.jsx";
import { Tabla } from "../../componentes/ui/Tabla.jsx";
import { Dialogo, DialogoDeConfirmacion } from "../../componentes/ui/Dialogo.jsx";
import { Aviso, AvisoDeError } from "../../componentes/ui/Aviso.jsx";
import { Insignia } from "../../componentes/ui/Insignia.jsx";
import { Cargando, EstadoVacio } from "../../componentes/ui/Estados.jsx";
import { DiasDeRutina } from "../socio/MiRutina.jsx";

/**
 * Caso de uso "Administrar plantillas de rutinas".
 *
 * Las plantillas son las rutinas base que preparan los entrenadores y que
 * después los socios pueden tomar como punto de partida. Las que trae el
 * sistema son globales y no se pueden editar: se marcan como tales.
 */
export default function PlantillasDeRutina() {
  const [enEdicion, setEnEdicion] = useState(null);
  const [aVer, setAVer] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);

  const { datos, cargando, recargar } = usePeticion(() => rutinas.listar(), []);
  const { datos: listaDeObjetivos } = usePeticion(() => objetivos.listar(), []);
  const { datos: catalogo } = usePeticion(() => ejercicios.listar(), []);
  const darDeBaja = useAccion((id) => rutinas.darDeBaja(id));

  const columnas = [
    {
      clave: "nombre",
      titulo: "Plantilla",
      principal: true,
      celda: (plantilla) => (
        <>
          {plantilla.nombre}
          {plantilla.descripcion && (
            <span className="texto-tenue" style={{ display: "block" }}>
              {plantilla.descripcion}
            </span>
          )}
        </>
      ),
    },
    {
      clave: "origen",
      titulo: "Origen",
      celda: (plantilla) =>
        plantilla.esGlobal ? (
          <Insignia tono="contorno">Del sistema</Insignia>
        ) : (
          <Insignia tono="marca">Propia</Insignia>
        ),
    },
    {
      clave: "objetivo",
      titulo: "Objetivo",
      celda: (plantilla) => plantilla.objetivo ?? <span className="texto-tenue">—</span>,
    },
    {
      clave: "intensidad",
      titulo: "Intensidad",
      celda: (plantilla) => plantilla.intensidad ?? <span className="texto-tenue">—</span>,
    },
    {
      clave: "dias",
      titulo: "Días",
      numerica: true,
      celda: (plantilla) => plantilla.diasPorSemana ?? "—",
    },
    {
      clave: "acciones",
      titulo: "",
      acciones: true,
      celda: (plantilla) => (
        <div className="fila" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
          <Boton
            variante="fantasma"
            soloIcono
            title="Ver el detalle"
            aria-label={`Ver ${plantilla.nombre}`}
            onClick={() => setAVer(plantilla.id)}
          >
            <Eye size={15} />
          </Boton>

          <Boton
            variante="fantasma"
            soloIcono
            title={plantilla.esGlobal ? "Las plantillas del sistema no se editan" : "Editar"}
            aria-label={`Editar ${plantilla.nombre}`}
            disabled={plantilla.esGlobal}
            onClick={() => setEnEdicion(plantilla.id)}
          >
            <Pencil size={15} />
          </Boton>

          <Boton
            variante="fantasma"
            soloIcono
            title={plantilla.esGlobal ? "Las plantillas del sistema no se dan de baja" : "Dar de baja"}
            aria-label={`Dar de baja ${plantilla.nombre}`}
            disabled={plantilla.esGlobal}
            onClick={() => setAEliminar(plantilla)}
          >
            <Trash2 size={15} />
          </Boton>
        </div>
      ),
    },
  ];

  return (
    <>
      <EncabezadoDePagina
        titulo="Plantillas de rutina"
        descripcion="Rutinas base que los socios pueden tomar como punto de partida."
        acciones={
          <Boton variante="principal" icono={Plus} onClick={() => setEnEdicion("nueva")}>
            Nueva plantilla
          </Boton>
        }
      />

      <div className="pila">
        <AvisoDeError error={darDeBaja.error} />

        <Panel sinRelleno>
          <Tabla
            columnas={columnas}
            filas={datos}
            cargando={cargando}
            vacio={
              <EstadoVacio
                icono={ClipboardList}
                titulo="No hay plantillas disponibles."
                accion={{
                  texto: "Crear la primera",
                  icono: Plus,
                  onClick: () => setEnEdicion("nueva"),
                }}
              >
                <p>
                  Una plantilla le ahorra trabajo al socio: en vez de armar la rutina desde
                  cero, arranca de una que preparaste vos.
                </p>
              </EstadoVacio>
            }
          />
        </Panel>
      </div>

      <DetalleDePlantilla idPlantilla={aVer} alCerrar={() => setAVer(null)} />

      {/* Se monta sólo mientras está abierto: así cada apertura arranca con el
          formulario y los errores limpios, sin arrastrar nada de la anterior. */}
      {enEdicion !== null && (
        <EditorDePlantilla
          key={enEdicion}
          idPlantilla={enEdicion}
          objetivosDisponibles={listaDeObjetivos ?? []}
          ejerciciosDisponibles={catalogo ?? []}
          alCerrar={() => setEnEdicion(null)}
          alGuardar={() => {
            setEnEdicion(null);
            recargar();
          }}
        />
      )}

      <DialogoDeConfirmacion
        abierto={aEliminar !== null}
        titulo="Dar de baja la plantilla"
        mensaje={`"${aEliminar?.nombre}" deja de ofrecerse. Las rutinas que ya salieron de ella siguen funcionando.`}
        textoDeAccion="Dar de baja"
        peligrosa
        enCurso={darDeBaja.enCurso}
        alCerrar={() => setAEliminar(null)}
        alConfirmar={async () => {
          if (await darDeBaja.ejecutar(aEliminar.id)) {
            setAEliminar(null);
            recargar();
          }
        }}
      />
    </>
  );
}

/** Vista de sólo lectura del detalle de una plantilla. */
function DetalleDePlantilla({ idPlantilla, alCerrar }) {
  const { datos, cargando } = usePeticion(
    () => (idPlantilla ? rutinas.obtener(idPlantilla) : Promise.resolve({ data: null })),
    [idPlantilla],
  );

  return (
    <Dialogo
      abierto={idPlantilla !== null}
      titulo={datos?.nombre ?? "Plantilla"}
      descripcion={datos?.descripcion}
      ancho
      alCerrar={alCerrar}
      pie={
        <Boton variante="secundario" onClick={alCerrar}>
          Cerrar
        </Boton>
      }
    >
      {cargando ? (
        <Cargando />
      ) : datos?.dias.length === 0 ? (
        <EstadoVacio titulo="Esta plantilla todavía no tiene ejercicios cargados." />
      ) : (
        datos && <DiasDeRutina dias={datos.dias} />
      )}
    </Dialogo>
  );
}

/** Estado inicial del editor: en blanco para una plantilla nueva, o una copia de la existente. */
function armarFormulario(plantilla) {
  if (!plantilla) {
    return {
      nombre: "",
      descripcion: "",
      intensidad: "",
      idObjetivo: "",
      diasPorSemana: 3,
      ejerciciosPorDia: 5,
      dias: [{ dia: 1, ejercicios: [] }],
    };
  }

  return {
    nombre: plantilla.nombre,
    descripcion: plantilla.descripcion ?? "",
    intensidad: plantilla.intensidad ?? "",
    idObjetivo: plantilla.idObjetivo ?? "",
    diasPorSemana: plantilla.diasPorSemana ?? plantilla.dias.length,
    ejerciciosPorDia: plantilla.ejerciciosPorDia ?? 5,
    dias: plantilla.dias.map((dia) => ({
      dia: dia.dia,
      ejercicios: dia.ejercicios.map((ejercicio) => ({
        idEjercicio: ejercicio.idEjercicio,
        nombre: ejercicio.ejercicio,
        series: ejercicio.series ?? "",
        repeticiones: ejercicio.repeticiones ?? "",
        descansoSeg: ejercicio.descansoSeg ?? "",
      })),
    })),
  };
}

/**
 * Trae la plantilla a editar y recién cuando la tiene dibuja el formulario, así
 * éste nace con los datos correctos y no hace falta sincronizarlo después.
 */
function EditorDePlantilla({
  idPlantilla,
  objetivosDisponibles,
  ejerciciosDisponibles,
  alCerrar,
  alGuardar,
}) {
  const esNueva = idPlantilla === "nueva";

  const { datos: plantilla, error } = usePeticion(
    () => (esNueva ? Promise.resolve({ data: null }) : rutinas.obtener(idPlantilla)),
    [idPlantilla],
  );

  if (!esNueva && !plantilla) {
    return (
      <Dialogo
        abierto
        titulo={error ? "No se pudo cargar la plantilla" : "Cargando la plantilla"}
        alCerrar={alCerrar}
      >
        {error ? <AvisoDeError error={error} /> : <Cargando />}
      </Dialogo>
    );
  }

  return (
    <FormularioDePlantilla
      idPlantilla={idPlantilla}
      plantilla={plantilla}
      objetivosDisponibles={objetivosDisponibles}
      ejerciciosDisponibles={ejerciciosDisponibles}
      alCerrar={alCerrar}
      alGuardar={alGuardar}
    />
  );
}

/**
 * Formulario de la plantilla.
 *
 * El detalle se reemplaza completo al guardar, igual que hace el backend, así
 * que el formulario trabaja sobre una copia en memoria y recién al confirmar la
 * manda entera.
 */
function FormularioDePlantilla({
  idPlantilla,
  plantilla,
  objetivosDisponibles,
  ejerciciosDisponibles,
  alCerrar,
  alGuardar,
}) {
  const esNueva = idPlantilla === "nueva";

  const [formulario, setFormulario] = useState(() => armarFormulario(plantilla));

  const guardar = useAccion((id, datos) =>
    id && id !== "nueva" ? rutinas.actualizar(id, datos) : rutinas.crear(datos),
  );

  const cambiar = (campo) => (evento) =>
    setFormulario({ ...formulario, [campo]: evento.target.value });

  const agregarDia = () =>
    setFormulario({
      ...formulario,
      dias: [...formulario.dias, { dia: formulario.dias.length + 1, ejercicios: [] }],
    });

  const quitarDia = (indice) =>
    setFormulario({
      ...formulario,
      dias: formulario.dias
        .filter((_, i) => i !== indice)
        .map((dia, i) => ({ ...dia, dia: i + 1 })),
    });

  const agregarEjercicio = (indiceDia, idEjercicio) => {
    const elegido = ejerciciosDisponibles.find((e) => String(e.id) === String(idEjercicio));
    if (!elegido) return;

    const dias = formulario.dias.map((dia, i) =>
      i === indiceDia
        ? {
            ...dia,
            ejercicios: [
              ...dia.ejercicios,
              {
                idEjercicio: elegido.id,
                nombre: elegido.nombre,
                series: 3,
                repeticiones: "10-12",
                descansoSeg: 90,
              },
            ],
          }
        : dia,
    );

    setFormulario({ ...formulario, dias });
  };

  const quitarEjercicio = (indiceDia, indiceEjercicio) => {
    const dias = formulario.dias.map((dia, i) =>
      i === indiceDia
        ? { ...dia, ejercicios: dia.ejercicios.filter((_, j) => j !== indiceEjercicio) }
        : dia,
    );

    setFormulario({ ...formulario, dias });
  };

  async function confirmar() {
    const datos = {
      nombre: formulario.nombre,
      descripcion: formulario.descripcion || null,
      intensidad: formulario.intensidad || null,
      idObjetivo: formulario.idObjetivo ? Number(formulario.idObjetivo) : null,
      diasPorSemana: Number(formulario.diasPorSemana) || null,
      ejerciciosPorDia: Number(formulario.ejerciciosPorDia) || null,
      dias: formulario.dias.map((dia) => ({
        dia: dia.dia,
        ejercicios: dia.ejercicios.map((ejercicio) => ({
          idEjercicio: ejercicio.idEjercicio,
          series: ejercicio.series ? Number(ejercicio.series) : null,
          repeticiones: ejercicio.repeticiones || null,
          descansoSeg: ejercicio.descansoSeg ? Number(ejercicio.descansoSeg) : null,
        })),
      })),
    };

    if (await guardar.ejecutar(idPlantilla, datos)) alGuardar();
  }

  return (
    <Dialogo
      abierto
      titulo={esNueva ? "Nueva plantilla de rutina" : "Editar la plantilla"}
      descripcion="Al guardar, el detalle reemplaza por completo al anterior."
      ancho
      alCerrar={alCerrar}
      pie={
        <>
          <Boton variante="fantasma" onClick={alCerrar}>
            Cancelar
          </Boton>

          <Boton
            variante="principal"
            enCurso={guardar.enCurso}
            disabled={!formulario.nombre}
            onClick={confirmar}
          >
            {esNueva ? "Crear la plantilla" : "Guardar cambios"}
          </Boton>
        </>
      }
    >
      <div className="pila">
        <AvisoDeError error={guardar.error} />

        <Campo etiqueta="Nombre" value={formulario.nombre} onChange={cambiar("nombre")} required />

        <AreaDeTexto
          etiqueta="Descripción"
          value={formulario.descripcion}
          onChange={cambiar("descripcion")}
          placeholder="Para quién es y qué busca lograr"
          ancho
        />

        <div className="rejilla-formulario">
          <Seleccion
            etiqueta="Objetivo"
            value={formulario.idObjetivo}
            onChange={cambiar("idObjetivo")}
            vacio="Sin objetivo puntual"
            opciones={objetivosDisponibles.map((o) => ({ valor: o.id, texto: o.nombre }))}
          />

          <Seleccion
            etiqueta="Intensidad"
            value={formulario.intensidad}
            onChange={cambiar("intensidad")}
            vacio="Sin definir"
            opciones={["Baja", "Media", "Alta"].map((nivel) => ({ valor: nivel, texto: nivel }))}
          />

          <Campo
            etiqueta="Días por semana"
            type="number"
            min={1}
            max={7}
            value={formulario.diasPorSemana}
            onChange={cambiar("diasPorSemana")}
          />

          <Campo
            etiqueta="Ejercicios por día"
            type="number"
            min={1}
            max={20}
            value={formulario.ejerciciosPorDia}
            onChange={cambiar("ejerciciosPorDia")}
          />
        </div>

        {formulario.dias.length === 0 ? (
          <Aviso tono="atencion">
            La plantilla no tiene días cargados. Agregá al menos uno.
          </Aviso>
        ) : (
          <div className="pila-corta">
            {formulario.dias.map((dia, indiceDia) => (
              <div className="editor-dia" key={indiceDia}>
                <div className="fila-separada" style={{ marginBottom: "var(--e-corto)" }}>
                  <strong>Día {dia.dia}</strong>

                  <Boton
                    variante="fantasma"
                    soloIcono
                    aria-label={`Quitar el día ${dia.dia}`}
                    onClick={() => quitarDia(indiceDia)}
                  >
                    <Trash2 size={14} />
                  </Boton>
                </div>

                {dia.ejercicios.map((ejercicio, indiceEjercicio) => (
                  <div className="editor-dia__fila" key={indiceEjercicio}>
                    <span className="rutina__orden">{indiceEjercicio + 1}</span>
                    <span className="editor-dia__nombre">{ejercicio.nombre}</span>

                    <input
                      className="campo__control"
                      style={{ width: 62 }}
                      type="number"
                      min={1}
                      value={ejercicio.series}
                      aria-label="Series"
                      title="Series"
                      onChange={(evento) => {
                        const dias = [...formulario.dias];
                        dias[indiceDia].ejercicios[indiceEjercicio].series = evento.target.value;
                        setFormulario({ ...formulario, dias });
                      }}
                    />

                    <input
                      className="campo__control"
                      style={{ width: 86 }}
                      value={ejercicio.repeticiones}
                      aria-label="Repeticiones"
                      title="Repeticiones"
                      onChange={(evento) => {
                        const dias = [...formulario.dias];
                        dias[indiceDia].ejercicios[indiceEjercicio].repeticiones = evento.target.value;
                        setFormulario({ ...formulario, dias });
                      }}
                    />

                    <Boton
                      variante="fantasma"
                      soloIcono
                      aria-label={`Quitar ${ejercicio.nombre}`}
                      onClick={() => quitarEjercicio(indiceDia, indiceEjercicio)}
                    >
                      <X size={14} />
                    </Boton>
                  </div>
                ))}

                <select
                  className="campo__control"
                  style={{ marginTop: "var(--e-corto)" }}
                  value=""
                  aria-label={`Agregar un ejercicio al día ${dia.dia}`}
                  onChange={(evento) => {
                    agregarEjercicio(indiceDia, evento.target.value);
                    evento.target.value = "";
                  }}
                >
                  <option value="">Agregar un ejercicio</option>

                  {ejerciciosDisponibles.map((ejercicio) => (
                    <option key={ejercicio.id} value={ejercicio.id}>
                      {ejercicio.nombre} — {ejercicio.grupo}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        <Boton icono={Plus} onClick={agregarDia}>
          Agregar un día
        </Boton>
      </div>
    </Dialogo>
  );
}
