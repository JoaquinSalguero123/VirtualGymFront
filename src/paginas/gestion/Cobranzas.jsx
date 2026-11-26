import { useState } from "react";
import { Check, Mail, Receipt } from "lucide-react";

import { formasDePago, pagos, planes, socios } from "../../api/endpoints.js";
import { usePeticion } from "../../hooks/usePeticion.js";
import { useAccion } from "../../hooks/useAccion.js";
import { mesesDelAnio, moneda, nombreDeMes, numero } from "../../dominio/formato.js";
import { constanciaDePagoEnBase64 } from "../../dominio/pdf.js";
import { EncabezadoDePagina } from "../../componentes/estructura/EncabezadoDePagina.jsx";
import { Boton } from "../../componentes/ui/Boton.jsx";
import { AreaDeTexto, Campo, Seleccion } from "../../componentes/ui/Campo.jsx";
import { Panel } from "../../componentes/ui/Panel.jsx";
import { Metrica } from "../../componentes/ui/Metrica.jsx";
import { Tabla, Paginador } from "../../componentes/ui/Tabla.jsx";
import { Pestanas } from "../../componentes/ui/Pestanas.jsx";
import { Dialogo } from "../../componentes/ui/Dialogo.jsx";
import { AvisoDeError } from "../../componentes/ui/Aviso.jsx";
import { EstadoDePago } from "../../componentes/ui/Insignia.jsx";
import { Cargando, EstadoVacio } from "../../componentes/ui/Estados.jsx";

/**
 * Casos de uso "Aprobar o rechazar pagos pendientes" y "Ver la administración
 * de pagos", más el cobro en mostrador.
 *
 * Se organiza en pestañas porque son tres tareas distintas sobre el mismo
 * tema: revisar lo que entró, ver el año completo y cobrar de mano.
 */
export default function Cobranzas() {
  const anioActual = new Date().getFullYear();

  const [pestana, setPestana] = useState("pendientes");
  const [anio, setAnio] = useState(anioActual);
  const [cobroAbierto, setCobroAbierto] = useState(false);

  const { datos: resumen, recargar: recargarResumen } = usePeticion(
    () => pagos.resumen({ anio }),
    [anio],
  );

  /* Se piden acá y no dentro del diálogo, para que abrirlo no vuelva a traer el padrón. */
  const { datos: padron } = usePeticion(() => socios.listar({ tamanioPagina: 200 }), []);
  const { datos: listaDePlanes } = usePeticion(() => planes.listar(), []);
  const { datos: formas } = usePeticion(() => formasDePago.listar(), []);

  return (
    <>
      <EncabezadoDePagina
        titulo="Cobranzas"
        descripcion="Cuotas de la sucursal activa."
        acciones={
          <>
            <Seleccion
              value={anio}
              onChange={(evento) => setAnio(Number(evento.target.value))}
              opciones={[anioActual + 1, anioActual, anioActual - 1, anioActual - 2].map((a) => ({
                valor: a,
                texto: a,
              }))}
            />

            <Boton variante="principal" icono={Receipt} onClick={() => setCobroAbierto(true)}>
              Cobrar en mostrador
            </Boton>
          </>
        }
      />

      <div className="pila">
        {resumen && (
          <div className="tablero__cifras">
            <Metrica
              valor={numero(resumen.cuotasPagadas)}
              etiqueta={`Cuotas cobradas en ${anio}`}
              detalle={`${numero(resumen.cuotasPendientes)} esperando aprobación`}
            />

            <Metrica
              valor={moneda(resumen.recaudacionAnual)}
              etiqueta="Recaudación del año"
              detalle={`${moneda(resumen.recaudacionDelMes)} en ${nombreDeMes(resumen.mes).toLowerCase()}`}
              acento
            />

            <Metrica
              valor={moneda(resumen.montoPendienteDeAprobacion)}
              etiqueta="Cargado sin confirmar"
            />

            <Metrica
              valor={numero(resumen.sociosConDeuda)}
              etiqueta={`Deben ${nombreDeMes(resumen.mes).toLowerCase()}`}
              detalle={`de ${numero(resumen.sociosActivos)} socios activos`}
            />
          </div>
        )}

        <Pestanas
          activa={pestana}
          alCambiar={setPestana}
          pestanas={[
            { clave: "pendientes", texto: "Por aprobar" },
            { clave: "anual", texto: `Grilla ${anio}` },
            { clave: "listado", texto: "Todos los pagos" },
          ]}
        />

        {pestana === "pendientes" && <PagosPendientes alCambiar={recargarResumen} />}
        {pestana === "anual" && <GrillaAnual anio={anio} />}
        {pestana === "listado" && <ListadoDePagos anio={anio} />}
      </div>

      {/* Se monta sólo mientras está abierto: así cada cobro arranca con el
          formulario vacío y no con los datos del socio anterior. */}
      {cobroAbierto && (
        <DialogoDeCobro
          sociosDisponibles={padron?.items ?? []}
          planesDisponibles={listaDePlanes ?? []}
          formasDisponibles={formas ?? []}
          alCerrar={() => setCobroAbierto(false)}
          alCobrar={() => {
            setCobroAbierto(false);
            recargarResumen();
          }}
        />
      )}
    </>
  );
}

