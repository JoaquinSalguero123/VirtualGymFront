import { useEffect, useRef, useState } from "react";
import { MessagesSquare, Paperclip, Reply, Trash2 } from "lucide-react";

import { foro, urlDeArchivo } from "../../api/endpoints.js";
import { usePeticion } from "../../hooks/usePeticion.js";
import { useAccion } from "../../hooks/useAccion.js";
import { fechaYHora, iniciales } from "../../dominio/formato.js";
import { EncabezadoDePagina } from "../../componentes/estructura/EncabezadoDePagina.jsx";
import { Boton } from "../../componentes/ui/Boton.jsx";
import { AreaDeTexto } from "../../componentes/ui/Campo.jsx";
import { Panel } from "../../componentes/ui/Panel.jsx";
import { AvisoDeError } from "../../componentes/ui/Aviso.jsx";
import { Insignia } from "../../componentes/ui/Insignia.jsx";
import { Cargando, EstadoVacio } from "../../componentes/ui/Estados.jsx";
import { DialogoDeConfirmacion } from "../../componentes/ui/Dialogo.jsx";

/** Caso de uso "Participar del foro". */
export default function Foro() {
  const [pagina, setPagina] = useState(1);
  const { datos, cargando, recargar } = usePeticion(() => foro.listar({ pagina }), [pagina]);

  const [aEliminar, setAEliminar] = useState(null);
  const eliminar = useAccion((id) => foro.eliminar(id));

  // Si se borró el último post de una página que no es la primera, la recarga
  // vuelve con una página vacía: se vuelve automáticamente a la anterior en
  // vez de mostrar "no hay publicaciones" y dejar al usuario sin forma de volver.
  useEffect(() => {
    if (datos && datos.items.length === 0 && datos.pagina > 1) {
      setPagina(datos.pagina - 1);
    }
  }, [datos]);

  // Un post nuevo siempre cae en la página 1 (se ordena por fecha descendente):
  // si el usuario estaba viendo otra página, hay que llevarlo ahí para que lo vea.
  function alPublicarRaiz() {
    if (pagina === 1) recargar();
    else setPagina(1);
  }

  return (
    <>
      <EncabezadoDePagina
        titulo="Foro"
        descripcion="Novedades y consultas de la comunidad de tu sucursal."
      />

      <div className="foro">
        <NuevaPublicacion alPublicar={alPublicarRaiz} />

        {cargando ? (
          <Cargando />
        ) : datos?.items.length === 0 ? (
          <Panel>
            <EstadoVacio icono={MessagesSquare} titulo="Todavía no hay publicaciones.">
              <p>Escribí la primera: una pregunta, una novedad o un logro para compartir.</p>
            </EstadoVacio>
          </Panel>
        ) : (
          datos?.items.map((publicacion) => (
            <Publicacion
              key={publicacion.id}
              publicacion={publicacion}
              alResponder={recargar}
              alPedirEliminar={setAEliminar}
            />
          ))
        )}

        {datos && datos.totalPaginas > 1 && (
          <div className="fila" style={{ justifyContent: "center" }}>
            <Boton disabled={!datos.hayPaginaAnterior} onClick={() => setPagina(pagina - 1)}>
              Anteriores
            </Boton>
            <span className="texto-tenue">
              Página {datos.pagina} de {datos.totalPaginas}
            </span>
            <Boton disabled={!datos.hayPaginaSiguiente} onClick={() => setPagina(pagina + 1)}>
              Siguientes
            </Boton>
          </div>
        )}
      </div>

      <DialogoDeConfirmacion
        abierto={aEliminar !== null}
        titulo="Eliminar la publicación"
        mensaje="Se va a borrar junto con todas sus respuestas. No se puede deshacer."
        textoDeAccion="Eliminar"
        peligrosa
        enCurso={eliminar.enCurso}
        error={eliminar.error}
        alCerrar={() => setAEliminar(null)}
        alConfirmar={async () => {
          if (await eliminar.ejecutar(aEliminar)) {
            setAEliminar(null);
            recargar();
          }
        }}
      />
    </>
  );
}

/** Debe calzar con la lista blanca y el límite de VirtualGymAssistant.Infrastructure.Servicios.AlmacenDeArchivosLocal. */
const EXTENSIONES_PERMITIDAS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"];
const TAMANIO_MAXIMO_EN_BYTES = 8 * 1024 * 1024;

