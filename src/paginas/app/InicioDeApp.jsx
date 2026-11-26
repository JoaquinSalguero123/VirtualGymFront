import { Link } from "react-router-dom";
import { Apple, CalendarCheck, Dumbbell, Receipt, Users, Wallet } from "lucide-react";

import {
  asistencias,
  dietas,
  pagos,
  rutinasDeSocio,
  socios,
} from "../../api/endpoints.js";
import { useSesion } from "../../contexto/SesionContexto.jsx";
import { usePeticion } from "../../hooks/usePeticion.js";
import { useAccion } from "../../hooks/useAccion.js";
import { moneda, nombreDeMes, numero } from "../../dominio/formato.js";
import { EncabezadoDePagina } from "../../componentes/estructura/EncabezadoDePagina.jsx";
import { Boton } from "../../componentes/ui/Boton.jsx";
import { Panel } from "../../componentes/ui/Panel.jsx";
import { Metrica } from "../../componentes/ui/Metrica.jsx";
import { AvisoDeError } from "../../componentes/ui/Aviso.jsx";
import { EstadoDePago, Insignia } from "../../componentes/ui/Insignia.jsx";
import { Cargando, EstadoVacio } from "../../componentes/ui/Estados.jsx";
import { ROLES } from "../../dominio/roles.js";

/**
 * Pantalla de inicio de la aplicación.
 *
 * Muestra una cosa distinta según desde dónde esté operando la persona: el
 * personal ve el pulso de la sucursal y el socio ve su propio estado.
 */
export default function InicioDeApp() {
  const { usuario, esPersonal, sucursalActiva } = useSesion();

  const primerNombre = usuario?.nombre?.split(" ")[0] ?? "";

  return (
    <>
      <EncabezadoDePagina
        titulo={`Hola, ${primerNombre}`}
        descripcion={
          sucursalActiva
            ? `Estás operando en ${sucursalActiva.gimnasio} como ${sucursalActiva.rol.toLowerCase()}.`
            : "Todavía no tenés una sucursal asignada."
        }
      />

      {esPersonal ? <TableroDeSucursal /> : <TableroDeSocio />}
    </>
  );
}

/* =====================================================================
   Tablero del personal
   ===================================================================== */

