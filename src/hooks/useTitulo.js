import { useEffect } from "react";

/** Pone el título de la pestaña del navegador. */
export function useTitulo(titulo) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · VirtualGym` : "VirtualGym";
  }, [titulo]);
}
