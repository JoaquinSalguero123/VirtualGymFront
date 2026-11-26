import { useState } from "react";
import { Pencil, Plus, Trash2, Wallet } from "lucide-react";

import { formasDePago } from "../../api/endpoints.js";
import { usePeticion } from "../../hooks/usePeticion.js";
import { useAccion } from "../../hooks/useAccion.js";
import { numero } from "../../dominio/formato.js";
import { EncabezadoDePagina } from "../../componentes/estructura/EncabezadoDePagina.jsx";
import { Boton } from "../../componentes/ui/Boton.jsx";
import { Campo, Casilla } from "../../componentes/ui/Campo.jsx";
import { Panel } from "../../componentes/ui/Panel.jsx";
import { Tabla } from "../../componentes/ui/Tabla.jsx";
import { Dialogo, DialogoDeConfirmacion } from "../../componentes/ui/Dialogo.jsx";
import { AvisoDeError } from "../../componentes/ui/Aviso.jsx";
import { Insignia } from "../../componentes/ui/Insignia.jsx";
import { EstadoVacio } from "../../componentes/ui/Estados.jsx";

/** Caso de uso "Administrar formas de pago". */
export default function GestionDeFormasDePago() {
  const [enEdicion, setEnEdicion] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);

  const { datos, cargando, recargar } = usePeticion(
    () => formasDePago.listar({ incluirInactivas: true }),
    [],
  );

  const eliminar = useAccion((id) => formasDePago.eliminar(id));

  const columnas = [
    { clave: "nombre", titulo: "Forma de pago", principal: true, celda: (forma) => forma.nombre },
    {
      clave: "estado",
      titulo: "Estado",
      celda: (forma) =>
        forma.activo ? (
          <Insignia tono="ok">Disponible</Insignia>
        ) : (
          <Insignia tono="neutra">No se ofrece</Insignia>
        ),
    },
    {
      clave: "pagos",
      titulo: "Pagos registrados",
      numerica: true,
      celda: (forma) => numero(forma.pagosRegistrados),
    },
    {
      clave: "acciones",
      titulo: "",
      acciones: true,
      celda: (forma) => (
        <div className="fila" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
          <Boton
            variante="fantasma"
            soloIcono
            title="Editar"
            aria-label={`Editar ${forma.nombre}`}
            onClick={() => setEnEdicion(forma)}
          >
            <Pencil size={15} />
          </Boton>

          <Boton
            variante="fantasma"
            soloIcono
            title="Eliminar"
            aria-label={`Eliminar ${forma.nombre}`}
            onClick={() => setAEliminar(forma)}
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
        titulo="Formas de pago"
        descripcion="Medios con los que los socios pueden abonar la cuota."
        acciones={
          <Boton variante="principal" icono={Plus} onClick={() => setEnEdicion({})}>
            Nueva forma de pago
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
                icono={Wallet}
                titulo="No hay formas de pago cargadas."
                accion={{ texto: "Agregar la primera", icono: Plus, onClick: () => setEnEdicion({}) }}
              />
            }
          />
        </Panel>
      </div>

      {/* Se monta sólo mientras está abierto: así cada apertura arranca con el
          formulario y los errores limpios, sin arrastrar nada de la anterior. */}
      {enEdicion && (
        <DialogoDeForma
          key={enEdicion.id ?? "nueva"}
          forma={enEdicion}
          alCerrar={() => setEnEdicion(null)}
          alGuardar={() => {
            setEnEdicion(null);
            recargar();
          }}
        />
      )}

      <DialogoDeConfirmacion
        abierto={aEliminar !== null}
        titulo="Eliminar la forma de pago"
        mensaje={
          aEliminar?.pagosRegistrados > 0
            ? `"${aEliminar?.nombre}" ya se usó en ${aEliminar?.pagosRegistrados} pago(s), así que en lugar de borrarse va a quedar como no disponible. El historial se conserva.`
            : `Se va a eliminar "${aEliminar?.nombre}". No se puede deshacer.`
        }
        textoDeAccion={aEliminar?.pagosRegistrados > 0 ? "Dejar de ofrecer" : "Eliminar"}
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

function DialogoDeForma({ forma, alCerrar, alGuardar }) {
  const [nombre, setNombre] = useState(forma.nombre ?? "");
  const [activo, setActivo] = useState(forma.activo ?? true);

  const guardar = useAccion((id, datos) =>
    id ? formasDePago.actualizar(id, datos) : formasDePago.crear(datos),
  );

  return (
    <Dialogo
      abierto
      titulo={forma.id ? "Editar la forma de pago" : "Nueva forma de pago"}
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
            onClick={async () => {
              if (await guardar.ejecutar(forma.id, { nombre, activo })) alGuardar();
            }}
          >
            {forma.id ? "Guardar cambios" : "Crear"}
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
          placeholder="Efectivo, Transferencia, Mercado Pago"
          required
        />

        <Casilla
          etiqueta="Los socios la pueden elegir al pagar"
          checked={activo}
          onChange={(evento) => setActivo(evento.target.checked)}
        />
      </div>
    </Dialogo>
  );
}
