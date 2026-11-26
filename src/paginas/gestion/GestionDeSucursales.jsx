import { useState } from "react";
import { Building2, MapPin, Navigation, Pencil, Plus, Power, Star } from "lucide-react";

import { sucursales } from "../../api/endpoints.js";
import { useSesion } from "../../contexto/SesionContexto.jsx";
import { usePeticion } from "../../hooks/usePeticion.js";
import { useAccion } from "../../hooks/useAccion.js";
import { fecha, numero } from "../../dominio/formato.js";
import { tieneUbicacion, urlDeComoLlegar, urlDeGoogleMaps } from "../../dominio/mapas.js";
import { EncabezadoDePagina } from "../../componentes/estructura/EncabezadoDePagina.jsx";
import { Boton } from "../../componentes/ui/Boton.jsx";
import { Campo, Casilla, Seleccion } from "../../componentes/ui/Campo.jsx";
import { Panel } from "../../componentes/ui/Panel.jsx";
import { Tabla } from "../../componentes/ui/Tabla.jsx";
import { Dialogo, DialogoDeConfirmacion } from "../../componentes/ui/Dialogo.jsx";
import { Aviso, AvisoDeError } from "../../componentes/ui/Aviso.jsx";
import { Insignia } from "../../componentes/ui/Insignia.jsx";
import { EstadoVacio } from "../../componentes/ui/Estados.jsx";

/**
 * Casos de uso "Registrar una sucursal", "Editar una sucursal", "Marcar la
 * Casa Central" y "Dar de baja una sucursal".
 *
 * Registrar y dar de baja son atribuciones del titular de la organización, así
 * que esos botones sólo aparecen si el usuario es el dueño.
 */
