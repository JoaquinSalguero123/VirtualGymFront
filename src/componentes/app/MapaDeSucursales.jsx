import { useEffect, useRef, useState } from "react";
import {
  LngLatBounds,
  Map as MapaGL,
  Marker,
  NavigationControl,
  Popup,
  setWorkerUrl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
// Con un bundler, MapLibre 6 necesita que se le diga dónde está su worker. El sufijo
// "?worker&url" hace que Vite lo empaquete y devuelva la URL final.
import urlDelWorker from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

import {
  CENTRO_POR_DEFECTO,
  ESTILO_DE_MAPA,
  prefiereMenosMovimiento,
  urlDeComoLlegar,
} from "../../dominio/mapas.js";

setWorkerUrl(urlDelWorker);

/** Textos de los controles de MapLibre, que por defecto vienen en inglés. */
const TEXTOS = {
  "NavigationControl.ZoomIn": "Acercar",
  "NavigationControl.ZoomOut": "Alejar",
  "AttributionControl.ToggleAttribution": "Mostrar los créditos del mapa",
  "AttributionControl.MapFeedback": "Informar un problema del mapa",
  "CooperativeGesturesHandler.WindowsHelpText": "Usá Ctrl + scroll para acercar o alejar el mapa",
  "CooperativeGesturesHandler.MacHelpText": "Usá ⌘ + scroll para acercar o alejar el mapa",
  "CooperativeGesturesHandler.MobileHelpText": "Usá dos dedos para mover el mapa",
  "Popup.Close": "Cerrar",
};

/* Forma de gota. Los colores salen de las clases de publico.css, que leen los tokens. */
const PIN = `<svg viewBox="0 0 32 40" width="32" height="40" aria-hidden="true" focusable="false">
  <path class="pin-sede__cuerpo" d="M16 1C8.3 1 2 7.2 2 14.8 2 25 16 39 16 39s14-14 14-24.2C30 7.2 23.7 1 16 1z" />
  <circle class="pin-sede__centro" cx="16" cy="15" r="5.5" />
</svg>`;

/** Sin WebGL2 MapLibre 6 no puede dibujar nada, así que se avisa en vez de dejar un hueco. */
function soportaWebGL2() {
  try {
    return Boolean(document.createElement("canvas").getContext("webgl2"));
  } catch {
    return false;
  }
}

/** Botón con forma de pin. Es un botón de verdad para que se pueda alcanzar con el teclado. */
function crearPin(sede) {
  const boton = document.createElement("button");

  boton.type = "button";
  boton.className = sede.esCasaMatriz ? "pin-sede pin-sede--matriz" : "pin-sede";
  boton.setAttribute("aria-label", `Ver ${sede.nombre} en el mapa`);
  boton.setAttribute("aria-pressed", "false");
  boton.innerHTML = PIN;

  return boton;
}

/**
 * Contenido del globo que se abre sobre el pin. Se arma con nodos y textContent, nunca
 * con HTML armado a mano: el nombre y la dirección los carga la administración.
 */
function crearContenidoDelGlobo(sede) {
  const caja = document.createElement("div");
  caja.className = "globo-sede";

  const nombre = document.createElement("strong");
  nombre.textContent = sede.nombre;

  const direccion = document.createElement("span");
  direccion.textContent = sede.direccion;

  const enlace = document.createElement("a");
  enlace.href = urlDeComoLlegar(sede.direccion, sede.latitud, sede.longitud);
  enlace.target = "_blank";
  enlace.rel = "noopener noreferrer";
  enlace.textContent = "Cómo llegar";

  caja.append(nombre, direccion, enlace);

  return caja;
}

/** Encuadra todas las sedes a la vez. Con una sola no hay caja que ajustar: se centra en ella. */
function ajustarAVistaGeneral(mapa, sedes, animar) {
  if (sedes.length === 0) return;

  if (sedes.length === 1) {
    mapa.jumpTo({ center: [sedes[0].longitud, sedes[0].latitud], zoom: 15 });
    return;
  }

  const limites = new LngLatBounds();
  sedes.forEach((sede) => limites.extend([sede.longitud, sede.latitud]));

  mapa.fitBounds(limites, {
    padding: 80,
    maxZoom: 14,
    duration: animar && !prefiereMenosMovimiento() ? 700 : 0,
  });
}

/**
 * Mapa grande con un pin por sucursal.
 *
 * Recibe sólo las sedes que tienen coordenadas. La sede elegida (`idActiva`) la maneja
 * quien lo usa, para que el mapa y las tarjetas de la lista se mantengan sincronizados:
 * tocar un pin la elige, y elegirla desde afuera hace volar la cámara hasta su pin.
 *
 * @param sedes Sucursales con latitud y longitud. Tiene que ser un arreglo estable
 *              (memorizado): si cambia de identidad, se vuelven a dibujar los pines.
 * @param idActiva Id de la sede elegida, o null si no hay ninguna.
 * @param alElegir Recibe el id de la sede tocada, o null cuando se cierra el globo.
 */
export default function MapaDeSucursales({ sedes, idActiva, alElegir }) {
  const [soportado] = useState(soportaWebGL2);

  const contenedor = useRef(null);
  const mapa = useRef(null);
  const globo = useRef(null);
  const pines = useRef(new Map());

  /* Los eventos del mapa se registran una sola vez, así que leen siempre el último
     callback desde acá en vez de quedarse con el de la primera vez que se dibujó. */
  const elegir = useRef(alElegir);
  useEffect(() => {
    elegir.current = alElegir;
  });

  /* Mientras el código abre o cierra el globo, su evento "close" no tiene que contarse
     como que la persona lo cerró. */
  const moviendoElGlobo = useRef(false);

  /* 1. El mapa se crea una sola vez. */
  useEffect(() => {
    if (!soportado) return;

    let instancia;

    try {
      instancia = new MapaGL({
        container: contenedor.current,
        style: ESTILO_DE_MAPA,
        center: CENTRO_POR_DEFECTO,
        zoom: 11,
        locale: TEXTOS,
        attributionControl: { compact: true },
        // El mapa va en medio de una página que se desplaza: sin esto, la rueda del mouse
        // lo acercaría en vez de seguir bajando.
        cooperativeGestures: true,
        // Un mapa de ubicaciones no necesita rotarse ni inclinarse, y en el celular se
        // hace sin querer.
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
      });
    } catch (error) {
      console.error("No se pudo crear el mapa:", error);
      return;
    }

    instancia.touchZoomRotate.disableRotation();
    instancia.addControl(new NavigationControl({ showCompass: false }), "top-right");

    const ventana = new Popup({ offset: 34, maxWidth: "280px", closeOnClick: false });
    ventana.on("close", () => {
      if (!moviendoElGlobo.current) elegir.current?.(null);
    });

    mapa.current = instancia;
    globo.current = ventana;

    return () => {
      // Al desmontar, el globo también se cierra: no es que alguien lo haya cerrado.
      moviendoElGlobo.current = true;
      instancia.remove();
      moviendoElGlobo.current = false;

      mapa.current = null;
      globo.current = null;
    };
  }, [soportado]);

  /* 2. Un pin por sede. Se vuelve a hacer sólo si cambia la lista. */
  useEffect(() => {
    const instancia = mapa.current;
    if (!instancia) return;

    // Se toma el registro acá y no dentro de la limpieza: para entonces .current podría ser otro.
    const registroDePines = pines.current;

    const marcadores = sedes.map((sede) => {
      const elemento = crearPin(sede);
      elemento.addEventListener("click", () => elegir.current?.(sede.id));

      registroDePines.set(sede.id, elemento);

      return new Marker({ element: elemento, anchor: "bottom" })
        .setLngLat([sede.longitud, sede.latitud])
        .addTo(instancia);
    });

    ajustarAVistaGeneral(instancia, sedes, false);

    return () => {
      marcadores.forEach((marcador) => marcador.remove());
      registroDePines.clear();
    };
  }, [sedes, soportado]);

  /* 3. La sede elegida: pin resaltado, globo con sus datos y la cámara viaja hasta ahí. */
  useEffect(() => {
    const instancia = mapa.current;
    const ventana = globo.current;
    if (!instancia || !ventana) return;

    pines.current.forEach((elemento, id) => {
      const activo = id === idActiva;

      elemento.classList.toggle("pin-sede--activo", activo);
      elemento.setAttribute("aria-pressed", String(activo));
    });

    const sede = sedes.find((candidata) => candidata.id === idActiva);

    moviendoElGlobo.current = true;

    if (sede) {
      ventana
        .setLngLat([sede.longitud, sede.latitud])
        .setDOMContent(crearContenidoDelGlobo(sede))
        .addTo(instancia);
    } else {
      ventana.remove();
    }

    moviendoElGlobo.current = false;

    if (sede) {
      instancia.flyTo({
        center: [sede.longitud, sede.latitud],
        zoom: Math.max(instancia.getZoom(), 14),
        duration: prefiereMenosMovimiento() ? 0 : 900,
        essential: false,
      });
    }
  }, [idActiva, sedes, soportado]);

  if (!soportado) {
    return (
      <p className="mapa__aviso">
        Tu navegador no puede mostrar el mapa interactivo. Las direcciones de cada sucursal
        están más abajo.
      </p>
    );
  }

  function verTodas() {
    elegir.current?.(null);

    if (mapa.current) ajustarAVistaGeneral(mapa.current, sedes, true);
  }

  return (
    <div className="mapa">
      <div
        ref={contenedor}
        className="mapa__lienzo"
        role="region"
        aria-label="Mapa con las ubicaciones de las sucursales"
      />

      {sedes.length > 1 && (
        <button type="button" className="mapa__todas" onClick={verTodas}>
          Ver todas las sedes
        </button>
      )}
    </div>
  );
}
