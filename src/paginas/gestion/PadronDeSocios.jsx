import { useState } from "react";
import { Apple, CalendarCheck, Dumbbell, LineChart, Pencil, Users, Wallet } from "lucide-react";

import { asistencias, membresias, objetivos, planes, socios } from "../../api/endpoints.js";
import { useSesion } from "../../contexto/SesionContexto.jsx";
import { usePeticion } from "../../hooks/usePeticion.js";
import { useAccion } from "../../hooks/useAccion.js";
import { edad, fecha, moneda } from "../../dominio/formato.js";
import { ROLES } from "../../dominio/roles.js";
import { EncabezadoDePagina } from "../../componentes/estructura/EncabezadoDePagina.jsx";
import { Boton } from "../../componentes/ui/Boton.jsx";
import { Buscador } from "../../componentes/ui/Buscador.jsx";
import { AreaDeTexto, Campo, Casilla, Seleccion } from "../../componentes/ui/Campo.jsx";
import { Panel } from "../../componentes/ui/Panel.jsx";
import { Tabla, Paginador } from "../../componentes/ui/Tabla.jsx";
import { Dialogo } from "../../componentes/ui/Dialogo.jsx";
import { AvisoDeError } from "../../componentes/ui/Aviso.jsx";
import { EstadoDeSocio, Insignia } from "../../componentes/ui/Insignia.jsx";
import { EstadoVacio } from "../../componentes/ui/Estados.jsx";
import DialogoAsignarRutina from "./DialogoAsignarRutina.jsx";
import DialogoAsignarDieta from "./DialogoAsignarDieta.jsx";
import DialogoCargarMedicion from "./DialogoCargarMedicion.jsx";

/**
 * Caso de uso "Consultar el padrón de socios de la sucursal".
 *
 * Es la pantalla que más usa el mostrador, así que el buscador va arriba y
 * enfocable, y cada fila muestra de un vistazo lo que se necesita para atender:
 * estado, plan y si está al día con la cuota.
 */