function TableroDeSucursal() {
  const { tieneRol } = useSesion();
  const puedeVerCobranzas = tieneRol(ROLES.recepcionista, ROLES.administrador);

  const { datos: cobranza, cargando: cargandoCobranza } = usePeticion(
    () => (puedeVerCobranzas ? pagos.resumen() : Promise.resolve({ data: null })),
    [puedeVerCobranzas],
  );

  const { datos: concurrencia } = usePeticion(() => asistencias.resumen(), []);

  const { datos: pendientes, recargar: recargarPendientes } = usePeticion(
    () => (puedeVerCobranzas ? pagos.pendientes({ tamanioPagina: 5 }) : Promise.resolve({ data: null })),
    [puedeVerCobranzas],
  );

  if (cargandoCobranza) return <Cargando />;

  return (
    <div className="tablero">
      <div className="tablero__cifras">
        {cobranza && (
          <>
            <Metrica
              valor={numero(cobranza.sociosActivos)}
              etiqueta="Socios activos"
              detalle={`${numero(cobranza.sociosTotales)} en el padrón`}
            />

            <Metrica
              valor={numero(cobranza.sociosAlDia)}
              etiqueta={`Al día en ${nombreDeMes(cobranza.mes).toLowerCase()}`}
              detalle={`${numero(cobranza.sociosConDeuda)} con la cuota pendiente`}
              acento
            />

            <Metrica
              valor={moneda(cobranza.recaudacionDelMes)}
              etiqueta="Recaudado este mes"
              detalle={`${moneda(cobranza.recaudacionAnual)} en el año`}
            />
          </>
        )}

        {concurrencia && (
          <Metrica
            valor={numero(concurrencia.sociosDistintosHoy)}
            etiqueta="Vinieron hoy"
            detalle={`${numero(concurrencia.sociosEnElGimnasio)} están en el gimnasio`}
          />
        )}
      </div>

      <div className="tablero__columnas">
        {puedeVerCobranzas && (
          <PagosPorAprobar resultado={pendientes} alAprobar={recargarPendientes} />
        )}

        <Panel titulo="Accesos rápidos">
          <div className="pila-corta">
            <Link to="/app/socios" className="boton boton--secundario boton--bloque">
              <Users size={15} /> Ver el padrón de socios
            </Link>

            <Link to="/app/control-de-acceso" className="boton boton--secundario boton--bloque">
              <CalendarCheck size={15} /> Control de acceso
            </Link>

            {puedeVerCobranzas && (
              <Link to="/app/cobranzas" className="boton boton--secundario boton--bloque">
                <Receipt size={15} /> Cobranzas del año
              </Link>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/** Bandeja de los últimos pagos que esperan confirmación del mostrador. */
function PagosPorAprobar({ resultado, alAprobar }) {
  const aprobar = useAccion((id) => pagos.cambiarEstado(id, { estado: "Pagado" }));

  const filas = resultado?.items ?? [];

  return (
    <Panel
      titulo="Cuotas por aprobar"
      descripcion="Pagos que cargaron los socios y todavía no se confirmaron."
      acciones={
        filas.length > 0 && (
          <Link to="/app/cobranzas" className="boton boton--fantasma">
            Ver todas
          </Link>
        )
      }
    >
      <AvisoDeError error={aprobar.error} />

      {filas.length === 0 ? (
        <EstadoVacio icono={Receipt} titulo="No hay cuotas esperando aprobación.">
          <p>Cuando un socio cargue un pago, va a aparecer acá para que lo revises.</p>
        </EstadoVacio>
      ) : (
        <div className="pila-corta">
          {filas.map((pago) => (
            <div className="fila-separada" key={pago.id}>
              <div>
                <span className="tabla__principal">{pago.socio}</span>
                <span className="texto-tenue" style={{ display: "block" }}>
                  {pago.mes} {pago.periodoAnio} · {pago.plan ?? "sin plan"} · {pago.formaPago}
                </span>
              </div>

              <div className="fila">
                <span className="cifra">{moneda(pago.monto)}</span>

                <Boton
                  variante="principal"
                  enCurso={aprobar.enCurso}
                  onClick={async () => {
                    if (await aprobar.ejecutar(pago.id)) alAprobar();
                  }}
                >
                  Aprobar
                </Boton>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

/* =====================================================================
   Tablero del socio
   ===================================================================== */

function TableroDeSocio() {
  const anio = new Date().getFullYear();
  const mes = new Date().getMonth() + 1;

  const { datos: ficha, cargando, error } = usePeticion(() => socios.miFicha(), []);
  const { datos: misPagos } = usePeticion(() => pagos.mios({ anio }), [anio]);
  const { datos: misAsistencias, recargar: recargarAsistencias } = usePeticion(
    () => asistencias.mias({ anio, mes }),
    [anio, mes],
  );
  const { datos: rutina } = usePeticion(() => rutinasDeSocio.mia(), []);
  const { datos: dieta } = usePeticion(() => dietas.mia(), []);

  const marcar = useAccion(() => asistencias.marcar());

  if (cargando) return <Cargando />;

  /* Sin ficha de socio en esta sucursal no hay nada que mostrar. Pasa, por
     ejemplo, con un administrador que opera una sede donde no es socio. */
  if (error?.estado === 404) {
    return (
      <Panel>
        <EstadoVacio
          icono={Users}
          titulo="Todavía no sos socio de esta sucursal."
        >
          <p>
            Tu ficha se crea automáticamente la primera vez que pagás una cuota o
            marcás asistencia acá. También podés cambiar de sucursal desde el
            selector de arriba a la izquierda.
          </p>
        </EstadoVacio>
      </Panel>
    );
  }

  const pagoDelMes = misPagos?.find((pago) => pago.periodoMes === mes);
  const diasAsistidos = misAsistencias?.length ?? 0;
  const vinoHoy = misAsistencias?.some(
    (asistencia) => asistencia.fecha === new Date().toISOString().slice(0, 10),
  );

  return (
    <div className="tablero">
      {/* La acción del día va primero: es lo que el socio viene a hacer. */}
      <div className="accion-rapida">
        <span className="accion-rapida__texto">
          {vinoHoy ? "Ya registraste tu entrada de hoy" : "Registrá tu entrada"}
          <span className="accion-rapida__detalle">
            {vinoHoy
              ? `Llevás ${diasAsistidos} ${diasAsistidos === 1 ? "día" : "días"} este mes`
              : "Marcá tu asistencia al llegar al gimnasio"}
          </span>
        </span>

        {!vinoHoy && (
          <Boton
            variante="principal"
            enCurso={marcar.enCurso}
            onClick={async () => {
              if (await marcar.ejecutar()) recargarAsistencias();
            }}
          >
            Marcar asistencia
          </Boton>
        )}
      </div>

      {marcar.error && <AvisoDeError error={marcar.error} />}

      <div className="tablero__cifras">
        <Metrica
          valor={ficha?.estado ?? "—"}
          etiqueta="Mi estado"
          detalle={ficha?.numeroSocio ? `Socio n.º ${ficha.numeroSocio}` : undefined}
          chica
        />

        <Metrica
          valor={diasAsistidos}
          etiqueta={`Días en ${nombreDeMes(mes).toLowerCase()}`}
          acento
        />

        <Metrica
          valor={ficha?.planActivo ?? "Sin plan"}
          etiqueta="Mi plan"
          detalle={ficha?.precioPlanActivo ? moneda(ficha.precioPlanActivo) : undefined}
          chica
        />
      </div>

      <div className="tablero__columnas">
        <div className="pila">
          <Panel
            titulo={`Cuota de ${nombreDeMes(mes).toLowerCase()}`}
            acciones={
              <Link to="/app/cuotas" className="boton boton--fantasma">
                Ver todas
              </Link>
            }
          >
            {pagoDelMes ? (
              <div className="fila-separada">
                <div>
                  <EstadoDePago estado={pagoDelMes.estado} />
                  <span className="texto-tenue" style={{ display: "block", marginTop: 4 }}>
                    {pagoDelMes.plan} · {pagoDelMes.formaPago}
                  </span>
                </div>

                <span className="cifra-grande">{moneda(pagoDelMes.monto)}</span>
              </div>
            ) : (
              <EstadoVacio icono={Wallet} titulo="No cargaste la cuota de este mes.">
                <p>Podés pagarla desde la pantalla de cuotas y el mostrador la confirma.</p>
                <Link to="/app/cuotas" className="boton boton--principal">
                  Pagar mi cuota
                </Link>
              </EstadoVacio>
            )}
          </Panel>

          <Panel
            titulo="Mi rutina"
            acciones={
              <Link to="/app/rutina" className="boton boton--fantasma">
                Ver la rutina
              </Link>
            }
          >
            {rutina ? (
              <div className="fila-separada">
                <div>
                  <span className="tabla__principal">{rutina.nombre}</span>
                  <span className="texto-tenue" style={{ display: "block" }}>
                    {rutina.dias.length} {rutina.dias.length === 1 ? "día" : "días"} por semana
                    {rutina.entrenador ? ` · la armó ${rutina.entrenador}` : ""}
                  </span>
                </div>

                {rutina.activa && <Insignia tono="ok">Vigente</Insignia>}
              </div>
            ) : (
              <EstadoVacio icono={Dumbbell} titulo="Todavía no tenés rutina.">
                <p>Generá una en un minuto según tu objetivo, o armala día por día.</p>
                <Link to="/app/rutina" className="boton boton--principal">
                  Armar mi rutina
                </Link>
              </EstadoVacio>
            )}
          </Panel>
        </div>

        <Panel
          titulo="Mi alimentación"
          acciones={
            <Link to="/app/alimentacion" className="boton boton--fantasma">
              Ver el plan
            </Link>
          }
        >
          {dieta ? (
            <div>
              <span className="tabla__principal">{dieta.nombre}</span>
              <span className="texto-tenue" style={{ display: "block" }}>
                {dieta.dias.length} {dieta.dias.length === 1 ? "día" : "días"}
                {dieta.objetivo ? ` · ${dieta.objetivo}` : ""}
                {dieta.nutricionista ? ` · lo armó ${dieta.nutricionista}` : ""}
              </span>
            </div>
          ) : (
            <EstadoVacio icono={Apple} titulo="Todavía no tenés plan de comidas.">
              <p>Generá uno según tu objetivo.</p>
              <Link to="/app/alimentacion" className="boton boton--principal">
                Armar mi plan
              </Link>
            </EstadoVacio>
          )}
        </Panel>
      </div>
    </div>
  );
}