/** Bandeja de pagos que cargó el socio y esperan confirmación. */
function PagosPendientes({ alCambiar }) {
  const [pagina, setPagina] = useState(1);
  const { datos, cargando, recargar } = usePeticion(
    () => pagos.pendientes({ pagina, tamanioPagina: 15 }),
    [pagina],
  );

  const [aRechazar, setARechazar] = useState(null);
  const aprobar = useAccion((id) => pagos.cambiarEstado(id, { estado: "Pagado" }));

  const refrescar = () => {
    recargar();
    alCambiar();
  };

  const columnas = [
    {
      clave: "socio",
      titulo: "Socio",
      principal: true,
      celda: (pago) => (
        <>
          {pago.socio}
          <span className="texto-tenue" style={{ display: "block" }}>
            {pago.numeroSocio ? `N.º ${pago.numeroSocio}` : pago.username}
          </span>
        </>
      ),
    },
    { clave: "periodo", titulo: "Período", celda: (pago) => `${pago.mes} ${pago.periodoAnio}` },
    { clave: "plan", titulo: "Plan", celda: (pago) => pago.plan ?? "—" },
    { clave: "forma", titulo: "Forma de pago", celda: (pago) => pago.formaPago },
    {
      clave: "comprobante",
      titulo: "Comprobante",
      celda: (pago) => pago.comprobante ?? <span className="texto-tenue">—</span>,
    },
    { clave: "monto", titulo: "Monto", numerica: true, celda: (pago) => moneda(pago.monto) },
    {
      clave: "acciones",
      titulo: "",
      acciones: true,
      celda: (pago) => (
        <div className="fila" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
          <Boton variante="peligro" onClick={() => setARechazar(pago)}>
            Rechazar
          </Boton>

          <Boton
            variante="principal"
            enCurso={aprobar.enCurso}
            onClick={async () => {
              if (await aprobar.ejecutar(pago.id)) refrescar();
            }}
          >
            Aprobar
          </Boton>
        </div>
      ),
    },
  ];

  return (
    <>
      <AvisoDeError error={aprobar.error} />

      <Panel sinRelleno>
        <Tabla
          columnas={columnas}
          filas={datos?.items}
          cargando={cargando}
          vacio={
            <EstadoVacio icono={Receipt} titulo="No hay cuotas esperando aprobación.">
              <p>Cuando un socio cargue un pago desde su cuenta, va a aparecer acá.</p>
            </EstadoVacio>
          }
        />

        <Paginador resultado={datos} alCambiarPagina={setPagina} />
      </Panel>

      {/* Se monta sólo mientras está abierto: así el motivo y los errores de un
          pago no se arrastran al siguiente que se rechace. */}
      {aRechazar && (
        <DialogoDeRechazo
          key={aRechazar.id}
          pago={aRechazar}
          alCerrar={() => setARechazar(null)}
          alRechazar={() => {
            setARechazar(null);
            refrescar();
          }}
        />
      )}
    </>
  );
}

/** Pide el motivo del rechazo: el socio lo ve en su pantalla de cuotas. */
function DialogoDeRechazo({ pago, alCerrar, alRechazar }) {
  const [motivo, setMotivo] = useState("");
  const rechazar = useAccion((id, datos) => pagos.cambiarEstado(id, datos));

  return (
    <Dialogo
      abierto
      titulo="Rechazar el pago"
      descripcion={`${pago.socio} · ${pago.mes} ${pago.periodoAnio} · ${moneda(pago.monto)}`}
      alCerrar={alCerrar}
      pie={
        <>
          <Boton variante="fantasma" onClick={alCerrar}>
            Cancelar
          </Boton>

          <Boton
            variante="peligro"
            enCurso={rechazar.enCurso}
            onClick={async () => {
              const ok = await rechazar.ejecutar(pago.id, {
                estado: "Rechazado",
                observaciones: motivo || null,
              });

              if (ok) alRechazar();
            }}
          >
            Rechazar el pago
          </Boton>
        </>
      }
    >
      <div className="pila">
        <AvisoDeError error={rechazar.error} />

        <AreaDeTexto
          etiqueta="Motivo del rechazo"
          value={motivo}
          onChange={(evento) => setMotivo(evento.target.value)}
          placeholder="Por ejemplo: no se encontró la transferencia con ese número de comprobante"
          ayuda="El socio va a ver este texto en su pantalla de cuotas, así que conviene ser concreto."
          ancho
        />
      </div>
    </Dialogo>
  );
}