export default function PadronDeSocios() {
  const { tieneRol } = useSesion();
  const puedeEditar = tieneRol(ROLES.recepcionista, ROLES.administrador);
  const puedeAsignarRutina = tieneRol(ROLES.entrenador, ROLES.administrador);
  const puedeAsignarDieta = tieneRol(ROLES.nutricionista, ROLES.administrador);
  const puedeCargarMedicion = tieneRol(ROLES.entrenador, ROLES.nutricionista, ROLES.administrador);

  const [texto, setTexto] = useState("");
  const [idEstado, setIdEstado] = useState("");
  const [soloActivos, setSoloActivos] = useState(false);
  const [pagina, setPagina] = useState(1);

  const [socioAEditar, setSocioAEditar] = useState(null);
  const [socioParaPlan, setSocioParaPlan] = useState(null);
  const [socioParaRutina, setSocioParaRutina] = useState(null);
  const [socioParaDieta, setSocioParaDieta] = useState(null);
  const [socioParaMedicion, setSocioParaMedicion] = useState(null);

  const { datos: estados } = usePeticion(() => socios.estados(), []);
  const { datos: listaDeObjetivos } = usePeticion(() => objetivos.listar(), []);
  const { datos: listaDePlanes } = usePeticion(() => planes.listar(), []);

  const { datos, cargando, recargar } = usePeticion(
    () =>
      socios.listar({
        texto: texto || undefined,
        idEstado: idEstado || undefined,
        soloActivos: soloActivos || undefined,
        pagina,
        tamanioPagina: 20,
      }),
    [texto, idEstado, soloActivos, pagina],
  );

  const marcarAsistencia = useAccion((idSocio) => asistencias.marcarParaSocio(idSocio));

  const columnas = [
    {
      clave: "socio",
      titulo: "Socio",
      principal: true,
      celda: (socio) => (
        <>
          {socio.nombreCompleto}
          <span className="texto-tenue" style={{ display: "block" }}>
            {socio.numeroSocio ? `N.º ${socio.numeroSocio} · ` : ""}
            {socio.email}
          </span>
        </>
      ),
    },
    {
      clave: "estado",
      titulo: "Estado",
      celda: (socio) => <EstadoDeSocio estado={socio.estado} />,
    },
    {
      clave: "plan",
      titulo: "Plan",
      celda: (socio) =>
        socio.planActivo ? (
          <>
            {socio.planActivo}
            <span className="texto-tenue" style={{ display: "block" }}>
              {moneda(socio.precioPlanActivo)}
            </span>
          </>
        ) : (
          <span className="texto-tenue">Sin plan</span>
        ),
    },
    {
      clave: "cuota",
      titulo: "Cuota del mes",
      celda: (socio) =>
        socio.cuotaAlDia ? (
          <Insignia tono="ok">Al día</Insignia>
        ) : (
          <Insignia tono="alerta">Pendiente</Insignia>
        ),
    },
    {
      clave: "objetivo",
      titulo: "Objetivo",
      celda: (socio) => socio.objetivo ?? <span className="texto-tenue">—</span>,
    },
    {
      clave: "alta",
      titulo: "Socio desde",
      celda: (socio) => fecha(socio.fechaAlta),
    },
    {
      clave: "acciones",
      titulo: "",
      acciones: true,
      celda: (socio) =>
        (puedeEditar || puedeAsignarRutina || puedeAsignarDieta || puedeCargarMedicion) && (
          <div className="fila" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
            {puedeEditar && (
              <>
                <Boton
                  variante="fantasma"
                  soloIcono
                  title="Registrar entrada"
                  aria-label={`Registrar la entrada de ${socio.nombreCompleto}`}
                  enCurso={marcarAsistencia.enCurso}
                  onClick={async () => {
                    if (await marcarAsistencia.ejecutar(socio.id)) recargar();
                  }}
                >
                  <CalendarCheck size={15} />
                </Boton>

                <Boton
                  variante="fantasma"
                  soloIcono
                  title="Asignar plan"
                  aria-label={`Asignar un plan a ${socio.nombreCompleto}`}
                  onClick={() => setSocioParaPlan(socio)}
                >
                  <Wallet size={15} />
                </Boton>

                <Boton
                  variante="fantasma"
                  soloIcono
                  title="Editar la ficha"
                  aria-label={`Editar la ficha de ${socio.nombreCompleto}`}
                  onClick={() => setSocioAEditar(socio)}
                >
                  <Pencil size={15} />
                </Boton>
              </>
            )}

            {puedeAsignarRutina && (
              <Boton
                variante="fantasma"
                soloIcono
                title="Asignar rutina"
                aria-label={`Asignar una rutina a ${socio.nombreCompleto}`}
                onClick={() => setSocioParaRutina(socio)}
              >
                <Dumbbell size={15} />
              </Boton>
            )}

            {puedeAsignarDieta && (
              <Boton
                variante="fantasma"
                soloIcono
                title="Asignar dieta"
                aria-label={`Asignar una dieta a ${socio.nombreCompleto}`}
                onClick={() => setSocioParaDieta(socio)}
              >
                <Apple size={15} />
              </Boton>
            )}

            {puedeCargarMedicion && (
              <Boton
                variante="fantasma"
                soloIcono
                title="Cargar medición"
                aria-label={`Cargar una medición de ${socio.nombreCompleto}`}
                onClick={() => setSocioParaMedicion(socio)}
              >
                <LineChart size={15} />
              </Boton>
            )}
          </div>
        ),
    },
  ];

  return (
    <>
      <EncabezadoDePagina
        titulo="Socios"
        descripcion="Padrón de la sucursal activa."
      />

      <div className="pila">
        <AvisoDeError error={marcarAsistencia.error} />

        <Panel ajustado>
          <div className="filtros">
            <Buscador
              valor={texto}
              alCambiar={(valor) => {
                setTexto(valor);
                setPagina(1);
              }}
              marcador="Buscar por nombre, email o número de socio"
            />

            <Seleccion
              etiqueta="Estado"
              value={idEstado}
              onChange={(evento) => {
                setIdEstado(evento.target.value);
                setPagina(1);
              }}
              vacio="Todos"
              opciones={(estados ?? []).map((estado) => ({
                valor: estado.id,
                texto: estado.nombre,
              }))}
            />

            <Casilla
              etiqueta="Ocultar los dados de baja"
              checked={soloActivos}
              onChange={(evento) => {
                setSoloActivos(evento.target.checked);
                setPagina(1);
              }}
            />
          </div>
        </Panel>

        <Panel sinRelleno>
          <Tabla
            columnas={columnas}
            filas={datos?.items}
            cargando={cargando}
            vacio={
              <EstadoVacio icono={Users} titulo="No se encontraron socios.">
                <p>
                  {texto || idEstado
                    ? "Probá con otro criterio de búsqueda."
                    : "Los socios aparecen acá cuando se registran o cuando los da de alta la administración."}
                </p>
              </EstadoVacio>
            }
          />

          <Paginador resultado={datos} alCambiarPagina={setPagina} />
        </Panel>
      </div>

      {/* La ficha y el plan se montan sólo mientras están abiertos: así cada
          apertura arranca con el formulario y los errores limpios. */}
      {socioAEditar && (
        <DialogoDeFicha
          key={socioAEditar.id}
          socio={socioAEditar}
          estados={estados ?? []}
          objetivosDisponibles={listaDeObjetivos ?? []}
          alCerrar={() => setSocioAEditar(null)}
          alGuardar={() => {
            setSocioAEditar(null);
            recargar();
          }}
        />
      )}

      {socioParaPlan && (
        <DialogoDePlan
          key={socioParaPlan.id}
          socio={socioParaPlan}
          planesDisponibles={listaDePlanes ?? []}
          alCerrar={() => setSocioParaPlan(null)}
          alGuardar={() => {
            setSocioParaPlan(null);
            recargar();
          }}
        />
      )}

      <DialogoAsignarRutina
        key={socioParaRutina?.id ?? "vacio"}
        socio={socioParaRutina}
        alCerrar={() => setSocioParaRutina(null)}
        alGuardar={() => setSocioParaRutina(null)}
      />

      <DialogoAsignarDieta
        key={socioParaDieta?.id ?? "vacio"}
        socio={socioParaDieta}
        alCerrar={() => setSocioParaDieta(null)}
        alGuardar={() => setSocioParaDieta(null)}
      />

      <DialogoCargarMedicion
        key={socioParaMedicion?.id ?? "vacio"}
        socio={socioParaMedicion}
        alCerrar={() => setSocioParaMedicion(null)}
        alGuardar={() => setSocioParaMedicion(null)}
      />
    </>
  );
}

