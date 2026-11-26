import { Search } from "lucide-react";

/** Campo de búsqueda con la lupa adentro. */
export function Buscador({ valor, alCambiar, marcador = "Buscar" }) {
  return (
    <div className="filtros__buscador">
      <Search size={15} className="filtros__lupa" />

      <input
        type="search"
        className="campo__control"
        value={valor}
        placeholder={marcador}
        aria-label={marcador}
        onChange={(evento) => alCambiar(evento.target.value)}
      />
    </div>
  );
}
