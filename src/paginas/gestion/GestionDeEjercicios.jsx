import { useState } from "react";
import { Dumbbell, Pencil, Plus, Trash2, Video } from "lucide-react";

import { ejercicios, gruposMusculares } from "../../api/endpoints.js";
import { usePeticion } from "../../hooks/usePeticion.js";
import { useAccion } from "../../hooks/useAccion.js";
import { EncabezadoDePagina } from "../../componentes/estructura/EncabezadoDePagina.jsx";
import { Boton } from "../../componentes/ui/Boton.jsx";
import { Buscador } from "../../componentes/ui/Buscador.jsx";
import { AreaDeTexto, Campo, Seleccion } from "../../componentes/ui/Campo.jsx";
import { Panel } from "../../componentes/ui/Panel.jsx";
import { Tabla } from "../../componentes/ui/Tabla.jsx";
import { Dialogo, DialogoDeConfirmacion } from "../../componentes/ui/Dialogo.jsx";
import { AvisoDeError } from "../../componentes/ui/Aviso.jsx";
import { Insignia } from "../../componentes/ui/Insignia.jsx";
import { EstadoVacio } from "../../componentes/ui/Estados.jsx";

const FORMULARIO_VACIO = { nombre: "", descripcion: "", idGrupo: "", videoUrl: "" };