/** Edición de la ficha: estado, objetivo, fecha de nacimiento y observaciones. */
function DialogoDeFicha({ socio, estados, objetivosDisponibles, alCerrar, alGuardar }) {
  const guardar = useAccion((id, datos) => socios.actualizar(id, datos));

  const [formulario, setFormulario] = useState(() => ({
    idEstado: socio.idEstado,
    idObjetivo: socio.idObjetivo ?? "",
    fechaNacimiento: socio.fechaNacimiento ?? "",
    observaciones: socio.observaciones ?? "",
  }));

  const cambiar = (campo) => (evento) =>
    setFormulario({ ...formulario, [campo]: evento.target.value });

  async function confirmar() {
    const resultado = await guardar.ejecutar(socio.id, {
      idEstado: Number(formulario.idEstado),
      idObjetivo: formulario.idObjetivo ? Number(formulario.idObjetivo) : null,
      fechaNacimiento: formulario.fechaNacimiento || null,
      observaciones: formulario.observaciones || null,
    });

    if (resultado) alGuardar();
  }

  return (
    <Dialogo
      abierto
      titulo={`Ficha de ${socio.nombreCompleto}`}
      descripcion={`Socio de ${socio.sucursal}${socio.numeroSocio ? `, n.º ${socio.numeroSocio}` : ""}`}
      alCerrar={alCerrar}
      pie={
        <>
          <Boton variante="fantasma" onClick={alCerrar}>
            Cancelar
          </Boton>

          <Boton variante="principal" enCurso={guardar.enCurso} onClick={confirmar}>
            Guardar cambios
          </Boton>
        </>
      }
    >
      <div className="pila">
        <AvisoDeError error={guardar.error} />

        <div className="rejilla-formulario">
          <Seleccion
            etiqueta="Estado"
            value={formulario.idEstado}
            onChange={cambiar("idEstado")}
            opciones={estados.map((estado) => ({ valor: estado.id, texto: estado.nombre }))}
          />

          <Seleccion
            etiqueta="Objetivo"
            value={formulario.idObjetivo}
            onChange={cambiar("idObjetivo")}
            vacio="Sin definir"
            opciones={objetivosDisponibles.map((objetivo) => ({
              valor: objetivo.id,
              texto: objetivo.nombre,
            }))}
          />

          <Campo
            etiqueta="Fecha de nacimiento"
            type="date"
            value={formulario.fechaNacimiento}
            onChange={cambiar("fechaNacimiento")}
            ayuda={
              formulario.fechaNacimiento ? `${edad(formulario.fechaNacimiento)} años` : undefined
            }
          />
        </div>

        <AreaDeTexto
          etiqueta="Observaciones"
          value={formulario.observaciones}
          onChange={cambiar("observaciones")}
          placeholder="Lesiones, indicaciones médicas, acuerdos de pago"
          ancho
        />
      </div>
    </Dialogo>
  );
}

