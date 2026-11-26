import { useState } from "react";
import { Clock, Pencil, Plus, Trash2 } from "lucide-react";

import { horarios } from "../../api/endpoints.js";
import { useSesion } from "../../contexto/SesionContexto.jsx";
import { usePeticion } from "../../hooks/usePeticion.js";
import { useAccion } from "../../hooks/useAccion.js";
import { nombreDeDia } from "../../dominio/formato.js";
import { EncabezadoDePagina } from "../../componentes/estructura/EncabezadoDePagina.jsx";
import { Boton } from "../../componentes/ui/Boton.jsx";
import { Campo, Seleccion } from "../../componentes/ui/Campo.jsx";
import { Panel } from "../../componentes/ui/Panel.jsx";
import { Tabla } from "../../componentes/ui/Tabla.jsx";
import { Dialogo, DialogoDeConfirmacion } from "../../componentes/ui/Dialogo.jsx";
import { AvisoDeError } from "../../componentes/ui/Aviso.jsx";
import { EstadoVacio } from "../../componentes/ui/Estados.jsx";

/** Caso de uso "Configurar los horarios de la sucursal". */
export default function GestionDeHorarios() {
  const { sucursalActiva } = useSesion();

  const [enEdicion, setEnEdicion] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);

  const { datos, cargando, recargar } = usePeticion(() => horarios.listar(), []);
  const eliminar = useAccion((id) => horarios.eliminar(id));

  const columnas = [
    { clave: "dia", titulo: "Día", principal: true, celda: (franja) => franja.dia },
    { clave: "apertura", titulo: "Abre", numerica: true, celda: (franja) => franja.apertura },
    { clave: "cierre", titulo: "Cierra", numerica: true, celda: (franja) => franja.cierre },
    {
      clave: "acciones",
      titulo: "",
      acciones: true,
      celda: (franja) => (
        <div className="fila" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
          <Boton
            variante="fantasma"
            soloIcono
            title="Editar"
            aria-label={`Editar el horario del ${franja.dia}`}
            onClick={() => setEnEdicion(franja)}
          >
            <Pencil size={15} />
          </Boton>

          <Boton
            variante="fantasma"
            soloIcono
            title="Eliminar"
            aria-label={`Eliminar el horario del ${franja.dia}`}
            onClick={() => setAEliminar(franja)}
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
        titulo="Horarios"
        descripcion={`Días y horas de apertura de ${sucursalActiva?.gimnasio ?? "la sucursal"}. Se muestran en el sitio público.`}
        acciones={
          <Boton variante="principal" icono={Plus} onClick={() => setEnEdicion({})}>
            Agregar franja
          </Boton>
        }
      />

      <div className="pila">
        <AvisoDeError error={eliminar.error} />

        <Panel sinRelleno>
          <Tabla
            columnas={columnas}
            filas={datos}
            cargando={cargando}
            vacio={
              <EstadoVacio
                icono={Clock}
                titulo="Esta sucursal no tiene horarios cargados."
                accion={{ texto: "Cargar el primero", icono: Plus, onClick: () => setEnEdicion({}) }}
              >
                <p>Sin horarios, el sitio público muestra la sede como cerrada.</p>
              </EstadoVacio>
            }
          />
        </Panel>
      </div>

      {/* Se monta sólo mientras está abierto: así cada apertura arranca con el
          formulario y los errores limpios, sin arrastrar nada de la anterior. */}
      {enEdicion && (
        <DialogoDeHorario
          key={enEdicion.id ?? "nueva"}
          franja={enEdicion}
          alCerrar={() => setEnEdicion(null)}
          alGuardar={() => {
            setEnEdicion(null);
            recargar();
          }}
        />
      )}

      <DialogoDeConfirmacion
        abierto={aEliminar !== null}
        titulo="Eliminar la franja horaria"
        mensaje={`Se va a quitar el horario del ${aEliminar?.dia?.toLowerCase()}.`}
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

function DialogoDeHorario({ franja, alCerrar, alGuardar }) {
  const [formulario, setFormulario] = useState(() => ({
    diaSemana: franja.diaSemana ?? 1,
    apertura: franja.apertura ?? "08:00",
    cierre: franja.cierre ?? "22:00",
  }));

  const guardar = useAccion((id, datos) =>
    id ? horarios.actualizar(id, datos) : horarios.crear(datos),
  );

  const cambiar = (campo) => (evento) =>
    setFormulario({ ...formulario, [campo]: evento.target.value });

  async function confirmar() {
    const ok = await guardar.ejecutar(franja.id, {
      diaSemana: Number(formulario.diaSemana),
      apertura: formulario.apertura,
      cierre: formulario.cierre,
    });

    if (ok) alGuardar();
  }

  return (
    <Dialogo
      abierto
      titulo={franja.id ? "Editar la franja horaria" : "Nueva franja horaria"}
      alCerrar={alCerrar}
      pie={
        <>
          <Boton variante="fantasma" onClick={alCerrar}>
            Cancelar
          </Boton>

          <Boton variante="principal" enCurso={guardar.enCurso} onClick={confirmar}>
            {franja.id ? "Guardar cambios" : "Agregar"}
          </Boton>
        </>
      }
    >
      <div className="pila">
        <AvisoDeError error={guardar.error} />

        <Seleccion
          etiqueta="Día de la semana"
          value={formulario.diaSemana}
          onChange={cambiar("diaSemana")}
          opciones={[1, 2, 3, 4, 5, 6, 7].map((dia) => ({
            valor: dia,
            texto: nombreDeDia(dia),
          }))}
        />

        <div className="rejilla-formulario">
          <Campo
            etiqueta="Hora de apertura"
            type="time"
            value={formulario.apertura}
            onChange={cambiar("apertura")}
            required
          />

          <Campo
            etiqueta="Hora de cierre"
            type="time"
            value={formulario.cierre}
            onChange={cambiar("cierre")}
            ayuda="Tiene que ser posterior a la de apertura."
            required
          />
        </div>
      </div>
    </Dialogo>
  );
}
