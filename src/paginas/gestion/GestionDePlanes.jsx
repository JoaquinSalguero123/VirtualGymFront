import { useState } from "react";
import { CreditCard, Pencil, Plus, Trash2 } from "lucide-react";

import { planes } from "../../api/endpoints.js";
import { usePeticion } from "../../hooks/usePeticion.js";
import { useAccion } from "../../hooks/useAccion.js";
import { moneda, numero } from "../../dominio/formato.js";
import { EncabezadoDePagina } from "../../componentes/estructura/EncabezadoDePagina.jsx";
import { Boton } from "../../componentes/ui/Boton.jsx";
import { AreaDeTexto, Campo, Casilla, Seleccion } from "../../componentes/ui/Campo.jsx";
import { Panel } from "../../componentes/ui/Panel.jsx";
import { Tabla } from "../../componentes/ui/Tabla.jsx";
import { Dialogo, DialogoDeConfirmacion } from "../../componentes/ui/Dialogo.jsx";
import { Aviso, AvisoDeError } from "../../componentes/ui/Aviso.jsx";
import { Insignia } from "../../componentes/ui/Insignia.jsx";
import { EstadoVacio } from "../../componentes/ui/Estados.jsx";

/** Caso de uso "Administrar planes de la organización". */
export default function GestionDePlanes() {
  const [verInactivos, setVerInactivos] = useState(false);
  const [enEdicion, setEnEdicion] = useState(null);
  const [aDarDeBaja, setADarDeBaja] = useState(null);

  const { datos, cargando, recargar } = usePeticion(
    () => planes.listar({ incluirInactivos: verInactivos }),
    [verInactivos],
  );

  const darDeBaja = useAccion((id) => planes.darDeBaja(id));

  const columnas = [
    {
      clave: "nombre",
      titulo: "Plan",
      principal: true,
      celda: (plan) => (
        <>
          {plan.nombre}
          {plan.descripcion && (
            <span className="texto-tenue" style={{ display: "block" }}>
              {plan.descripcion}
            </span>
          )}
        </>
      ),
    },
    { clave: "precio", titulo: "Precio", numerica: true, celda: (plan) => moneda(plan.precio) },
    {
      clave: "duracion",
      titulo: "Duración",
      numerica: true,
      celda: (plan) => `${numero(plan.duracionDias)} días`,
    },
    {
      clave: "nivel",
      titulo: "Nivel",
      celda: (plan) => plan.nivel ?? <span className="texto-tenue">—</span>,
    },
    {
      clave: "acceso",
      titulo: "Acceso",
      celda: (plan) =>
        plan.accesoMultiSede ? (
          <Insignia tono="marca">Todas las sedes</Insignia>
        ) : (
          <Insignia tono="neutra">Sede de origen</Insignia>
        ),
    },
    {
      clave: "socios",
      titulo: "Socios",
      numerica: true,
      celda: (plan) => numero(plan.sociosConEstePlan),
    },
    {
      clave: "estado",
      titulo: "Estado",
      celda: (plan) =>
        plan.activo ? <Insignia tono="ok">Vigente</Insignia> : <Insignia tono="neutra">Dado de baja</Insignia>,
    },
    {
      clave: "acciones",
      titulo: "",
      acciones: true,
      celda: (plan) => (
        <div className="fila" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
          <Boton
            variante="fantasma"
            soloIcono
            title="Editar"
            aria-label={`Editar ${plan.nombre}`}
            onClick={() => setEnEdicion(plan)}
          >
            <Pencil size={15} />
          </Boton>

          {plan.activo && (
            <Boton
              variante="fantasma"
              soloIcono
              title="Dar de baja"
              aria-label={`Dar de baja ${plan.nombre}`}
              onClick={() => setADarDeBaja(plan)}
            >
              <Trash2 size={15} />
            </Boton>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <EncabezadoDePagina
        titulo="Planes"
        descripcion="Los planes son de la organización: los comparten todas las sucursales."
        acciones={
          <Boton variante="principal" icono={Plus} onClick={() => setEnEdicion({})}>
            Nuevo plan
          </Boton>
        }
      />

      <div className="pila">
        <AvisoDeError error={darDeBaja.error} />

        <Aviso tono="info">
          Cambiar el precio de un plan no altera lo que ya se les cobró a los socios: cada
          membresía guarda su propio precio acordado.
        </Aviso>

        <Panel ajustado>
          <Casilla
            etiqueta="Mostrar también los planes dados de baja"
            checked={verInactivos}
            onChange={(evento) => setVerInactivos(evento.target.checked)}
          />
        </Panel>

        <Panel sinRelleno>
          <Tabla
            columnas={columnas}
            filas={datos}
            cargando={cargando}
            vacio={
              <EstadoVacio
                icono={CreditCard}
                titulo="Todavía no hay planes."
                accion={{ texto: "Crear el primero", icono: Plus, onClick: () => setEnEdicion({}) }}
              >
                <p>Sin planes los socios no pueden cargar su cuota.</p>
              </EstadoVacio>
            }
          />
        </Panel>
      </div>

      {/* Se monta sólo mientras está abierto: así cada apertura arranca con el
          formulario y los errores limpios, sin arrastrar nada de la anterior. */}
      {enEdicion && (
        <DialogoDePlanComercial
          key={enEdicion.id ?? "nuevo"}
          plan={enEdicion}
          alCerrar={() => setEnEdicion(null)}
          alGuardar={() => {
            setEnEdicion(null);
            recargar();
          }}
        />
      )}

      <DialogoDeConfirmacion
        abierto={aDarDeBaja !== null}
        titulo="Dar de baja el plan"
        mensaje={`"${aDarDeBaja?.nombre}" deja de ofrecerse a socios nuevos. Los pagos históricos y las membresías vigentes se conservan.`}
        textoDeAccion="Dar de baja"
        peligrosa
        enCurso={darDeBaja.enCurso}
        alCerrar={() => setADarDeBaja(null)}
        alConfirmar={async () => {
          if (await darDeBaja.ejecutar(aDarDeBaja.id)) {
            setADarDeBaja(null);
            recargar();
          }
        }}
      />
    </>
  );
}

function DialogoDePlanComercial({ plan, alCerrar, alGuardar }) {
  const [formulario, setFormulario] = useState(() => ({
    nombre: plan.nombre ?? "",
    descripcion: plan.descripcion ?? "",
    precio: plan.precio ?? "",
    duracionDias: plan.duracionDias ?? 30,
    nivel: plan.nivel ?? "",
    accesoMultiSede: plan.accesoMultiSede ?? false,
    activo: plan.activo ?? true,
  }));

  const guardar = useAccion((id, datos) =>
    id ? planes.actualizar(id, datos) : planes.crear(datos),
  );

  const esNuevo = !plan.id;

  const cambiar = (campo) => (evento) =>
    setFormulario({
      ...formulario,
      [campo]: evento.target.type === "checkbox" ? evento.target.checked : evento.target.value,
    });

  async function confirmar() {
    const datos = {
      nombre: formulario.nombre,
      descripcion: formulario.descripcion || null,
      precio: Number(formulario.precio),
      duracionDias: Number(formulario.duracionDias),
      nivel: formulario.nivel || null,
      accesoMultiSede: formulario.accesoMultiSede,
      ...(esNuevo ? {} : { activo: formulario.activo }),
    };

    if (await guardar.ejecutar(plan.id, datos)) alGuardar();
  }

  return (
    <Dialogo
      abierto
      titulo={esNuevo ? "Nuevo plan" : "Editar el plan"}
      alCerrar={alCerrar}
      pie={
        <>
          <Boton variante="fantasma" onClick={alCerrar}>
            Cancelar
          </Boton>

          <Boton
            variante="principal"
            enCurso={guardar.enCurso}
            disabled={!formulario.nombre || formulario.precio === ""}
            onClick={confirmar}
          >
            {esNuevo ? "Crear el plan" : "Guardar cambios"}
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
          placeholder="Qué incluye el plan"
          ancho
        />

        <div className="rejilla-formulario">
          <Campo
            etiqueta="Precio"
            type="number"
            min={0}
            value={formulario.precio}
            onChange={cambiar("precio")}
            required
          />

          <Campo
            etiqueta="Duración en días"
            type="number"
            min={1}
            value={formulario.duracionDias}
            onChange={cambiar("duracionDias")}
          />

          <Seleccion
            etiqueta="Nivel"
            value={formulario.nivel}
            onChange={cambiar("nivel")}
            vacio="Sin definir"
            opciones={["principiante", "intermedio", "avanzado"].map((nivel) => ({
              valor: nivel,
              texto: nivel,
            }))}
          />
        </div>

        <Casilla
          etiqueta="Da acceso a todas las sucursales de la organización"
          checked={formulario.accesoMultiSede}
          onChange={cambiar("accesoMultiSede")}
        />

        {!esNuevo && (
          <Casilla
            etiqueta="El plan se sigue ofreciendo"
            checked={formulario.activo}
            onChange={cambiar("activo")}
          />
        )}
      </div>
    </Dialogo>
  );
}
