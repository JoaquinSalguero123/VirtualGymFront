import { useState } from "react";
import { Download } from "lucide-react";
import { formasDePago, pagos, planes, socios } from "../../api/endpoints.js";
import { usePeticion } from "../../hooks/usePeticion.js";
import { useAccion } from "../../hooks/useAccion.js";
import { mesesDelAnio, moneda, nombreDeMes } from "../../dominio/formato.js";
import { descargarConstanciaDePagoEnPdf } from "../../dominio/pdf.js";
import { EncabezadoDePagina } from "../../componentes/estructura/EncabezadoDePagina.jsx";
import { Boton } from "../../componentes/ui/Boton.jsx";
import { Campo, Seleccion } from "../../componentes/ui/Campo.jsx";
import { Panel } from "../../componentes/ui/Panel.jsx";
import { Dialogo } from "../../componentes/ui/Dialogo.jsx";
import { Aviso, AvisoDeError } from "../../componentes/ui/Aviso.jsx";
import { Metrica } from "../../componentes/ui/Metrica.jsx";
import { Cargando } from "../../componentes/ui/Estados.jsx";

/* Estados desde los que se puede volver a cargar el pago del mes. */
const SE_PUEDE_REINTENTAR = ["Rechazado", "Vencido", "Anulado"];

/**
 * Casos de uso "Pagar la cuota mensual", "Reintentar un pago rechazado" y
 * "Consultar el estado de sus pagos".
 *
 * La vista central es la grilla de los doce meses: de un vistazo se ve qué se
 * pagó, qué está esperando aprobación y qué falta.
 */
export default function MisCuotas() {
  const anioActual = new Date().getFullYear();
  const mesActual = new Date().getMonth() + 1;

  const [anio, setAnio] = useState(anioActual);
  const [mesAPagar, setMesAPagar] = useState(null);

  const { datos: misPagos, cargando, recargar } = usePeticion(() => pagos.mios({ anio }), [anio]);
  const { datos: ficha } = usePeticion(() => socios.miFicha().catch(() => ({ data: null })), []);
  const { datos: listaDePlanes } = usePeticion(() => planes.listar(), []);
  const { datos: formas } = usePeticion(() => formasDePago.listar(), []);

  const porMes = new Map((misPagos ?? []).map((pago) => [pago.periodoMes, pago]));

  const totalPagado = (misPagos ?? [])
    .filter((pago) => pago.estado === "Pagado")
    .reduce((total, pago) => total + pago.monto, 0);

  const mesesPagados = (misPagos ?? []).filter((pago) => pago.estado === "Pagado").length;

  return (
    <>
      <EncabezadoDePagina
        titulo="Mis cuotas"
        descripcion="Pagás desde acá y el mostrador del gimnasio confirma el pago."
        acciones={
          <Seleccion
            value={anio}
            onChange={(evento) => setAnio(Number(evento.target.value))}
            opciones={[anioActual + 1, anioActual, anioActual - 1, anioActual - 2].map((a) => ({
              valor: a,
              texto: a,
            }))}
          />
        }
      />

      {cargando ? (
        <Cargando />
      ) : (
        <div className="pila">
          <div className="tablero__cifras">
            <Metrica valor={mesesPagados} etiqueta={`Meses pagados en ${anio}`} acento />
            <Metrica valor={moneda(totalPagado)} etiqueta="Total abonado" chica />
            <Metrica
              valor={ficha?.planActivo ?? "Sin plan"}
              etiqueta="Mi plan"
              detalle={ficha?.precioPlanActivo ? moneda(ficha.precioPlanActivo) : undefined}
              chica
            />
          </div>

          <Panel
            titulo={`Los doce meses de ${anio}`}
            descripcion="Tocá un mes sin pagar para cargar la cuota."
          >
            <div className="cuotas">
              {mesesDelAnio().map(({ numero: mes, nombre }) => {
                const pago = porMes.get(mes);
                const estado = pago?.estado;

                /* Un mes se puede pagar si no tiene pago, o si el que tiene
                   quedó rechazado, vencido o anulado. */
                const pagable =
                  !estado || SE_PUEDE_REINTENTAR.includes(estado);

                const clases = [
                  "cuota",
                  estado ? `cuota--${estado.toLowerCase()}` : "cuota--sin-cargar",
                  pagable && "cuota--pagable",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <button
                    key={mes}
                    type="button"
                    className={clases}
                    disabled={!pagable}
                    onClick={() => pagable && setMesAPagar(mes)}
                    title={pagable ? `Cargar la cuota de ${nombre}` : `${nombre}: ${estado}`}
                  >
                    <span className="cuota__mes">{nombre.slice(0, 3)}</span>
                    <span className="cuota__estado">
                      {estado ?? (mes <= mesActual || anio < anioActual ? "Sin pagar" : "—")}
                    </span>
                  </button>
                );
              })}
            </div>
          </Panel>

          <DetalleDePagos pagos={misPagos ?? []} />
        </div>
      )}

      {/* Se monta sólo mientras está abierto: así cada mes arranca con el
          formulario y los errores limpios, sin arrastrar nada del anterior. */}
      {mesAPagar !== null && (
        <DialogoDePago
          key={mesAPagar}
          mes={mesAPagar}
          anio={anio}
          pagoExistente={porMes.get(mesAPagar)}
          planesDisponibles={listaDePlanes ?? []}
          formasDisponibles={formas ?? []}
          alCerrar={() => setMesAPagar(null)}
          alPagar={() => {
            setMesAPagar(null);
            recargar();
          }}
        />
      )}
    </>
  );
}

