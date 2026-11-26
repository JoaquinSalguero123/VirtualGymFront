import { useRef, useState } from "react";
import { Image, Pencil, Plus, Trash2 } from "lucide-react";

import { sitioWeb, urlDeArchivo } from "../../api/endpoints.js";
import { useSesion } from "../../contexto/SesionContexto.jsx";
import { usePeticion } from "../../hooks/usePeticion.js";
import { useAccion } from "../../hooks/useAccion.js";
import { ROLES } from "../../dominio/roles.js";
import { EncabezadoDePagina } from "../../componentes/estructura/EncabezadoDePagina.jsx";
import { Boton } from "../../componentes/ui/Boton.jsx";
import { AreaDeTexto, Campo, Casilla, Seleccion } from "../../componentes/ui/Campo.jsx";
import { Panel } from "../../componentes/ui/Panel.jsx";
import { Tabla } from "../../componentes/ui/Tabla.jsx";
import { Pestanas } from "../../componentes/ui/Pestanas.jsx";
import { Dialogo, DialogoDeConfirmacion } from "../../componentes/ui/Dialogo.jsx";
import { AvisoDeError } from "../../componentes/ui/Aviso.jsx";
import { Insignia } from "../../componentes/ui/Insignia.jsx";
import { EstadoVacio } from "../../componentes/ui/Estados.jsx";

/**
 * Casos de uso "Configurar el carrusel del sitio" y "Configurar el pie de página".
 *
 * Es el contenido que ve un visitante en la portada, así que todo lo que se
 * carga acá aparece en el sitio público.
 */
export default function GestionDelSitio() {
  const { tieneRol } = useSesion();
  const [pestana, setPestana] = useState("carousel");

  const puedeEditarPie = tieneRol(ROLES.administrador);

  return (
    <>
      <EncabezadoDePagina
        titulo="Sitio web"
        descripcion="Lo que se muestra en la portada pública del gimnasio."
      />

      <div className="pila">
        <Pestanas
          activa={pestana}
          alCambiar={setPestana}
          pestanas={[
            { clave: "carousel", texto: "Servicios y frases" },
            ...(puedeEditarPie ? [{ clave: "pie", texto: "Pie de página" }] : []),
          ]}
        />

        {pestana === "carousel" && <ContenidoDelCarousel />}
        {pestana === "pie" && <ContenidoDelPie />}
      </div>
    </>
  );
}

