import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";

import { ejercicios, rutinas, rutinasDeSocio } from "../../api/endpoints.js";
import { usePeticion } from "../../hooks/usePeticion.js";
import { useAccion } from "../../hooks/useAccion.js";
import { fecha } from "../../dominio/formato.js";
import { Boton } from "../../componentes/ui/Boton.jsx";
import { Campo, Seleccion } from "../../componentes/ui/Campo.jsx";
import { Dialogo } from "../../componentes/ui/Dialogo.jsx";
import { Aviso, AvisoDeError } from "../../componentes/ui/Aviso.jsx";
import { Insignia } from "../../componentes/ui/Insignia.jsx";
import { Cargando } from "../../componentes/ui/Estados.jsx";
import { DiasDeRutina } from "../socio/MiRutina.jsx";

const FORMULARIO_VACIO = { nombre: "", idPlantilla: "", dias: [{ dia: 1, ejercicios: [] }] };

/**
 * Caso de uso "el entrenador arma y asigna una rutina a un socio de su sucursal".
 *
 * Muestra la rutina vigente y el historial del socio para que el entrenador tenga
 * contexto (CU "Consultar la rutina de un socio"), y debajo un editor día por día
 * para asignarle una nueva. Se puede partir de una plantilla del gimnasio o armarla
 * desde cero.
 */
export default function DialogoAsignarRutina({ socio, alCerrar, alGuardar }) {
  const { datos: vigente, cargando: cargandoVigente } = usePeticion(
    () => (socio ? rutinasDeSocio.deSocio(socio.id) : Promise.resolve({ data: null })),
    [socio?.id],
  );

  const { datos: historial } = usePeticion(
    () => (socio ? rutinasDeSocio.historialDeSocio(socio.id) : Promise.resolve({ data: [] })),
    [socio?.id],
  );

  const { datos: plantillas } = usePeticion(() => rutinas.listar(), []);
  const { datos: catalogo } = usePeticion(() => ejercicios.listar(), []);

  // El padre monta este diálogo con key={idDelSocio}: React lo remonta entero cada vez
  // que cambia de socio (o se cierra y se vuelve a abrir), así que arranca en blanco sin
  // necesidad de un efecto que lo resetee a mano.
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const asignar = useAccion((datos) => rutinasDeSocio.asignar(datos));

  if (!socio) return <Dialogo abierto={false} alCerrar={alCerrar} titulo="" />;

  async function usarPlantilla(idPlantilla) {
    if (!idPlantilla) {
      setFormulario({ ...formulario, idPlantilla: "" });
      return;
    }

    const { data: plantilla } = await rutinas.obtener(idPlantilla);

    setFormulario({
      nombre: plantilla.nombre,
      idPlantilla,
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
    });
  }

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
    const elegido = catalogo?.find((e) => String(e.id) === String(idEjercicio));
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
      idSocio: socio.id,
      nombre: formulario.nombre || `Rutina de ${socio.nombreCompleto}`,
      idPlantilla: formulario.idPlantilla ? Number(formulario.idPlantilla) : null,
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

    if (await asignar.ejecutar(datos)) alGuardar();
  }

  const hayEjercicios = formulario.dias.some((dia) => dia.ejercicios.length > 0);
  const historialAnterior = (historial ?? []).filter((r) => !r.activa);

  return (
    <Dialogo
      abierto
      titulo={`Rutina de ${socio.nombreCompleto}`}
      descripcion="Lo que asignes acá reemplaza la rutina vigente del socio; la anterior queda en su historial."
      ancho
      alCerrar={alCerrar}
      pie={
        <>
          <Boton variante="fantasma" onClick={alCerrar}>
            Cerrar
          </Boton>

          <Boton
            variante="principal"
            enCurso={asignar.enCurso}
            disabled={!hayEjercicios}
            onClick={confirmar}
          >
            Asignar esta rutina
          </Boton>
        </>
      }
    >
      <div className="pila">
        <AvisoDeError error={asignar.error} />

        {cargandoVigente ? (
          <Cargando texto="Buscando la rutina vigente" />
        ) : vigente ? (
          <div className="pila-corta">
            <div className="fila-separada">
              <strong>Rutina vigente: {vigente.nombre}</strong>
              <Insignia tono="ok">Desde el {fecha(vigente.fechaInicio)}</Insignia>
            </div>
            <DiasDeRutina dias={vigente.dias} />
          </div>
        ) : (
          <Aviso tono="info">Todavía no tiene una rutina asignada.</Aviso>
        )}

        {historialAnterior.length > 0 && (
          <div>
            <Boton variante="fantasma" onClick={() => setMostrarHistorial(!mostrarHistorial)}>
              {mostrarHistorial ? "Ocultar historial" : `Ver historial (${historialAnterior.length})`}
            </Boton>

            {mostrarHistorial && (
              <ul className="pila-corta" style={{ marginTop: "var(--e-corto)" }}>
                {historialAnterior.map((r) => (
                  <li key={r.id} className="texto-tenue">
                    {r.nombre} — {fecha(r.fechaInicio)}
                    {r.fechaFin ? ` a ${fecha(r.fechaFin)}` : ""}
                    {r.entrenador ? ` · ${r.entrenador}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <strong>Asignar una rutina nueva</strong>

        <div className="rejilla-formulario">
          <Campo
            etiqueta="Nombre de la rutina"
            value={formulario.nombre}
            onChange={(evento) => setFormulario({ ...formulario, nombre: evento.target.value })}
            placeholder={`Rutina de ${socio.nombreCompleto}`}
          />

          <Seleccion
            etiqueta="Empezar desde una plantilla"
            value={formulario.idPlantilla}
            onChange={(evento) => usarPlantilla(evento.target.value)}
            vacio="Armarla desde cero"
            opciones={(plantillas ?? []).map((p) => ({ valor: p.id, texto: p.nombre }))}
          />
        </div>

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

                {(catalogo ?? []).map((ejercicio) => (
                  <option key={ejercicio.id} value={ejercicio.id}>
                    {ejercicio.nombre} — {ejercicio.grupo}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <Boton icono={Plus} onClick={agregarDia}>
          Agregar un día
        </Boton>
      </div>
    </Dialogo>
  );
}