/** Grilla anual: un renglón por socio y una columna por mes. */
function GrillaAnual({ anio }) {
  const { datos, cargando } = usePeticion(() => pagos.grillaAnual({ anio }), [anio]);

  if (cargando) return <Cargando />;

  if (!datos || datos.length === 0) {
    return (
      <Panel>
        <EstadoVacio icono={Receipt} titulo="Todavía no hay socios en esta sucursal." />
      </Panel>
    );
  }

  return (
    <Panel sinRelleno>
      <div className="tabla-envoltorio">
        <table className="tabla grilla-anual">
          <thead>
            <tr>
              <th>Socio</th>
              <th>Plan</th>

              {mesesDelAnio().map((mes) => (
                <th key={mes.numero} style={{ textAlign: "center" }} title={mes.nombre}>
                  {mes.nombre.slice(0, 1)}
                </th>
              ))}

              <th className="tabla__numero">Pagado</th>
            </tr>
          </thead>

          <tbody>
            {datos.map((fila) => (
              <tr key={fila.idSocio}>
                <td className="tabla__principal">{fila.socio}</td>
                <td className="texto-tenue">{fila.plan}</td>

                {fila.estadoPorMes.map((estado, indice) => (
                  <td key={indice} style={{ padding: 2 }}>
                    <span
                      className={`grilla-anual__celda grilla-anual__celda--${estado ? estado.toLowerCase() : "vacio"}`}
                      title={`${nombreDeMes(indice + 1)}: ${estado ?? "sin cargar"}`}
                    >
                      {estado ? estado.slice(0, 1) : "·"}
                    </span>
                  </td>
                ))}

                <td className="tabla__numero">{moneda(fila.totalPagado)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="paginador">
        <span>
          Referencias: P pagado · P pendiente · R rechazado · V vencido · A anulado
        </span>
      </div>
    </Panel>
  );
}

/** Listado completo con filtros, para buscar un pago puntual. */
function ListadoDePagos({ anio }) {
  const [mes, setMes] = useState("");
  const [pagina, setPagina] = useState(1);
  const [idRecienEnviado, setIdRecienEnviado] = useState(null);

  const { datos, cargando } = usePeticion(
    () => pagos.listar({ anio, mes: mes || undefined, pagina, tamanioPagina: 20 }),
    [anio, mes, pagina],
  );

  /* El PDF se arma en el navegador (mismo criterio que la rutina o el plan de
     alimentación) y se manda en base64 para que el backend lo adjunte al mail. */
  const enviar = useAccion(async (pago) => {
    const pdfBase64 = await constanciaDePagoEnBase64(pago);

    return pagos.enviarConstancia(pago.id, { pdfBase64 });
  });

  async function enviarConstancia(pago) {
    setIdRecienEnviado(null);
    if (await enviar.ejecutar(pago)) setIdRecienEnviado(pago.id);
  }

  const columnas = [
    { clave: "socio", titulo: "Socio", principal: true, celda: (pago) => pago.socio },
    { clave: "periodo", titulo: "Período", celda: (pago) => `${pago.mes} ${pago.periodoAnio}` },
    { clave: "plan", titulo: "Plan", celda: (pago) => pago.plan ?? "—" },
    { clave: "forma", titulo: "Forma de pago", celda: (pago) => pago.formaPago },
    {
      clave: "estado",
      titulo: "Estado",
      celda: (pago) => <EstadoDePago estado={pago.estado} />,
    },
    { clave: "monto", titulo: "Monto", numerica: true, celda: (pago) => moneda(pago.monto) },
    {
      clave: "acciones",
      titulo: "",
      acciones: true,
      celda: (pago) =>
        pago.estado === "Pagado" && (
          <Boton
            variante="fantasma"
            soloIcono
            title="Enviar la constancia por mail"
            aria-label={`Enviar por mail la constancia de ${pago.socio}`}
            enCurso={enviar.enCurso}
            onClick={() => enviarConstancia(pago)}
          >
            {idRecienEnviado === pago.id ? <Check size={15} /> : <Mail size={15} />}
          </Boton>
        ),
    },
  ];

  return (
    <div className="pila">
      <AvisoDeError error={enviar.error} />

      <Panel ajustado>
        <div className="filtros">
          <Seleccion
            etiqueta="Mes"
            value={mes}
            onChange={(evento) => {
              setMes(evento.target.value);
              setPagina(1);
            }}
            vacio="Todo el año"
            opciones={mesesDelAnio().map((m) => ({ valor: m.numero, texto: m.nombre }))}
          />
        </div>
      </Panel>

      <Panel sinRelleno>
        <Tabla
          columnas={columnas}
          filas={datos?.items}
          cargando={cargando}
          vacio={<EstadoVacio icono={Receipt} titulo="No hay pagos con esos filtros." />}
        />

        <Paginador resultado={datos} alCambiarPagina={setPagina} />
      </Panel>
    </div>
  );
}

/** Cobro tomado en el mostrador: se registra ya aprobado. */
function DialogoDeCobro({
  sociosDisponibles,
  planesDisponibles,
  formasDisponibles,
  alCerrar,
  alCobrar,
}) {
  const hoy = new Date();

  const [formulario, setFormulario] = useState({
    idSocio: "",
    mes: hoy.getMonth() + 1,
    anio: hoy.getFullYear(),
    idPlan: "",
    idFormaPago: "",
    monto: "",
    comprobante: "",
  });

  const cobrar = useAccion((datos) => pagos.cobroPresencial(datos));

  const cambiar = (campo) => (evento) =>
    setFormulario((anterior) => ({ ...anterior, [campo]: evento.target.value }));

  const planElegido = planesDisponibles.find(
    (plan) => String(plan.id) === String(formulario.idPlan),
  );

  async function confirmar() {
    const resultado = await cobrar.ejecutar({
      idSocio: Number(formulario.idSocio),
      mes: Number(formulario.mes),
      anio: Number(formulario.anio),
      idPlan: Number(formulario.idPlan),
      idFormaPago: Number(formulario.idFormaPago),
      monto: formulario.monto ? Number(formulario.monto) : null,
      comprobante: formulario.comprobante || null,
    });

    if (resultado) alCobrar();
  }

  const completo = formulario.idSocio && formulario.idPlan && formulario.idFormaPago;

  return (
    <Dialogo
      abierto
      titulo="Cobrar en mostrador"
      descripcion="El pago se registra ya aprobado, porque lo estás recibiendo vos."
      alCerrar={alCerrar}
      pie={
        <>
          <Boton variante="fantasma" onClick={alCerrar}>
            Cancelar
          </Boton>

          <Boton
            variante="principal"
            enCurso={cobrar.enCurso}
            disabled={!completo}
            onClick={confirmar}
          >
            Registrar el cobro
          </Boton>
        </>
      }
    >
      <div className="pila">
        <AvisoDeError error={cobrar.error} />

        <Seleccion
          etiqueta="Socio"
          value={formulario.idSocio}
          onChange={cambiar("idSocio")}
          vacio="Elegí el socio"
          opciones={sociosDisponibles.map((socio) => ({
            valor: socio.id,
            texto: `${socio.nombreCompleto}${socio.numeroSocio ? ` — n.º ${socio.numeroSocio}` : ""}`,
          }))}
          ancho
        />

        <div className="rejilla-formulario">
          <Seleccion
            etiqueta="Mes"
            value={formulario.mes}
            onChange={cambiar("mes")}
            opciones={mesesDelAnio().map((m) => ({ valor: m.numero, texto: m.nombre }))}
          />

          <Campo etiqueta="Año" type="number" value={formulario.anio} onChange={cambiar("anio")} />
        </div>

        <div className="rejilla-formulario">
          <Seleccion
            etiqueta="Plan"
            value={formulario.idPlan}
            onChange={cambiar("idPlan")}
            vacio="Elegí el plan"
            opciones={planesDisponibles.map((plan) => ({
              valor: plan.id,
              texto: `${plan.nombre} — ${moneda(plan.precio)}`,
            }))}
          />

          <Seleccion
            etiqueta="Forma de pago"
            value={formulario.idFormaPago}
            onChange={cambiar("idFormaPago")}
            vacio="Cómo pagó"
            opciones={formasDisponibles.map((forma) => ({ valor: forma.id, texto: forma.nombre }))}
          />
        </div>

        <div className="rejilla-formulario">
          <Campo
            etiqueta="Monto cobrado"
            type="number"
            min={0}
            value={formulario.monto}
            onChange={cambiar("monto")}
            placeholder={planElegido ? String(planElegido.precio) : ""}
            ayuda="Dejalo vacío para cobrar el precio del plan."
          />

          <Campo
            etiqueta="Comprobante"
            value={formulario.comprobante}
            onChange={cambiar("comprobante")}
            ayuda="Opcional"
          />
        </div>
      </div>
    </Dialogo>
  );
}