/** ABM de los items del carrusel, con subida de imagen. */
function ContenidoDelCarousel() {
  const [enEdicion, setEnEdicion] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);

  const { datos, cargando, recargar } = usePeticion(() => sitioWeb.carousel(), []);
  const eliminar = useAccion((id) => sitioWeb.eliminarCarousel(id));

  const columnas = [
    {
      clave: "imagen",
      titulo: "",
      ancho: "72px",
      celda: (item) =>
        item.imagen ? (
          <img
            src={urlDeArchivo(item.imagen)}
            alt=""
            style={{
              width: 56,
              height: 42,
              objectFit: "cover",
              borderRadius: "var(--r-control)",
              border: "1px solid var(--borde)",
            }}
          />
        ) : (
          <span className="texto-tenue">sin imagen</span>
        ),
    },
    {
      clave: "titulo",
      titulo: "Título",
      principal: true,
      celda: (item) => (
        <>
          {item.titulo ?? <span className="texto-tenue">sin título</span>}
          {item.descripcion && (
            <span className="texto-tenue" style={{ display: "block" }}>
              {item.descripcion}
            </span>
          )}
        </>
      ),
    },
    {
      clave: "tipo",
      titulo: "Sección",
      celda: (item) => <Insignia tono="neutra">{item.tipo ?? "sin sección"}</Insignia>,
    },
    {
      clave: "sucursal",
      titulo: "Sucursal",
      celda: (item) => item.sucursal ?? <span className="texto-tenue">Toda la organización</span>,
    },
    { clave: "orden", titulo: "Orden", numerica: true, celda: (item) => item.orden ?? "—" },
    {
      clave: "estado",
      titulo: "Estado",
      celda: (item) =>
        item.activo ? <Insignia tono="ok">Visible</Insignia> : <Insignia tono="neutra">Oculto</Insignia>,
    },
    {
      clave: "acciones",
      titulo: "",
      acciones: true,
      celda: (item) => (
        <div className="fila" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
          <Boton
            variante="fantasma"
            soloIcono
            title="Editar"
            aria-label="Editar el item"
            onClick={() => setEnEdicion(item)}
          >
            <Pencil size={15} />
          </Boton>

          <Boton
            variante="fantasma"
            soloIcono
            title="Eliminar"
            aria-label="Eliminar el item"
            onClick={() => setAEliminar(item)}
          >
            <Trash2 size={15} />
          </Boton>
        </div>
      ),
    },
  ];

  return (
    <>
      <AvisoDeError error={eliminar.error} />

      <Panel
        titulo="Servicios y frases"
        descripcion='Los items de la sección "servicios" se muestran con imagen; los de "frases" se muestran como citas.'
        sinRelleno
        acciones={
          <Boton variante="principal" icono={Plus} onClick={() => setEnEdicion({})}>
            Nuevo item
          </Boton>
        }
      >
        <Tabla
          columnas={columnas}
          filas={datos}
          cargando={cargando}
          vacio={
            <EstadoVacio
              icono={Image}
              titulo="Todavía no cargaste contenido para el sitio."
              accion={{ texto: "Cargar el primero", icono: Plus, onClick: () => setEnEdicion({}) }}
            >
              <p>Sin servicios ni frases, la portada muestra sólo el encabezado y los planes.</p>
            </EstadoVacio>
          }
        />
      </Panel>

      {/* Se monta sólo mientras está abierto: así cada apertura arranca con el
          formulario y los errores limpios, sin arrastrar nada de la anterior. */}
      {enEdicion && (
        <DialogoDeCarousel
          key={enEdicion.id ?? "nuevo"}
          item={enEdicion}
          alCerrar={() => setEnEdicion(null)}
          alGuardar={() => {
            setEnEdicion(null);
            recargar();
          }}
        />
      )}

      <DialogoDeConfirmacion
        abierto={aEliminar !== null}
        titulo="Eliminar el item"
        mensaje="Se va a borrar del sitio junto con su imagen. No se puede deshacer."
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

function DialogoDeCarousel({ item, alCerrar, alGuardar }) {
  const { sucursales } = useSesion();

  const [formulario, setFormulario] = useState(() => ({
    tipo: item.tipo ?? "servicios",
    titulo: item.titulo ?? "",
    descripcion: item.descripcion ?? "",
    orden: item.orden ?? "",
    idGimnasio: item.idGimnasio ?? "",
    activo: item.activo ?? true,
  }));
  const [imagen, setImagen] = useState(null);
  const entradaDeArchivo = useRef(null);

  const guardar = useAccion((id, formData) =>
    id ? sitioWeb.actualizarCarousel(id, formData) : sitioWeb.crearCarousel(formData),
  );

  const cambiar = (campo) => (evento) =>
    setFormulario({
      ...formulario,
      [campo]: evento.target.type === "checkbox" ? evento.target.checked : evento.target.value,
    });

  async function confirmar() {
    const formData = new FormData();
    formData.append("tipo", formulario.tipo);
    formData.append("titulo", formulario.titulo);
    formData.append("descripcion", formulario.descripcion);
    formData.append("activo", String(formulario.activo));

    if (formulario.orden !== "") formData.append("orden", formulario.orden);
    if (formulario.idGimnasio !== "") formData.append("idGimnasio", formulario.idGimnasio);
    if (imagen) formData.append("imagen", imagen);

    if (await guardar.ejecutar(item.id, formData)) alGuardar();
  }

  return (
    <Dialogo
      abierto
      titulo={item.id ? "Editar el item" : "Nuevo item del sitio"}
      alCerrar={alCerrar}
      pie={
        <>
          <Boton variante="fantasma" onClick={alCerrar}>
            Cancelar
          </Boton>

          <Boton variante="principal" enCurso={guardar.enCurso} onClick={confirmar}>
            {item.id ? "Guardar cambios" : "Crear el item"}
          </Boton>
        </>
      }
    >
      <div className="pila">
        <AvisoDeError error={guardar.error} />

        <Seleccion
          etiqueta="Sección del sitio"
          value={formulario.tipo}
          onChange={cambiar("tipo")}
          opciones={[
            { valor: "servicios", texto: "Servicios (se muestra con imagen)" },
            { valor: "frases", texto: "Frases (se muestra como cita)" },
          ]}
        />

        <Campo
          etiqueta="Título"
          value={formulario.titulo}
          onChange={cambiar("titulo")}
          ayuda={
            formulario.tipo === "frases"
              ? "En las frases, el título se usa como autor o pie de la cita."
              : undefined
          }
        />

        <AreaDeTexto
          etiqueta={formulario.tipo === "frases" ? "Texto de la frase" : "Descripción"}
          value={formulario.descripcion}
          onChange={cambiar("descripcion")}
          ancho
        />

        <div className="rejilla-formulario">
          <Seleccion
            etiqueta="Mostrar sólo en"
            value={formulario.idGimnasio}
            onChange={cambiar("idGimnasio")}
            vacio="Toda la organización"
            opciones={sucursales.map((sucursal) => ({
              valor: sucursal.idGimnasio,
              texto: sucursal.gimnasio,
            }))}
          />

          <Campo
            etiqueta="Orden"
            type="number"
            value={formulario.orden}
            onChange={cambiar("orden")}
            ayuda="Menor número, primero."
          />
        </div>

        {formulario.tipo === "servicios" && (
          <div className="campo">
            <span className="campo__etiqueta">Imagen</span>

            <div className="fila">
              {item.imagen && !imagen && (
                <img
                  src={urlDeArchivo(item.imagen)}
                  alt=""
                  style={{
                    width: 80,
                    height: 60,
                    objectFit: "cover",
                    borderRadius: "var(--r-control)",
                    border: "1px solid var(--borde)",
                  }}
                />
              )}

              <label className="boton boton--secundario" style={{ cursor: "pointer" }}>
                {imagen ? imagen.name : item.imagen ? "Reemplazar la imagen" : "Elegir una imagen"}

                <input
                  ref={entradaDeArchivo}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(evento) => setImagen(evento.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            <span className="campo__ayuda">
              Se aceptan JPG, PNG y WebP de hasta 8 MB.
            </span>
          </div>
        )}

        <Casilla
          etiqueta="Se muestra en el sitio público"
          checked={formulario.activo}
          onChange={cambiar("activo")}
        />
      </div>
    </Dialogo>
  );
}

/** ABM de los datos del pie del sitio, agrupados por sección. */
function ContenidoDelPie() {
  const [enEdicion, setEnEdicion] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);

  const { datos, cargando, recargar } = usePeticion(() => sitioWeb.footerPublico(), []);
  const eliminar = useAccion((id) => sitioWeb.eliminarFooter(id));

  const filas = Object.entries(datos ?? {}).flatMap(([seccion, items]) =>
    items.map((item) => ({ ...item, seccion })),
  );

  const columnas = [
    { clave: "seccion", titulo: "Sección", principal: true, celda: (dato) => dato.seccion },
    { clave: "clave", titulo: "Dato", celda: (dato) => dato.clave },
    { clave: "valor", titulo: "Valor", celda: (dato) => dato.valor ?? "—" },
    { clave: "orden", titulo: "Orden", numerica: true, celda: (dato) => dato.orden ?? "—" },
    {
      clave: "acciones",
      titulo: "",
      acciones: true,
      celda: (dato) => (
        <div className="fila" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
          <Boton
            variante="fantasma"
            soloIcono
            title="Editar"
            aria-label={`Editar ${dato.clave}`}
            onClick={() => setEnEdicion(dato)}
          >
            <Pencil size={15} />
          </Boton>

          <Boton
            variante="fantasma"
            soloIcono
            title="Eliminar"
            aria-label={`Eliminar ${dato.clave}`}
            onClick={() => setAEliminar(dato)}
          >
            <Trash2 size={15} />
          </Boton>
        </div>
      ),
    },
  ];

  return (
    <>
      <AvisoDeError error={eliminar.error} />

      <Panel
        titulo="Pie de página"
        descripcion="Datos de contacto y redes que aparecen al final del sitio, agrupados por sección."
        sinRelleno
        acciones={
          <Boton variante="principal" icono={Plus} onClick={() => setEnEdicion({})}>
            Nuevo dato
          </Boton>
        }
      >
        <Tabla
          columnas={columnas}
          filas={filas}
          cargando={cargando}
          vacio={
            <EstadoVacio
              icono={Image}
              titulo="El pie del sitio está vacío."
              accion={{ texto: "Cargar un dato", icono: Plus, onClick: () => setEnEdicion({}) }}
            >
              <p>Cargá el teléfono, el email y las redes para que aparezcan en la portada.</p>
            </EstadoVacio>
          }
        />
      </Panel>

      {enEdicion && (
        <DialogoDePie
          key={enEdicion.id ?? "nuevo"}
          dato={enEdicion}
          alCerrar={() => setEnEdicion(null)}
          alGuardar={() => {
            setEnEdicion(null);
            recargar();
          }}
        />
      )}

      <DialogoDeConfirmacion
        abierto={aEliminar !== null}
        titulo="Eliminar el dato"
        mensaje={`Se va a quitar "${aEliminar?.clave}" del pie del sitio.`}
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

function DialogoDePie({ dato, alCerrar, alGuardar }) {
  const [formulario, setFormulario] = useState(() => ({
    seccion: dato.seccion ?? "Contacto",
    clave: dato.clave ?? "",
    valor: dato.valor ?? "",
    orden: dato.orden ?? "",
  }));

  const guardar = useAccion((id, datos) =>
    id ? sitioWeb.actualizarFooter(id, datos) : sitioWeb.crearFooter(datos),
  );

  const cambiar = (campo) => (evento) =>
    setFormulario({ ...formulario, [campo]: evento.target.value });

  async function confirmar() {
    const ok = await guardar.ejecutar(dato.id, {
      seccion: formulario.seccion,
      clave: formulario.clave,
      valor: formulario.valor || null,
      orden: formulario.orden === "" ? null : Number(formulario.orden),
    });

    if (ok) alGuardar();
  }

  return (
    <Dialogo
      abierto
      titulo={dato.id ? "Editar el dato" : "Nuevo dato del pie"}
      alCerrar={alCerrar}
      pie={
        <>
          <Boton variante="fantasma" onClick={alCerrar}>
            Cancelar
          </Boton>

          <Boton
            variante="principal"
            enCurso={guardar.enCurso}
            disabled={!formulario.seccion || !formulario.clave}
            onClick={confirmar}
          >
            {dato.id ? "Guardar cambios" : "Crear"}
          </Boton>
        </>
      }
    >
      <div className="pila">
        <AvisoDeError error={guardar.error} />

        <Campo
          etiqueta="Sección"
          value={formulario.seccion}
          onChange={cambiar("seccion")}
          ayuda="Los datos con la misma sección se agrupan juntos en el pie. Por ejemplo: Contacto, Redes, Info."
          required
        />

        <div className="rejilla-formulario">
          <Campo
            etiqueta="Nombre del dato"
            value={formulario.clave}
            onChange={cambiar("clave")}
            placeholder="telefono, email, instagram"
            required
          />

          <Campo
            etiqueta="Orden"
            type="number"
            value={formulario.orden}
            onChange={cambiar("orden")}
            ayuda="Menor número, primero."
          />
        </div>

        <Campo
          etiqueta="Valor"
          value={formulario.valor}
          onChange={cambiar("valor")}
          placeholder="Lo que se muestra en el sitio"
          ancho
        />
      </div>
    </Dialogo>
  );
}
