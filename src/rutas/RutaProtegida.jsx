import { Navigate, useLocation } from "react-router-dom";

import { useSesion } from "../contexto/SesionContexto.jsx";
import { Cargando } from "../componentes/ui/Estados.jsx";

/**
 * Deja pasar sólo a los usuarios autenticados.
 *
 * Mientras se valida el token guardado no decide nada: si redirigiera de una
 * vez, al recargar la página el usuario saldría disparado al login aunque su
 * sesión siguiera siendo válida.
 */
export function RutaProtegida({ children }) {
  const { autenticado, cargando } = useSesion();
  const ubicacion = useLocation();

  if (cargando) {
    return (
      <div className="acceso">
        <Cargando texto="Verificando tu sesión" />
      </div>
    );
  }

  if (!autenticado) {
    // Se recuerda a dónde quería ir para volver ahí después de entrar.
    return <Navigate to="/ingresar" replace state={{ destino: ubicacion.pathname }} />;
  }

  return children;
}

/**
 * Restringe una pantalla a ciertos roles.
 *
 * Es sólo una cortesía de la interfaz: el backend vuelve a verificar los
 * permisos en cada endpoint. Sirve para que nadie llegue a una pantalla que
 * va a mostrarle un error de permisos.
 */
export function RutaConRol({ roles, children }) {
  const { tieneRol, sucursalActiva } = useSesion();

  if (!sucursalActiva) {
    return (
      <div className="panel">
        <h2>Todavía no tenés una sucursal asignada</h2>
        <p className="texto-suave" style={{ marginTop: "var(--e-corto)" }}>
          Pedile a la administración del gimnasio que te asigne a una sucursal para
          poder operar.
        </p>
      </div>
    );
  }

  if (!tieneRol(...roles)) {
    return <Navigate to="/app" replace />;
  }

  return children;
}
