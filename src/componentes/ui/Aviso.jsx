import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

const ICONOS = {
  error: AlertCircle,
  ok: CheckCircle2,
  atencion: TriangleAlert,
  info: Info,
};

/**
 * Mensaje en línea. Se usa para el resultado de una acción y para los errores
 * del backend: explica qué pasó y, cuando corresponde, qué hacer.
 */
export function Aviso({ tono = "info", titulo, children }) {
  const Icono = ICONOS[tono];

  return (
    <div className={`aviso aviso--${tono}`} role={tono === "error" ? "alert" : "status"}>
      <Icono size={16} style={{ flexShrink: 0, marginTop: 2 }} />

      <div className="aviso__cuerpo">
        {titulo && <div className="aviso__titulo">{titulo}</div>}
        {children}
      </div>
    </div>
  );
}

/**
 * Muestra un error devuelto por el backend.
 *
 * Si el error trae detalle por campo (validaciones), los lista; si no, muestra
 * el mensaje general. Devuelve null cuando no hay error, así se puede escribir
 * `<AvisoDeError error={error} />` sin condicional alrededor.
 */
export function AvisoDeError({ error }) {
  if (!error) return null;

  const porCampo = error.errores ? Object.values(error.errores).flat() : [];

  return (
    <Aviso tono="error" titulo={error.message}>
      {porCampo.length > 0 && (
        <ul className="aviso__lista">
          {porCampo.map((mensaje) => (
            <li key={mensaje}>{mensaje}</li>
          ))}
        </ul>
      )}
    </Aviso>
  );
}
