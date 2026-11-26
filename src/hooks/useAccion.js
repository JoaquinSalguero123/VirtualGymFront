import { useCallback, useState } from "react";

/**
 * Envuelve una acción que escribe en el backend (guardar, aprobar, eliminar).
 *
 * Expone si está en curso y el último error, que es lo que necesitan los
 * formularios para deshabilitar el botón y mostrar el mensaje. Devuelve el
 * resultado si salió bien, o null si falló, para poder encadenar sin try/catch
 * en cada pantalla.
 */
export function useAccion(accion) {
  const [enCurso, setEnCurso] = useState(false);
  const [error, setError] = useState(null);

  const ejecutar = useCallback(
    async (...argumentos) => {
      setEnCurso(true);
      setError(null);

      try {
        const respuesta = await accion(...argumentos);

        // OJO: acá tiene que ser "||" y no "??". Un 204 sin cuerpo llega de axios
        // como data === "" (string vacío, ni null ni undefined), así que "??" no
        // caía nunca al resto de la cadena y toda acción sin respuesta con cuerpo
        // (borrar, confirmar) se leía como fallida pese a haber salido bien.
        return respuesta?.data || respuesta || true;
      } catch (err) {
        setError(err);

        return null;
      } finally {
        setEnCurso(false);
      }
    },
    [accion],
  );

  return { ejecutar, enCurso, error, limpiarError: () => setError(null) };
}
