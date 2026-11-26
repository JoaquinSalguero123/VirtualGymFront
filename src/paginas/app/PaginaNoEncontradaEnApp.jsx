import { useNavigate } from "react-router-dom";
import { Compass } from "lucide-react";

import { useTitulo } from "../../hooks/useTitulo.js";
import { EstadoVacio } from "../../componentes/ui/Estados.jsx";
import { Panel } from "../../componentes/ui/Panel.jsx";

/**
 * Caso de uso "Manejar una URL inexistente" dentro de la aplicación: a
 * diferencia del sitio público, acá conviene mantener la barra lateral en vez
 * de mandar a quien esté logueado de vuelta a la portada.
 */
export default function PaginaNoEncontradaEnApp() {
  useTitulo("Página no encontrada");
  const navegar = useNavigate();

  return (
    <Panel>
      <EstadoVacio
        icono={Compass}
        titulo="Esta página no existe."
        accion={{ texto: "Ir al inicio", onClick: () => navegar("/app") }}
      >
        <p>Revisá la dirección o volvé al inicio de la aplicación.</p>
      </EstadoVacio>
    </Panel>
  );
}