/** Lista con el detalle de cada pago del año. */
function DetalleDePagos({ pagos: lista }) {
  if (lista.length === 0) return null;

  return (
    <Panel titulo="Detalle" sinRelleno>
      <div className="tabla-envoltorio">
        <table className="tabla">
          <thead>
            <tr>
              <th>Período</th>
              <th>Plan</th>
              <th>Forma de pago</th>
              <th>Estado</th>
              <th className="tabla__numero">Monto</th>
              <th>Observaciones</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {lista.map((pago) => (
              <tr key={pago.id}>
                <td className="tabla__principal">
                  {pago.mes} {pago.periodoAnio}
                </td>
                <td>{pago.plan ?? "—"}</td>
                <td>{pago.formaPago}</td>
                <td>{pago.estado}</td>
                <td className="tabla__numero">{moneda(pago.monto)}</td>
                <td className="texto-tenue">{pago.observaciones ?? "—"}</td>
                <td>
                  {pago.estado === "Pagado" && (
                    <Boton
                      variante="fantasma"
                      soloIcono
                      title="Descargar constancia"
                      aria-label={`Descargar la constancia de ${pago.mes} ${pago.periodoAnio}`}
                      onClick={() => descargarConstanciaDePagoEnPdf(pago)}
                    >
                      <Download size={15} />
                    </Boton>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/** Diálogo para cargar el pago de un mes. */
function DialogoDePago({ mes, anio, pagoExistente, planesDisponibles, formasDisponibles, alCerrar, alPagar }) {
  const [idPlan, setIdPlan] = useState("");
  const [idFormaPago, setIdFormaPago] = useState("");
  const [comprobante, setComprobante] = useState("");

  const registrar = useAccion((datos) => pagos.registrar(datos));

  const planElegido = planesDisponibles.find((plan) => String(plan.id) === String(idPlan));
  const esReintento = Boolean(pagoExistente);

  async function confirmar() {
    const resultado = await registrar.ejecutar({
      mes,
      anio,
      idPlan: Number(idPlan),
      idFormaPago: Number(idFormaPago),
      comprobante: comprobante || null,
    });

    if (resultado) alPagar();
  }

  return (
    <Dialogo
      abierto
      titulo={`Pagar ${nombreDeMes(mes).toLowerCase()} de ${anio}`}
      descripcion="El pago queda pendiente hasta que el mostrador lo confirme."
      alCerrar={alCerrar}
      pie={
        <>
          <Boton variante="fantasma" onClick={alCerrar}>
            Cancelar
          </Boton>

          <Boton
            variante="principal"
            enCurso={registrar.enCurso}
            disabled={!idPlan || !idFormaPago}
            onClick={confirmar}
          >
            {esReintento ? "Reintentar el pago" : "Cargar el pago"}
          </Boton>
        </>
      }
    >
      <div className="pila">
        <AvisoDeError error={registrar.error} />

        {esReintento && (
          <Aviso tono="atencion" titulo={`Este mes figura como ${pagoExistente.estado}.`}>
            {pagoExistente.observaciones
              ? `Motivo: ${pagoExistente.observaciones}`
              : "Podés volver a cargarlo y queda otra vez pendiente de aprobación."}
          </Aviso>
        )}

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

        <Seleccion
          etiqueta="Forma de pago"
          value={idFormaPago}
          onChange={(evento) => setIdFormaPago(evento.target.value)}
          vacio="Elegí cómo vas a pagar"
          opciones={formasDisponibles.map((forma) => ({ valor: forma.id, texto: forma.nombre }))}
        />

        <Campo
          etiqueta="Número de comprobante"
          value={comprobante}
          onChange={(evento) => setComprobante(evento.target.value)}
          ayuda="Opcional. Si transferiste o pagaste con Mercado Pago, ayuda a identificar el pago."
        />

        {planElegido && (
          <div className="fila-separada" style={{ paddingTop: "var(--e-corto)" }}>
            <span className="etiqueta-dato">Total a pagar</span>
            <span className="cifra-grande">{moneda(planElegido.precio)}</span>
          </div>
        )}
      </div>
    </Dialogo>
  );
}