export default function GestionDeSucursales() {
  const { esDuenio, refrescarSesion } = useSesion();

  const [enEdicion, setEnEdicion] = useState(null);
  const [aDarDeBaja, setADarDeBaja] = useState(null);

  const { datos: zonas } = usePeticion(() => sucursales.zonas(), []);
  const { datos, cargando, recargar } = usePeticion(() => sucursales.listar(), []);

  const marcarCasaMatriz = useAccion((id) => sucursales.marcarCasaMatriz(id));
  const darDeBaja = useAccion((id) => sucursales.darDeBaja(id));
  const reactivar = useAccion((id) => sucursales.reactivar(id));

  /* Al tocar sucursales cambia la lista de sedes del usuario, así que se
     refresca la sesión para que el selector de arriba quede al día. */
  const refrescarTodo = async () => {
    recargar();
    await refrescarSesion();
  };

  const columnas = [
    {
      clave: "nombre",
      titulo: "Sucursal",
      principal: true,
      celda: (sucursal) => (
        <>
          <span className="fila" style={{ gap: 6 }}>
            {sucursal.nombre}
            {sucursal.esCasaMatriz && <Insignia tono="marca">Casa central</Insignia>}
          </span>

          <span className="texto-tenue" style={{ display: "block" }}>
            {sucursal.direccion}
          </span>

          {/* Sin coordenadas la sucursal no tiene pin en el mapa del sitio: se avisa acá para
              que quien administra se dé cuenta de que falta cargarlas. */}
          {!tieneUbicacion(sucursal) && (
            <span style={{ display: "block", marginTop: 4 }}>
              <Insignia tono="aviso">Sin ubicación en el mapa</Insignia>
            </span>
          )}
        </>
      ),
    },
    {
      clave: "contacto",
      titulo: "Contacto",
      celda: (sucursal) => (
        <>
          {sucursal.telefono ?? "—"}
          <span className="texto-tenue" style={{ display: "block" }}>
            {sucursal.email ?? ""}
          </span>
        </>
      ),
    },
    {
      clave: "zona",
      titulo: "Zona",
      celda: (sucursal) => sucursal.zona ?? <span className="texto-tenue">—</span>,
    },
    { clave: "socios", titulo: "Socios", numerica: true, celda: (s) => numero(s.cantidadSocios) },
    { clave: "personal", titulo: "Personal", numerica: true, celda: (s) => numero(s.cantidadPersonal) },
    { clave: "alta", titulo: "Desde", celda: (s) => fecha(s.fechaAlta) },
    {
      clave: "estado",
      titulo: "Estado",
      celda: (sucursal) =>
        sucursal.activo ? (
          <Insignia tono="ok">Operativa</Insignia>
        ) : (
          <Insignia tono="neutra">Dada de baja</Insignia>
        ),
    },
    {
      clave: "acciones",
      titulo: "",
      acciones: true,
      celda: (sucursal) => (
        <div className="fila" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
          <Boton
            variante="fantasma"
            soloIcono
            title="Ver en Google Maps"
            aria-label={`Ver ${sucursal.nombre} en Google Maps`}
            onClick={() =>
              window.open(
                urlDeGoogleMaps(sucursal.direccion, sucursal.latitud, sucursal.longitud),
                "_blank",
                "noopener,noreferrer",
              )
            }
          >
            <MapPin size={15} />
          </Boton>

          <Boton
            variante="fantasma"
            soloIcono
            title="Cómo llegar"
            aria-label={`Cómo llegar a ${sucursal.nombre}`}
            onClick={() =>
              window.open(
                urlDeComoLlegar(sucursal.direccion, sucursal.latitud, sucursal.longitud),
                "_blank",
                "noopener,noreferrer",
              )
            }
          >
            <Navigation size={15} />
          </Boton>

          {esDuenio && sucursal.activo && !sucursal.esCasaMatriz && (
            <Boton
              variante="fantasma"
              soloIcono
              title="Marcar como casa central"
              aria-label={`Marcar ${sucursal.nombre} como casa central`}
              enCurso={marcarCasaMatriz.enCurso}
              onClick={async () => {
                if (await marcarCasaMatriz.ejecutar(sucursal.id)) refrescarTodo();
              }}
            >
              <Star size={15} />
            </Boton>
          )}

          <Boton
            variante="fantasma"
            soloIcono
            title="Editar"
            aria-label={`Editar ${sucursal.nombre}`}
            onClick={() => setEnEdicion(sucursal)}
          >
            <Pencil size={15} />
          </Boton>

          {esDuenio &&
            (sucursal.activo ? (
              <Boton
                variante="fantasma"
                soloIcono
                title="Dar de baja"
                aria-label={`Dar de baja ${sucursal.nombre}`}
                onClick={() => setADarDeBaja(sucursal)}
              >
                <Power size={15} />
              </Boton>
            ) : (
              <Boton
                variante="fantasma"
                soloIcono
                title="Reactivar"
                aria-label={`Reactivar ${sucursal.nombre}`}
                enCurso={reactivar.enCurso}
                onClick={async () => {
                  if (await reactivar.ejecutar(sucursal.id)) refrescarTodo();
                }}
              >
                <Power size={15} />
              </Boton>
            ))}
        </div>
      ),
    },
  ];

  return (
    <>
      <EncabezadoDePagina
        titulo="Sucursales"
        descripcion="Sedes de la organización."
        acciones={
          esDuenio && (
            <Boton variante="principal" icono={Plus} onClick={() => setEnEdicion({})}>
              Registrar sucursal
            </Boton>
          )
        }
      />

      <div className="pila">
        <AvisoDeError error={marcarCasaMatriz.error} />
        <AvisoDeError error={darDeBaja.error} />
        <AvisoDeError error={reactivar.error} />

        {!esDuenio && (
          <Aviso tono="info">
            Podés editar los datos de contacto de las sucursales. Registrar una sede nueva,
            marcar la casa central o dar de baja una sucursal son atribuciones del titular
            de la organización.
          </Aviso>
        )}

        <Panel sinRelleno>
          <Tabla
            columnas={columnas}
            filas={datos}
            cargando={cargando}
            vacio={<EstadoVacio icono={Building2} titulo="No hay sucursales para mostrar." />}
          />
        </Panel>
      </div>

      {/* Se monta sólo mientras está abierto: así cada apertura arranca con el
          formulario y los errores limpios, sin arrastrar nada de la anterior. */}
      {enEdicion && (
        <DialogoDeSucursal
          key={enEdicion.id ?? "nueva"}
          sucursal={enEdicion}
          zonas={zonas ?? []}
          alCerrar={() => setEnEdicion(null)}
          alGuardar={() => {
            setEnEdicion(null);
            refrescarTodo();
          }}
        />
      )}

      <DialogoDeConfirmacion
        abierto={aDarDeBaja !== null}
        titulo="Dar de baja la sucursal"
        mensaje={`"${aDarDeBaja?.nombre}" deja de operar y de aparecer en el sitio. Sus socios, pagos y asistencias se conservan. Se puede reactivar después.`}
        textoDeAccion="Dar de baja"
        peligrosa
        enCurso={darDeBaja.enCurso}
        alCerrar={() => setADarDeBaja(null)}
        alConfirmar={async () => {
          if (await darDeBaja.ejecutar(aDarDeBaja.id)) {
            setADarDeBaja(null);
            refrescarTodo();
          }
        }}
      />
    </>
  );
}

/**
 * Lee lo que se escribió en un campo de coordenada. Vacío significa "sin dato" (null); si no
 * es un número, devuelve NaN para poder marcarlo. Acepta la coma decimal, que es como se
 * escribe en Argentina.
 */
function leerCoordenada(texto) {
  const limpio = String(texto).trim().replace(",", ".");

  return limpio === "" ? null : Number(limpio);
}

