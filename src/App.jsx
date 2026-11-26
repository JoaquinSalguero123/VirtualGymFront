import { Route, Routes } from "react-router-dom";

import "./styles/ui.css";
import "./styles/estructura.css";
import "./styles/publico.css";
import "./styles/app.css";

import { ProveedorDeSesion } from "./contexto/SesionContexto.jsx";
import { ROLES } from "./dominio/roles.js";
import { CascaronPublico } from "./componentes/estructura/CascaronPublico.jsx";
import { CascaronDeApp } from "./componentes/estructura/CascaronDeApp.jsx";
import { RutaConRol, RutaProtegida } from "./rutas/RutaProtegida.jsx";

/* ---------- Sitio público ---------- */
import Inicio from "./paginas/publico/Inicio.jsx";
import PaginaDePlanes from "./paginas/publico/PaginaDePlanes.jsx";
import PaginaDeSucursales from "./paginas/publico/PaginaDeSucursales.jsx";
import PaginaNoEncontrada from "./paginas/publico/PaginaNoEncontrada.jsx";

/* ---------- Acceso ---------- */
import Ingresar from "./paginas/acceso/Ingresar.jsx";
import CrearCuenta from "./paginas/acceso/CrearCuenta.jsx";
import RecuperarClave from "./paginas/acceso/RecuperarClave.jsx";

/* ---------- Cuenta del socio ---------- */
import InicioDeApp from "./paginas/app/InicioDeApp.jsx";
import MiRutina from "./paginas/socio/MiRutina.jsx";
import MiAlimentacion from "./paginas/socio/MiAlimentacion.jsx";
import MisCuotas from "./paginas/socio/MisCuotas.jsx";
import MisAsistencias from "./paginas/socio/MisAsistencias.jsx";
import MiProgreso from "./paginas/socio/MiProgreso.jsx";
import SumarmeAOtraSucursal from "./paginas/socio/SumarmeAOtraSucursal.jsx";

/* ---------- Mostrador ---------- */
import PadronDeSocios from "./paginas/gestion/PadronDeSocios.jsx";
import Cobranzas from "./paginas/gestion/Cobranzas.jsx";
import ControlDeAcceso from "./paginas/gestion/ControlDeAcceso.jsx";

/* ---------- Entrenamiento y nutrición ---------- */
import GestionDeEjercicios from "./paginas/gestion/GestionDeEjercicios.jsx";
import PlantillasDeRutina from "./paginas/gestion/PlantillasDeRutina.jsx";
import GestionDeAlimentos from "./paginas/gestion/GestionDeAlimentos.jsx";

/* ---------- Administración ---------- */
import GestionDePersonal from "./paginas/gestion/GestionDePersonal.jsx";
import GestionDePlanes from "./paginas/gestion/GestionDePlanes.jsx";
import GestionDeFormasDePago from "./paginas/gestion/GestionDeFormasDePago.jsx";
import GestionDeSucursales from "./paginas/gestion/GestionDeSucursales.jsx";
import GestionDeHorarios from "./paginas/gestion/GestionDeHorarios.jsx";
import GestionDeCatalogos from "./paginas/gestion/GestionDeCatalogos.jsx";
import GestionDelSitio from "./paginas/gestion/GestionDelSitio.jsx";

/* ---------- Comunidad ---------- */
import Foro from "./paginas/app/Foro.jsx";

/* ---------- Errores ---------- */
import PaginaNoEncontradaEnApp from "./paginas/app/PaginaNoEncontradaEnApp.jsx";

/**
 * Mapa de rutas de la aplicación.
 *
 * Se divide en tres zonas:
 *   - el sitio público, con el cascarón verde inmersivo;
 *   - las pantallas de acceso, sin cascarón;
 *   - la aplicación, detrás de RutaProtegida y con la barra lateral.
 */