/** Asignación o cambio de plan de un socio. */
function DialogoDePlan({ socio, planesDisponibles, alCerrar, alGuardar }) {
  const asignar = useAccion((datos) => membresias.asignar(datos));

  const [idPlan, setIdPlan] = useState("");
  const [precio, setPrecio] = useState("");

  const planElegido = planesDisponibles.find((plan) => String(plan.id) === String(idPlan));

  async function confirmar() {
    const resultado = await asignar.ejecutar({
      idSocio: socio.id,
      idPlan: Number(idPlan),
      precioAcordado: precio ? Number(precio) : null,
    });

    if (resultado) alGuardar();
  }

  return (
    <Dialogo
      abierto
      titulo={`Plan de ${socio.nombreCompleto}`}
      descripcion={
        socio.planActivo
          ? `Hoy tiene el plan ${socio.planActivo}. Al asignar otro, el anterior se cierra y queda en el historial.`
          : "El socio todavía no tiene un plan asignado."
      }
      alCerrar={alCerrar}
      pie={
        <>
          <Boton variante="fantasma" onClick={alCerrar}>
            Cancelar
          </Boton>

          <Boton
            variante="principal"
            enCurso={asignar.enCurso}
            disabled={!idPlan}
            onClick={confirmar}
          >
            Asignar el plan
          </Boton>
        </>
      }
    >
      <div className="pila">
        <AvisoDeError error={asignar.error} />

        <Seleccion
          etiqueta="Plan"
          value={idPlan}
          onChange={(evento) => setIdPlan(evento.target.value)}
          vacio="Elegí un plan"
          opciones={planesDisponibles.map((plan) => ({
            valor: plan.id,
            texto: `${plan.nombre} — ${moneda(plan.precio)}`,
          }))}
        />

        <Campo
          etiqueta="Precio acordado"
          type="number"
          min={0}
          value={precio}
          onChange={(evento) => setPrecio(evento.target.value)}
          placeholder={planElegido ? String(planElegido.precio) : ""}
          ayuda="Dejalo vacío para usar el precio de lista. Sirve para promociones o convenios."
        />
      </div>
    </Dialogo>
  );
}