/** Formulario para publicar, con adjunto opcional. */
function NuevaPublicacion({ alPublicar, idPostPadre = null, alCancelar }) {
  const [contenido, setContenido] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [errorDeArchivo, setErrorDeArchivo] = useState(null);
  const entradaDeArchivo = useRef(null);

  const publicar = useAccion((formData) => foro.publicar(formData));

  function elegirArchivo(evento) {
    const elegido = evento.target.files?.[0] ?? null;
    setErrorDeArchivo(null);

    if (!elegido) {
      setArchivo(null);
      return;
    }

    const extension = elegido.name.slice(elegido.name.lastIndexOf(".")).toLowerCase();

    if (!EXTENSIONES_PERMITIDAS.includes(extension)) {
      setErrorDeArchivo({
        message: `El tipo de archivo "${extension}" no está permitido. Aceptamos: ${EXTENSIONES_PERMITIDAS.join(", ")}.`,
      });
      setArchivo(null);
      if (entradaDeArchivo.current) entradaDeArchivo.current.value = "";
      return;
    }

    if (elegido.size > TAMANIO_MAXIMO_EN_BYTES) {
      setErrorDeArchivo({ message: "El archivo supera el tamaño máximo de 8 MB." });
      setArchivo(null);
      if (entradaDeArchivo.current) entradaDeArchivo.current.value = "";
      return;
    }

    setArchivo(elegido);
  }

  async function enviar(evento) {
    evento.preventDefault();

    const formData = new FormData();
    if (contenido) formData.append("contenido", contenido);
    if (idPostPadre) formData.append("idPostPadre", idPostPadre);
    if (archivo) formData.append("archivo", archivo);

    if (await publicar.ejecutar(formData)) {
      setContenido("");
      setArchivo(null);
      if (entradaDeArchivo.current) entradaDeArchivo.current.value = "";
      alPublicar();
      alCancelar?.();
    }
  }

  const vacia = !contenido.trim() && !archivo;

  return (
    <form onSubmit={enviar} className={idPostPadre ? undefined : "panel"}>
      <div className="pila-corta">
        <AvisoDeError error={publicar.error} />
        <AvisoDeError error={errorDeArchivo} />

        <AreaDeTexto
          etiqueta={idPostPadre ? "Tu respuesta" : "Escribí algo para la comunidad"}
          value={contenido}
          onChange={(evento) => setContenido(evento.target.value)}
          placeholder={idPostPadre ? "Respondé a esta publicación" : "Una novedad, una consulta, un logro"}
          rows={idPostPadre ? 2 : 3}
        />

        <div className="fila-separada">
          <label className="boton boton--fantasma" style={{ cursor: "pointer" }}>
            <Paperclip size={15} />
            {archivo ? archivo.name : "Adjuntar imagen"}

            <input
              ref={entradaDeArchivo}
              type="file"
              accept="image/*,.pdf"
              hidden
              onChange={elegirArchivo}
            />
          </label>

          <div className="fila">
            {alCancelar && (
              <Boton variante="fantasma" onClick={alCancelar}>
                Cancelar
              </Boton>
            )}

            <Boton type="submit" variante="principal" enCurso={publicar.enCurso} disabled={vacia}>
              Publicar
            </Boton>
          </div>
        </div>
      </div>
    </form>
  );
}

/** Una publicación con sus respuestas. */
function Publicacion({ publicacion, alResponder, alPedirEliminar }) {
  const [respondiendo, setRespondiendo] = useState(false);

  return (
    <article className="publicacion">
      <header className="publicacion__cabecera">
        <span className="cuenta__avatar" aria-hidden="true">
          {iniciales(publicacion.usuario)}
        </span>

        <span className="crece">
          <span className="publicacion__autor">{publicacion.usuario}</span>
          <span className="publicacion__fecha">{fechaYHora(publicacion.fecha)}</span>
        </span>

        {publicacion.rolDelAutor && publicacion.rolDelAutor !== "Socio" && (
          <Insignia tono="marca">{publicacion.rolDelAutor}</Insignia>
        )}

        {publicacion.puedeEliminar && (
          <Boton
            variante="fantasma"
            soloIcono
            aria-label="Eliminar la publicación"
            onClick={() => alPedirEliminar(publicacion.id)}
          >
            <Trash2 size={15} />
          </Boton>
        )}
      </header>

      {publicacion.contenido && <p className="publicacion__contenido">{publicacion.contenido}</p>}

      {publicacion.archivo && (
        <img
          className="publicacion__adjunto"
          src={urlDeArchivo(publicacion.archivo)}
          alt="Adjunto de la publicación"
        />
      )}

      <div style={{ marginTop: "var(--e-corto)" }}>
        <Boton variante="fantasma" icono={Reply} onClick={() => setRespondiendo(!respondiendo)}>
          Responder
        </Boton>
      </div>

      {(publicacion.respuestas.length > 0 || respondiendo) && (
        <div className="publicacion__respuestas">
          {publicacion.respuestas.map((respuesta) => (
            <div key={respuesta.id}>
              <div className="fila">
                <span className="respuesta__autor">{respuesta.usuario}</span>
                <span className="publicacion__fecha">{fechaYHora(respuesta.fecha)}</span>

                {respuesta.puedeEliminar && (
                  <Boton
                    variante="fantasma"
                    soloIcono
                    aria-label="Eliminar la respuesta"
                    onClick={() => alPedirEliminar(respuesta.id)}
                  >
                    <Trash2 size={13} />
                  </Boton>
                )}
              </div>

              {respuesta.contenido && <p className="publicacion__contenido">{respuesta.contenido}</p>}

              {respuesta.archivo && (
                <img
                  className="publicacion__adjunto"
                  src={urlDeArchivo(respuesta.archivo)}
                  alt="Adjunto de la respuesta"
                />
              )}
            </div>
          ))}

          {respondiendo && (
            <NuevaPublicacion
              idPostPadre={publicacion.id}
              alPublicar={alResponder}
              alCancelar={() => setRespondiendo(false)}
            />
          )}
        </div>
      )}
    </article>
  );
}
