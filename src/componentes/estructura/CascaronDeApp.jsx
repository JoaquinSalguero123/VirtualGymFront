import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";

import { Boton } from "../ui/Boton.jsx";
import { BarraLateral } from "./BarraLateral.jsx";
import { Marca } from "./Marca.jsx";

/**
 * Estructura de la aplicación: barra lateral fija y área de contenido.
 *
 * En pantallas chicas la barra se esconde y se abre desde el botón de la barra
 * superior, que sólo aparece en ese tamaño.
 */
export function CascaronDeApp() {
  const [barraAbierta, setBarraAbierta] = useState(false);

  return (
    <div className="cascaron">
      <BarraLateral abierta={barraAbierta} alNavegar={() => setBarraAbierta(false)} />

      {barraAbierta && (
        <button
          type="button"
          className="cascaron__velo"
          aria-label="Cerrar el menú"
          onClick={() => setBarraAbierta(false)}
        />
      )}

      <div style={{ minWidth: 0 }}>
        <div className="barra-movil">
          <Boton
            variante="fantasma"
            soloIcono
            onClick={() => setBarraAbierta(true)}
            aria-label="Abrir el menú"
          >
            <Menu size={20} />
          </Boton>

          <Marca a="/app" />
        </div>

        <main className="cascaron__contenido">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