/** Caso de uso "Administrar ejercicios y grupos musculares". */
export default function GestionDeEjercicios() {
  const [texto, setTexto] = useState("");
  const [idGrupo, setIdGrupo] = useState("");
  const [enEdicion, setEnEdicion] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);

  const { datos: grupos } = usePeticion(() => gruposMusculares.listar(), []);

  const { datos, cargando, recargar } = usePeticion(
    () => ejercicios.listar({ texto: texto || undefined, idGrupo: idGrupo || undefined }),
    [texto, idGrupo],
  );

  const eliminar = useAccion((id) => ejercicios.eliminar(id));

  const columnas = [
    {
      clave: "nombre",
      titulo: "Ejercicio",
      principal: true,
      celda: (ejercicio) => (
        <>
          {ejercicio.nombre}
          {ejercicio.descripcion && (
            <span className="texto-tenue" style={{ display: "block" }}>
              {ejercicio.descripcion}
            </span>
          )}
        </>
      ),
    },
    {
      clave: "grupo",
      titulo: "Grupo muscular",
      celda: (ejercicio) => <Insignia tono="neutra">{ejercicio.grupo}</Insignia>,
    },
    {
      clave: "video",
      titulo: "Video",
      celda: (ejercicio) =>
        ejercicio.videoUrl ? (
          <a
            href={ejercicio.videoUrl}
            target="_blank"
            rel="noreferrer"
            className="fila"
            style={{ gap: 4, color: "var(--verde-sala)" }}
          >
            <Video size={14} /> Ver
          </a>
        ) : (
          <span className="texto-tenue">—</span>
        ),
    },
    {
      clave: "usos",
      titulo: "En rutinas",
      numerica: true,
      celda: (ejercicio) => ejercicio.usos,
    },
    {
      clave: "acciones",
      titulo: "",
      acciones: true,
      celda: (ejercicio) => (
        <div className="fila" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
          <Boton
            variante="fantasma"
            soloIcono
            title="Editar"
            aria-label={`Editar ${ejercicio.nombre}`}
            onClick={() => setEnEdicion(ejercicio)}
          >
            <Pencil size={15} />
          </Boton>

          <Boton
            variante="fantasma"
            soloIcono
            title={ejercicio.usos > 0 ? "Está en uso en rutinas" : "Eliminar"}
            aria-label={`Eliminar ${ejercicio.nombre}`}
            disabled={ejercicio.usos > 0}
            onClick={() => setAEliminar(ejercicio)}
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
        titulo="Ejercicios"
        descripcion="Catálogo con el que se arman las rutinas del gimnasio."
        acciones={
          <Boton variante="principal" icono={Plus} onClick={() => setEnEdicion(FORMULARIO_VACIO)}>
            Nuevo ejercicio
          </Boton>
        }
      />

      <div className="pila">
        <AvisoDeError error={eliminar.error} />

        <Panel ajustado>
          <div className="filtros">
            <Buscador valor={texto} alCambiar={setTexto} marcador="Buscar un ejercicio" />

            <Seleccion
              etiqueta="Grupo muscular"
              value={idGrupo}
              onChange={(evento) => setIdGrupo(evento.target.value)}
              vacio="Todos"
              opciones={(grupos ?? []).map((grupo) => ({
                valor: grupo.id,
                texto: grupo.nombre,
              }))}
            />
          </div>
        </Panel>

        <Panel sinRelleno>
          <Tabla
            columnas={columnas}
            filas={datos}
            cargando={cargando}
            vacio={
              <EstadoVacio
                icono={Dumbbell}
                titulo="No hay ejercicios cargados."
                accion={{
                  texto: "Cargar el primero",
                  icono: Plus,
                  onClick: () => setEnEdicion(FORMULARIO_VACIO),
                }}
              >
                <p>Sin ejercicios en el catálogo no se pueden armar rutinas.</p>
              </EstadoVacio>
            }
          />
        </Panel>
      </div>

      {/* Se monta sólo mientras está abierto: así cada apertura arranca con el
          formulario y los errores limpios, sin arrastrar nada de la anterior. */}
      {enEdicion && (
        <DialogoDeEjercicio
          key={enEdicion.id ?? "nuevo"}
          ejercicio={enEdicion}
          grupos={grupos ?? []}
          alCerrar={() => setEnEdicion(null)}
          alGuardar={() => {
            setEnEdicion(null);
            recargar();
          }}
        />
      )}

      <DialogoDeConfirmacion
        abierto={aEliminar !== null}
        titulo="Eliminar el ejercicio"
        mensaje={`Se va a quitar "${aEliminar?.nombre}" del catálogo. No se puede deshacer.`}
        textoDeAccion="Eliminar"
        peligrosa
        enCurso={eliminar.enCurso}
        alCerrar={() => setAEliminar(null)}
        alConfirmar={async () => {
          if (await eliminar.ejecutar(aEliminar.id)) {
            setAEliminar(null);
            recargar();
          }
        }}
      />
    </>
  );
}

function DialogoDeEjercicio({ ejercicio, grupos, alCerrar, alGuardar }) {
  const [formulario, setFormulario] = useState(() => ({
    nombre: ejercicio.nombre ?? "",
    descripcion: ejercicio.descripcion ?? "",
    idGrupo: ejercicio.idGrupo ?? "",
    videoUrl: ejercicio.videoUrl ?? "",
  }));

  const guardar = useAccion((id, datos) =>
    id ? ejercicios.actualizar(id, datos) : ejercicios.crear(datos),
  );

  const cambiar = (campo) => (evento) =>
    setFormulario({ ...formulario, [campo]: evento.target.value });

  async function confirmar() {
    const resultado = await guardar.ejecutar(ejercicio.id, {
      nombre: formulario.nombre,
      descripcion: formulario.descripcion || null,
      idGrupo: Number(formulario.idGrupo),
      videoUrl: formulario.videoUrl || null,
    });

    if (resultado) alGuardar();
  }

  return (
    <Dialogo
      abierto
      titulo={ejercicio.id ? "Editar el ejercicio" : "Nuevo ejercicio"}
      alCerrar={alCerrar}
      pie={
        <>
          <Boton variante="fantasma" onClick={alCerrar}>
            Cancelar
          </Boton>

          <Boton
            variante="principal"
            enCurso={guardar.enCurso}
            disabled={!formulario.nombre || !formulario.idGrupo}
            onClick={confirmar}
          >
            {ejercicio.id ? "Guardar cambios" : "Crear el ejercicio"}
          </Boton>
        </>
      }
    >
      <div className="pila">
        <AvisoDeError error={guardar.error} />

        <Campo etiqueta="Nombre" value={formulario.nombre} onChange={cambiar("nombre")} required />

        <Seleccion
          etiqueta="Grupo muscular"
          value={formulario.idGrupo}
          onChange={cambiar("idGrupo")}
          vacio="Elegí un grupo"
          opciones={grupos.map((grupo) => ({ valor: grupo.id, texto: grupo.nombre }))}
        />

        <AreaDeTexto
          etiqueta="Descripción"
          value={formulario.descripcion}
          onChange={cambiar("descripcion")}
          placeholder="Cómo se ejecuta, con qué elemento, qué cuidar"
          ancho
        />

        <Campo
          etiqueta="Enlace a un video"
          value={formulario.videoUrl}
          onChange={cambiar("videoUrl")}
          placeholder="https://"
          ayuda="Opcional. El socio lo ve desde su rutina."
        />
      </div>
    </Dialogo>
  );
}
