import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

import { useTitulo } from "../../hooks/useTitulo.js";

/** Caso de uso "Manejar una URL inexistente": cualquier dirección pública que no matchea. */
export default function PaginaNoEncontrada() {
  useTitulo("Página no encontrada");

  return (
    <section className="seccion" style={{ borderTop: "none", textAlign: "center" }}>
      <Compass size={40} style={{ opacity: 0.6, marginBottom: "var(--e-normal)" }} />
      <h1 className="seccion__titulo">Esta página no existe</h1>
      <p className="seccion__bajada">
        Revisá la dirección o volvé a un lugar conocido.
      </p>

      <p style={{ marginTop: "var(--e-amplio)" }}>
        <Link to="/" className="boton boton--principal">
          Ir a la portada
        </Link>
      </p>
    </section>
  );
}
