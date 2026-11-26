import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { auth } from "../api/endpoints.js";
import {
  definirSucursal,
  definirToken,
  obtenerSucursal,
  obtenerToken,
} from "../api/cliente.js";
import { esRolDePersonal, nivelDeRol } from "../dominio/roles.js";

const SesionContexto = createContext(null);

/**
 * Estado de sesión de la aplicación.
 *
 * Además de "quién soy", guarda "desde qué sucursal estoy trabajando", que en
 * este sistema es igual de importante: el rol de una persona depende de la
 * sede, así que cambiar de sucursal puede cambiar lo que puede hacer.
 */
export function ProveedorDeSesion({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [idSucursalActiva, setIdSucursalActiva] = useState(obtenerSucursal());
  const [cargando, setCargando] = useState(Boolean(obtenerToken()));

  /** Cierra la sesión y limpia todo lo que quedó guardado. */
  const cerrarSesion = useCallback(() => {
    definirToken(null);
    definirSucursal(null);
    setUsuario(null);
    setIdSucursalActiva(null);
  }, []);

  /**
   * Toma la respuesta del login y deja la sesión lista.
   * Si el usuario todavía no tenía una sucursal elegida, se usa la primera que
   * devuelve el backend (que ya viene ordenada con la casa matriz primero).
   */
  const aplicarSesion = useCallback((sesion) => {
    definirToken(sesion.token);
    setUsuario(sesion.usuario);

    const guardada = obtenerSucursal();
    const sigueDisponible = sesion.usuario.sucursales.some((s) => s.idGimnasio === guardada);
    const elegida = sigueDisponible ? guardada : sesion.usuario.sucursales[0]?.idGimnasio ?? null;

    definirSucursal(elegida);
    setIdSucursalActiva(elegida);

    return sesion;
  }, []);

  const iniciarSesion = useCallback(
    async (credenciales) => {
      const { data } = await auth.iniciarSesion(credenciales);

      return aplicarSesion(data);
    },
    [aplicarSesion],
  );

  /* Registrarse no pasa por acá a propósito: el registro no devuelve sesión, la cuenta
     queda sin acceso hasta confirmar el email (ver VerificacionDeEmail). */

  /** Vuelve a pedir la sesión al backend: refresca sucursales y roles. */
  const refrescarSesion = useCallback(async () => {
    const { data } = await auth.sesionActual();

    setUsuario(data.usuario);

    return data;
  }, []);

  const cambiarSucursal = useCallback((idGimnasio) => {
    definirSucursal(idGimnasio);
    setIdSucursalActiva(idGimnasio);
  }, []);

  /* Al arrancar, si había un token guardado se valida contra el backend.
     Así una sesión vencida no deja la aplicación en un estado a medias. */
  useEffect(() => {
    // Sin token guardado no hay nada que validar: el estado ya arrancó en
    // "no está cargando", porque se inicializó a partir del token.
    if (!obtenerToken()) return;

    let vigente = true;

    auth
      .sesionActual()
      .then(({ data }) => {
        if (!vigente) return;
        aplicarSesion(data);
      })
      .catch(() => {
        if (!vigente) return;
        cerrarSesion();
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [aplicarSesion, cerrarSesion]);

  /* El cliente HTTP avisa cuando el backend rechaza el token: se cierra la
     sesión sin que cada pantalla tenga que manejarlo. */
  useEffect(() => {
    window.addEventListener("vga:sesion-expirada", cerrarSesion);

    return () => window.removeEventListener("vga:sesion-expirada", cerrarSesion);
  }, [cerrarSesion]);

  const valor = useMemo(() => {
    const sucursales = usuario?.sucursales ?? [];
    const sucursalActiva = sucursales.find((s) => s.idGimnasio === idSucursalActiva) ?? null;
    const rolActivo = sucursalActiva?.rol ?? null;

    return {
      usuario,
      cargando,
      autenticado: Boolean(usuario),

      sucursales,
      sucursalActiva,
      idSucursalActiva,
      cambiarSucursal,

      rolActivo,
      esDuenio: usuario?.esDuenio ?? false,

      /** True si el rol activo está entre los indicados. El dueño siempre pasa. */
      tieneRol: (...roles) =>
        (usuario?.esDuenio ?? false) || (rolActivo !== null && roles.includes(rolActivo)),

      /** True si el rol activo alcanza al menos el nivel del rol indicado. */
      alcanzaNivel: (rolMinimo) =>
        (usuario?.esDuenio ?? false) || nivelDeRol(rolActivo) >= nivelDeRol(rolMinimo),

      /** True si el usuario forma parte del personal del gimnasio. */
      esPersonal: (usuario?.esDuenio ?? false) || esRolDePersonal(rolActivo),

      iniciarSesion,
      refrescarSesion,
      cerrarSesion,

      /**
       * Adopta directamente una sesión que ya vino armada del backend (por ejemplo al
       * confirmar el código de verificación), sin el viaje extra de refrescarSesion.
       */
      aplicarSesion,
    };
  }, [
    usuario,
    cargando,
    idSucursalActiva,
    cambiarSucursal,
    iniciarSesion,
    refrescarSesion,
    cerrarSesion,
    aplicarSesion,
  ]);

  return <SesionContexto.Provider value={valor}>{children}</SesionContexto.Provider>;
}

/** Acceso a la sesión desde cualquier componente. */
export function useSesion() {
  const contexto = useContext(SesionContexto);

  if (!contexto) {
    throw new Error("useSesion tiene que usarse dentro de <ProveedorDeSesion>.");
  }

  return contexto;
}

