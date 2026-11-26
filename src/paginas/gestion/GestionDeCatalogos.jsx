import { useState } from "react";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";

import { categoriasDeAlimentos, gruposMusculares, objetivos } from "../../api/endpoints.js";
import { usePeticion } from "../../hooks/usePeticion.js";
import { useAccion } from "../../hooks/useAccion.js";
import { EncabezadoDePagina } from "../../componentes/estructura/EncabezadoDePagina.jsx";
import { Boton } from "../../componentes/ui/Boton.jsx";
import { Campo } from "../../componentes/ui/Campo.jsx";
import { Panel } from "../../componentes/ui/Panel.jsx";
import { Tabla } from "../../componentes/ui/Tabla.jsx";
import { Pestanas } from "../../componentes/ui/Pestanas.jsx";
import { Dialogo, DialogoDeConfirmacion } from "../../componentes/ui/Dialogo.jsx";
import { AvisoDeError } from "../../componentes/ui/Aviso.jsx";
import { EstadoVacio } from "../../componentes/ui/Estados.jsx";

/**
 * Los tres catálogos simples del sistema en una sola pantalla.
 *
 * Se comportan igual —nombre único y baja sólo si nadie los usa—, así que
 * comparten la misma tabla y el mismo diálogo, y lo único que cambia es a qué
 * módulo de la API le hablan.
 */
const CATALOGOS = [
  {
    clave: "objetivos",
    texto: "Objetivos",
    singular: "objetivo",
    articulo: "el",
    nuevo: "Nuevo",
    api: objetivos,
    descripcion:
      "Orientan las rutinas y las dietas. El generador los usa para elegir qué proponerle a cada socio.",
  },
  {
    clave: "grupos",
    texto: "Grupos musculares",
    singular: "grupo muscular",
    articulo: "el",
    nuevo: "Nuevo",
    api: gruposMusculares,
    descripcion: "Clasifican los ejercicios del catálogo.",
  },
  {
    clave: "categorias",
    texto: "Categorías de alimentos",
    singular: "categoría",
    articulo: "la",
    nuevo: "Nueva",
    api: categoriasDeAlimentos,
    descripcion: "Agrupan los alimentos y definen las comidas de cada día en las dietas.",
  },
];

export default function GestionDeCatalogos() {
  const [claveActiva, setClaveActiva] = useState(CATALOGOS[0].clave);

  const catalogo = CATALOGOS.find((c) => c.clave === claveActiva);

  return (
    <>
      <EncabezadoDePagina
        titulo="Catálogos"
        descripcion="Listas base que alimentan el resto del sistema."
      />

      <div className="pila">
        <Pestanas
          activa={claveActiva}
          alCambiar={setClaveActiva}
          pestanas={CATALOGOS.map(({ clave, texto }) => ({ clave, texto }))}
        />

        {/* La clave fuerza a React a remontar el panel al cambiar de pestaña,
            así no quedan datos del catálogo anterior mientras carga el nuevo. */}
        <PanelDeCatalogo key={catalogo.clave} catalogo={catalogo} />
      </div>
    </>
  );
}

function PanelDeCatalogo({ catalogo }) {
  const { datos, cargando, recargar } = usePeticion(() => catalogo.api.listar(), []);

  const [enEdicion, setEnEdicion] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);

  const eliminar = useAccion((id) => catalogo.api.eliminar(id));

  const columnas = [
    { clave: "nombre", titulo: "Nombre", principal: true, celda: (item) => item.nombre },
    {
      clave: "usos",
      titulo: "En uso",
      numerica: true,
      celda: (item) =>
        item.usos > 0 ? (
          `${item.usos} ${item.usos === 1 ? "registro" : "registros"}`
        ) : (
          <span className="texto-tenue">sin usar</span>
        ),
    },
    {
      clave: "acciones",
      titulo: "",
      acciones: true,
      celda: (item) => (
        <div className="fila" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
          <Boton
            variante="fantasma"
            soloIcono
            title="Renombrar"
            aria-label={`Renombrar ${item.nombre}`}
            onClick={() => setEnEdicion(item)}
          >
            <Pencil size={15} />
          </Boton>

          <Boton
            variante="fantasma"
            soloIcono
            title={item.sePuedeEliminar ? "Eliminar" : "Está en uso y no se puede eliminar"}
            aria-label={`Eliminar ${item.nombre}`}
            disabled={!item.sePuedeEliminar}
            onClick={() => setAEliminar(item)}
          >
            <Trash2 size={15} />
          </Boton>
        </div>
      ),
    },
  ];

  return (
    <>
      <AvisoDeError error={eliminar.error} />

      <Panel
        titulo={catalogo.texto}
        descripcion={catalogo.descripcion}
        sinRelleno
        acciones={
          <Boton variante="principal" icono={Plus} onClick={() => setEnEdicion({ nombre: "" })}>
            Agregar
          </Boton>
        }
      >
        <Tabla
          columnas={columnas}
          filas={datos}
          cargando={cargando}
          vacio={
            <EstadoVacio
              icono={Tags}
              titulo={`Todavía no hay ${catalogo.texto.toLowerCase()}.`}
              accion={{
                texto: "Agregar el primero",
                icono: Plus,
                onClick: () => setEnEdicion({ nombre: "" }),
              }}
            />
          }
        />
      </Panel>

      {/* Se monta sólo mientras está abierto: así cada apertura arranca con el
          nombre y los errores limpios, sin arrastrar nada de la anterior. */}
      {enEdicion && (
        <DialogoDeItem
          key={enEdicion.id ?? "nuevo"}
          item={enEdicion}
          catalogo={catalogo}
          alCerrar={() => setEnEdicion(null)}
          alGuardar={() => {
            setEnEdicion(null);
            recargar();
          }}
        />
      )}

      <DialogoDeConfirmacion
        abierto={aEliminar !== null}
        titulo={`Eliminar ${catalogo.articulo} ${catalogo.singular}`}
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

function DialogoDeItem({ item, catalogo, alCerrar, alGuardar }) {
  const [nombre, setNombre] = useState(item.nombre ?? "");

  const guardar = useAccion((id, datos) =>
    id ? catalogo.api.actualizar(id, datos) : catalogo.api.crear(datos),
  );

  async function confirmar() {
    if (await guardar.ejecutar(item.id, { nombre })) alGuardar();
  }

  return (
    <Dialogo
      abierto
      titulo={
        item.id
          ? `Renombrar ${catalogo.articulo} ${catalogo.singular}`
          : `${catalogo.nuevo} ${catalogo.singular}`
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
            disabled={!nombre.trim()}
            onClick={confirmar}
          >
            {item.id ? "Guardar cambios" : "Crear"}
          </Boton>
        </>
      }
    >
      <div className="pila">
        <AvisoDeError error={guardar.error} />

        <Campo
          etiqueta="Nombre"
          value={nombre}
          onChange={(evento) => setNombre(evento.target.value)}
          required
        />
      </div>
    </Dialogo>
  );
}
