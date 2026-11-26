import { useCallback, useEffect, useState } from "react";

import { useSesion } from "../contexto/SesionContexto.jsx";

/**
 * Ejecuta una petición al backend y devuelve su estado de carga.
 *
 * Evita repetir en cada pantalla el mismo trío de useState (datos, cargando,
 * error) más el useEffect con su bandera de cancelación.
 *
 * IMPORTANTE: la sucursal activa se agrega sola a las dependencias.
 *
 * En este sistema casi todos los datos están acotados a una sucursal: el padrón,
 * las cuotas, las asistencias y hasta los permisos cambian según la sede desde la
 * que se esté operando. Si cada pantalla tuviera que acordarse de incluir la
 * sucursal en sus dependencias, alcanzaría con olvidarla una vez para que el
 * usuario cambie de sede y siga viendo los datos de la anterior, sin ningún
 * indicio de que algo anda mal. Resolverlo acá elimina esa clase de error de
 * raíz.
 *
 * @param peticion Función que devuelve la promesa de axios. Tiene que estar
 *                 memorizada con useCallback, o declarada fuera del componente.
 * @param dependencias Cuando alguna cambia, se vuelve a pedir.
 */
export function usePeticion(peticion, dependencias = []) {
  const { idSucursalActiva } = useSesion();

  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [recargas, setRecargas] = useState(0);

  /** Vuelve a ejecutar la petición. Se usa después de crear o editar algo. */
  const recargar = useCallback(() => setRecargas((n) => n + 1), []);

  useEffect(() => {
    let vigente = true;

    setCargando(true);
    setError(null);

    peticion()
      .then(({ data }) => {
        if (vigente) setDatos(data);
      })
      .catch((err) => {
        if (vigente) setError(err);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencias, recargas, idSucursalActiva]);

  return { datos, cargando, error, recargar, setDatos };
}
