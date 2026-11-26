import { Link } from "react-router-dom";

/**
 * Logotipo de la aplicación.
 *
 * Es puramente tipográfico: el nombre compuesto en ancho expandido, con la
 * segunda sílaba en el color de marca. Un gimnasio con una palabra bien
 * compuesta se sostiene mejor que uno con un isotipo genérico.
 */
export function Marca({ grande = false, a = "/" }) {
  return (
    <Link to={a} className={`marca${grande ? " marca--grande" : ""}`} aria-label="VirtualGym, inicio">
      Virtual<span className="marca__acento">Gym</span>
    </Link>
  );
}
