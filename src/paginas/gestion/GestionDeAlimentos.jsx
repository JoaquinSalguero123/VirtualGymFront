import { useState } from "react";
import { Apple, Pencil, Plus, Trash2 } from "lucide-react";

import { alimentos, categoriasDeAlimentos, objetivos } from "../../api/endpoints.js";
import { usePeticion } from "../../hooks/usePeticion.js";
import { useAccion } from "../../hooks/useAccion.js";
import { numero } from "../../dominio/formato.js";
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

const FORMULARIO_VACIO = {
  nombre: "",
  calorias: "",
  proteinas: "",
  carbohidratos: "",
  grasas: "",
  descripcion: "",
  idCategoria: "",
  idObjetivo: "",
};

/**
 * Caso de uso "Administrar alimentos y categorías".
 *
 * El objetivo asociado a cada alimento es lo que después usa el generador de
 * dietas para elegir qué proponerle a cada socio.
 */
export default function GestionDeAlimentos() {
  const [texto, setTexto] = useState("");
  const [idCategoria, setIdCategoria] = useState("");
  const [idObjetivo, setIdObjetivo] = useState("");
  const [enEdicion, setEnEdicion] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);

  const { datos: categorias } = usePeticion(() => categoriasDeAlimentos.listar(), []);
  const { datos: listaDeObjetivos } = usePeticion(() => objetivos.listar(), []);

  const { datos, cargando, recargar } = usePeticion(
    () =>
      alimentos.listar({
        texto: texto || undefined,
        idCategoria: idCategoria || undefined,
        idObjetivo: idObjetivo || undefined,
      }),
    [texto, idCategoria, idObjetivo],
  );

  const eliminar = useAccion((id) => alimentos.eliminar(id));

  const columnas = [
    { clave: "nombre", titulo: "Alimento", principal: true, celda: (a) => a.nombre },
    {
      clave: "categoria",
      titulo: "Categoría",
      celda: (a) =>
        a.categoria ? <Insignia tono="neutra">{a.categoria}</Insignia> : <span className="texto-tenue">—</span>,
    },
    {
      clave: "objetivo",
      titulo: "Objetivo",
      celda: (a) => a.objetivo ?? <span className="texto-tenue">—</span>,
    },
    {
      clave: "calorias",
      titulo: "Calorías",
      numerica: true,
      celda: (a) => (a.calorias != null ? numero(a.calorias) : "—"),
    },
    {
      clave: "macros",
      titulo: "P / C / G",
      numerica: true,
      celda: (a) => (
        <span className="texto-tenue">
          {numero(a.proteinas ?? 0)} / {numero(a.carbohidratos ?? 0)} / {numero(a.grasas ?? 0)}
        </span>
      ),
    },
    {
      clave: "acciones",
      titulo: "",
      acciones: true,
      celda: (a) => (
        <div className="fila" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
          <Boton
            variante="fantasma"
            soloIcono
            title="Editar"
            aria-label={`Editar ${a.nombre}`}
            onClick={() => setEnEdicion(a)}
          >
            <Pencil size={15} />
          </Boton>

          <Boton
            variante="fantasma"
            soloIcono
            title="Eliminar"
            aria-label={`Eliminar ${a.nombre}`}
            onClick={() => setAEliminar(a)}
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
        titulo="Alimentos"
        descripcion="Catálogo con el que se arman los planes de alimentación. Los valores son por 100 g."
        acciones={
          <Boton variante="principal" icono={Plus} onClick={() => setEnEdicion(FORMULARIO_VACIO)}>
            Nuevo alimento
          </Boton>
        }
      />

      <div className="pila">
        <AvisoDeError error={eliminar.error} />

        <Panel ajustado>
          <div className="filtros">
            <Buscador valor={texto} alCambiar={setTexto} marcador="Buscar un alimento" />

            <Seleccion
              etiqueta="Categoría"
              value={idCategoria}
              onChange={(evento) => setIdCategoria(evento.target.value)}
              vacio="Todas"
              opciones={(categorias ?? []).map((c) => ({ valor: c.id, texto: c.nombre }))}
            />

            <Seleccion
              etiqueta="Objetivo"
              value={idObjetivo}
              onChange={(evento) => setIdObjetivo(evento.target.value)}
              vacio="Todos"
              opciones={(listaDeObjetivos ?? []).map((o) => ({ valor: o.id, texto: o.nombre }))}
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
                icono={Apple}
                titulo="No hay alimentos cargados."
                accion={{
                  texto: "Cargar el primero",
                  icono: Plus,
                  onClick: () => setEnEdicion(FORMULARIO_VACIO),
                }}
              >
                <p>El generador de dietas necesita alimentos en el catálogo para proponer planes.</p>
              </EstadoVacio>
            }
          />
        </Panel>
      </div>

      {/* Se monta sólo mientras está abierto: así cada apertura arranca con el
          formulario y los errores limpios, sin arrastrar nada de la anterior. */}
      {enEdicion && (
        <DialogoDeAlimento
          key={enEdicion.id ?? "nuevo"}
          alimento={enEdicion}
          categorias={categorias ?? []}
          objetivosDisponibles={listaDeObjetivos ?? []}
          alCerrar={() => setEnEdicion(null)}
          alGuardar={() => {
            setEnEdicion(null);
            recargar();
          }}
        />
      )}

      <DialogoDeConfirmacion
        abierto={aEliminar !== null}
        titulo="Eliminar el alimento"
        mensaje={`Se va a quitar "${aEliminar?.nombre}" del catálogo. Si ya forma parte de la dieta de algún socio, el sistema no lo va a permitir.`}
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

function DialogoDeAlimento({ alimento, categorias, objetivosDisponibles, alCerrar, alGuardar }) {
  const [formulario, setFormulario] = useState(() => ({
    nombre: alimento.nombre ?? "",
    calorias: alimento.calorias ?? "",
    proteinas: alimento.proteinas ?? "",
    carbohidratos: alimento.carbohidratos ?? "",
    grasas: alimento.grasas ?? "",
    descripcion: alimento.descripcion ?? "",
    idCategoria: alimento.idCategoria ?? "",
    idObjetivo: alimento.idObjetivo ?? "",
  }));

  const guardar = useAccion((id, datos) =>
    id ? alimentos.actualizar(id, datos) : alimentos.crear(datos),
  );

  const cambiar = (campo) => (evento) =>
    setFormulario({ ...formulario, [campo]: evento.target.value });

  const aNumero = (valor) => (valor === "" || valor === null ? null : Number(valor));

  async function confirmar() {
    const resultado = await guardar.ejecutar(alimento.id, {
      nombre: formulario.nombre,
      calorias: aNumero(formulario.calorias),
      proteinas: aNumero(formulario.proteinas),
      carbohidratos: aNumero(formulario.carbohidratos),
      grasas: aNumero(formulario.grasas),
      descripcion: formulario.descripcion || null,
      idCategoria: formulario.idCategoria ? Number(formulario.idCategoria) : null,
      idObjetivo: formulario.idObjetivo ? Number(formulario.idObjetivo) : null,
    });

    if (resultado) alGuardar();
  }

  return (
    <Dialogo
      abierto
      titulo={alimento.id ? "Editar el alimento" : "Nuevo alimento"}
      descripcion="Los valores nutricionales se cargan por cada 100 gramos."
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
            {alimento.id ? "Guardar cambios" : "Crear el alimento"}
          </Boton>
        </>
      }
    >
      <div className="pila">
        <AvisoDeError error={guardar.error} />

        <Campo etiqueta="Nombre" value={formulario.nombre} onChange={cambiar("nombre")} required />

        <div className="rejilla-formulario">
          <Seleccion
            etiqueta="Categoría"
            value={formulario.idCategoria}
            onChange={cambiar("idCategoria")}
            vacio="Sin categoría"
            opciones={categorias.map((c) => ({ valor: c.id, texto: c.nombre }))}
          />

          <Seleccion
            etiqueta="Objetivo sugerido"
            value={formulario.idObjetivo}
            onChange={cambiar("idObjetivo")}
            vacio="Para cualquier objetivo"
            opciones={objetivosDisponibles.map((o) => ({ valor: o.id, texto: o.nombre }))}
          />
        </div>

        <div className="rejilla-formulario">
          <Campo etiqueta="Calorías (kcal)" type="number" min={0} value={formulario.calorias} onChange={cambiar("calorias")} />
          <Campo etiqueta="Proteínas (g)" type="number" min={0} value={formulario.proteinas} onChange={cambiar("proteinas")} />
          <Campo etiqueta="Carbohidratos (g)" type="number" min={0} value={formulario.carbohidratos} onChange={cambiar("carbohidratos")} />
          <Campo etiqueta="Grasas (g)" type="number" min={0} value={formulario.grasas} onChange={cambiar("grasas")} />
        </div>

        <AreaDeTexto
          etiqueta="Descripción"
          value={formulario.descripcion}
          onChange={cambiar("descripcion")}
          ancho
        />
      </div>
    </Dialogo>
  );
}