export default function App() {
  return (
    <ProveedorDeSesion>
      <Routes>
        {/* Sitio público */}
        <Route element={<CascaronPublico />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/planes" element={<PaginaDePlanes />} />
          <Route path="/sucursales" element={<PaginaDeSucursales />} />
          <Route path="*" element={<PaginaNoEncontrada />} />
        </Route>

        {/* Acceso */}
        <Route path="/ingresar" element={<Ingresar />} />
        <Route path="/crear-cuenta" element={<CrearCuenta />} />
        <Route path="/recuperar-clave" element={<RecuperarClave />} />

        {/* Aplicación */}
        <Route
          path="/app"
          element={
            <RutaProtegida>
              <CascaronDeApp />
            </RutaProtegida>
          }
        >
          <Route index element={<InicioDeApp />} />

          {/* Cuenta del socio */}
          <Route path="rutina" element={<MiRutina />} />
          <Route path="alimentacion" element={<MiAlimentacion />} />
          <Route path="cuotas" element={<MisCuotas />} />
          <Route path="asistencias" element={<MisAsistencias />} />
          <Route path="progreso" element={<MiProgreso />} />
          <Route path="sumarme" element={<SumarmeAOtraSucursal />} />
          <Route path="foro" element={<Foro />} />

          {/* Mostrador */}
          <Route
            path="socios"
            element={
              <RutaConRol roles={[ROLES.recepcionista, ROLES.administrador, ROLES.entrenador, ROLES.nutricionista]}>
                <PadronDeSocios />
              </RutaConRol>
            }
          />
          <Route
            path="cobranzas"
            element={
              <RutaConRol roles={[ROLES.recepcionista, ROLES.administrador]}>
                <Cobranzas />
              </RutaConRol>
            }
          />
          <Route
            path="control-de-acceso"
            element={
              <RutaConRol roles={[ROLES.recepcionista, ROLES.administrador, ROLES.entrenador]}>
                <ControlDeAcceso />
              </RutaConRol>
            }
          />

          {/* Entrenamiento */}
          <Route
            path="ejercicios"
            element={
              <RutaConRol roles={[ROLES.entrenador, ROLES.administrador]}>
                <GestionDeEjercicios />
              </RutaConRol>
            }
          />
          <Route
            path="plantillas"
            element={
              <RutaConRol roles={[ROLES.entrenador, ROLES.administrador]}>
                <PlantillasDeRutina />
              </RutaConRol>
            }
          />

          {/* Nutrición */}
          <Route
            path="alimentos"
            element={
              <RutaConRol roles={[ROLES.nutricionista, ROLES.administrador]}>
                <GestionDeAlimentos />
              </RutaConRol>
            }
          />

          {/* Administración */}
          <Route
            path="personal"
            element={
              <RutaConRol roles={[ROLES.administrador]}>
                <GestionDePersonal />
              </RutaConRol>
            }
          />
          <Route
            path="planes"
            element={
              <RutaConRol roles={[ROLES.administrador]}>
                <GestionDePlanes />
              </RutaConRol>
            }
          />
          <Route
            path="formas-de-pago"
            element={
              <RutaConRol roles={[ROLES.administrador]}>
                <GestionDeFormasDePago />
              </RutaConRol>
            }
          />
          <Route
            path="sucursales"
            element={
              <RutaConRol roles={[ROLES.administrador]}>
                <GestionDeSucursales />
              </RutaConRol>
            }
          />
          <Route
            path="horarios"
            element={
              <RutaConRol roles={[ROLES.recepcionista, ROLES.administrador]}>
                <GestionDeHorarios />
              </RutaConRol>
            }
          />
          <Route
            path="catalogos"
            element={
              <RutaConRol roles={[ROLES.entrenador, ROLES.nutricionista, ROLES.administrador]}>
                <GestionDeCatalogos />
              </RutaConRol>
            }
          />
          <Route
            path="sitio-web"
            element={
              <RutaConRol roles={[ROLES.administrador, ROLES.entrenador]}>
                <GestionDelSitio />
              </RutaConRol>
            }
          />

          {/* Cualquier otra dirección dentro de /app: 404 sin perder la barra lateral. */}
          <Route path="*" element={<PaginaNoEncontradaEnApp />} />
        </Route>
      </Routes>
    </ProveedorDeSesion>
  );
}
