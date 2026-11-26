import { useState } from "react";
import { Building2, Star } from "lucide-react";

import { socios, sucursales } from "../../api/endpoints.js";
import { useSesion } from "../../contexto/SesionContexto.jsx";
import { usePeticion } from "../../hooks/usePeticion.js";
import { useAccion } from "../../hooks/useAccion.js";
import { EncabezadoDePagina } from "../../componentes/estructura/EncabezadoDePagina.jsx";
import { Boton } from "../../componentes/ui/Boton.jsx";
import { Panel } from "../../componentes/ui/Panel.jsx";
import { Insignia } from "../../componentes/ui/Insignia.jsx";
import { Aviso } from "../../componentes/ui/Aviso.jsx";
import { Tabla } from "../../componentes/ui/Tabla.jsx";
import { EstadoVacio } from "../../componentes/ui/Estados.jsx";
import { DialogoDeConfirmacion } from "../../componentes/ui/Dialogo.jsx";

/**
 * Caso de uso "Sumarse a otra sucursal": un socio puede entrenar en más de un
 * gimnasio de la red con la misma cuenta, sin volver a registrarse.
 */
export default function SumarmeAOtraSucursal() {
  const { sucursales: misSucursales, cambiarSucursal, refrescarSesion } = useSesion();
  const { datos: todas, cargando } = usePeticion(() => sucursales.publicas(), []);

  const [aSumarme, setASumarme] = useState(null);
  const [sumada, setSumada] = useState(null);
  const unirme = useAccion((idGimnasio) => socios.unirme({ idGimnasio }));

  const misIds = new Set(misSucursales.map((s) => s.idGimnasio));
  const disponibles = (todas ?? []).filter((sede) => !misIds.has(sede.id));

  async function confirmar() {
    if (await unirme.ejecutar(aSumarme.id)) {
      await refrescarSesion();
      setSumada(aSumarme);
      setASumarme(null);
    }
  }

  return (
    <>
      <EncabezadoDePagina
        titulo="Sumarme a otra sucursal"
        descripcion="Tu cuenta es una sola: podés ser socio de más de un gimnasio de la red a la vez."
      />

      {sumada && (
        <Aviso tono="ok" titulo={`Ya sos socio de ${sumada.nombre}`}>
          <p className="fila-separada">
            Cambiá de sucursal desde el selector para empezar a operar ahí.
            <Boton variante="fantasma" onClick={() => cambiarSucursal(sumada.id)}>
              Cambiar ahora
            </Boton>
          </p>
        </Aviso>
      )}

      <Panel titulo="Sucursales disponibles">
        <Tabla
          cargando={cargando}
          filas={disponibles}
          vacio={
            <EstadoVacio
              icono={Building2}
              titulo="Ya sos socio de todas las sucursales disponibles."
            />
          }
          columnas={[
            {
              clave: "nombre",
              titulo: "Sucursal",
              principal: true,
              celda: (sede) => (
                <span className="fila">
                  {sede.nombre}
                  {sede.esCasaMatriz && (
                    <Insignia tono="marca">
                      <Star size={12} style={{ verticalAlign: "-2px" }} /> Casa central
                    </Insignia>
                  )}
                </span>
              ),
            },
            { clave: "organizacion", titulo: "Organización", celda: (sede) => sede.organizacion },
            { clave: "direccion", titulo: "Dirección", celda: (sede) => sede.direccion },
            {
              clave: "acciones",
              titulo: "",
              acciones: true,
              celda: (sede) => (
                <Boton variante="fantasma" onClick={() => setASumarme(sede)}>
                  Sumarme
                </Boton>
              ),
            },
          ]}
        />
      </Panel>

      <DialogoDeConfirmacion
        abierto={aSumarme !== null}
        titulo="Sumarte a esta sucursal"
        mensaje={
          aSumarme &&
          `Vas a quedar registrado como socio de ${aSumarme.nombre}. Tu mail y tu contraseña ` +
            "siguen siendo los mismos: se suma una ficha nueva en esta sede, nada más."
        }
        textoDeAccion="Sumarme"
        enCurso={unirme.enCurso}
        error={unirme.error}
        alCerrar={() => setASumarme(null)}
        alConfirmar={confirmar}
      />
    </>
  );
}