function DialogoDeSucursal({ sucursal, zonas, alCerrar, alGuardar }) {
  const [formulario, setFormulario] = useState(() => ({
    nombre: sucursal.nombre ?? "",
    direccion: sucursal.direccion ?? "",
    latitud: sucursal.latitud ?? "",
    longitud: sucursal.longitud ?? "",
    telefono: sucursal.telefono ?? "",
    email: sucursal.email ?? "",
    idZona: sucursal.idZona ?? "",
    esCasaMatriz: false,
  }));

  const guardar = useAccion((id, datos) =>
    id ? sucursales.actualizar(id, datos) : sucursales.crear(datos),
  );

  const esNueva = !sucursal.id;

  const cambiar = (campo) => (evento) =>
    setFormulario({
      ...formulario,
      [campo]: evento.target.type === "checkbox" ? evento.target.checked : evento.target.value,
    });

  /* Google Maps copia las dos coordenadas juntas ("-31.408571, -64.199845"): si se pegan en
     Latitud, se reparten solas entre los dos campos en vez de quedar mal puestas. */
  const cambiarLatitud = (evento) => {
    const valor = evento.target.value;
    const par = valor.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);

    setFormulario({
      ...formulario,
      latitud: par ? par[1] : valor,
      ...(par ? { longitud: par[2] } : {}),
    });
  };

  /* La ubicación es opcional pero va completa: las dos coordenadas o ninguna, y dentro del
     rango que existe. El backend lo vuelve a validar; esto evita el viaje de ida y vuelta. */
  const latitud = leerCoordenada(formulario.latitud);
  const longitud = leerCoordenada(formulario.longitud);

  const errorDeLatitud =
    latitud !== null && !(Number.isFinite(latitud) && Math.abs(latitud) <= 90)
      ? "Tiene que ser un número entre -90 y 90."
      : latitud === null && longitud !== null
        ? "Completá la latitud o vaciá la longitud."
        : undefined;

  const errorDeLongitud =
    longitud !== null && !(Number.isFinite(longitud) && Math.abs(longitud) <= 180)
      ? "Tiene que ser un número entre -180 y 180."
      : longitud === null && latitud !== null
        ? "Completá la longitud o vaciá la latitud."
        : undefined;

  async function confirmar() {
    const datos = {
      nombre: formulario.nombre,
      direccion: formulario.direccion,
      latitud,
      longitud,
      telefono: formulario.telefono || null,
      email: formulario.email || null,
      idZona: formulario.idZona ? Number(formulario.idZona) : null,
      ...(esNueva ? { esCasaMatriz: formulario.esCasaMatriz } : {}),
    };

    if (await guardar.ejecutar(sucursal.id, datos)) alGuardar();
  }

  return (
    <Dialogo
      abierto
      titulo={esNueva ? "Registrar una sucursal" : "Editar la sucursal"}
      descripcion={
        esNueva ? "Si es la primera sucursal de la organización, queda como casa central." : undefined
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
            disabled={
              !formulario.nombre || !formulario.direccion || Boolean(errorDeLatitud || errorDeLongitud)
            }
            onClick={confirmar}
          >
            {esNueva ? "Registrar la sucursal" : "Guardar cambios"}
          </Boton>
        </>
      }
    >
      <div className="pila">
        <AvisoDeError error={guardar.error} />

        <Campo etiqueta="Nombre" value={formulario.nombre} onChange={cambiar("nombre")} required />

        <Campo
          etiqueta="Dirección"
          value={formulario.direccion}
          onChange={cambiar("direccion")}
          required
        />

        <div className="rejilla-formulario">
          <Campo
            etiqueta="Latitud"
            inputMode="decimal"
            value={formulario.latitud}
            onChange={cambiarLatitud}
            error={errorDeLatitud}
            ayuda="Ej.: -31.4201"
          />

          <Campo
            etiqueta="Longitud"
            inputMode="decimal"
            value={formulario.longitud}
            onChange={cambiar("longitud")}
            error={errorDeLongitud}
            ayuda="Ej.: -64.1888"
          />
        </div>

        <p className="campo__ayuda">
          Con la ubicación, la sucursal aparece como un pin en el mapa del sitio. En Google Maps,
          hacé clic derecho sobre el lugar y clic en los números que aparecen arriba del menú: se
          copian las dos juntas y podés pegarlas en Latitud.
        </p>

        <div className="rejilla-formulario">
          <Campo etiqueta="Teléfono" value={formulario.telefono} onChange={cambiar("telefono")} />
          <Campo etiqueta="Email" type="email" value={formulario.email} onChange={cambiar("email")} />

          <Seleccion
            etiqueta="Zona"
            value={formulario.idZona}
            onChange={cambiar("idZona")}
            vacio="Sin zona"
            opciones={zonas.map((zona) => ({
              valor: zona.id,
              texto: zona.localidad ? `${zona.nombre} — ${zona.localidad}` : zona.nombre,
            }))}
          />
        </div>

        {esNueva && (
          <Casilla
            etiqueta="Marcar como casa central de la organización"
            checked={formulario.esCasaMatriz}
            onChange={cambiar("esCasaMatriz")}
          />
        )}
      </div>
    </Dialogo>
  );
}
