/** Etiqueta de estado. El tono se elige con `tono`. */
export function Insignia({ tono = "neutra", children }) {
  return <span className={`insignia insignia--${tono}`}>{children}</span>;
}

/* Tono que corresponde a cada estado de pago del backend. */
const TONO_DE_PAGO = {
  Pagado: "ok",
  Pendiente: "aviso",
  Rechazado: "alerta",
  Vencido: "alerta",
  Anulado: "neutra",
};

/** Insignia del estado de un pago. */
export function EstadoDePago({ estado }) {
  if (!estado) return <span className="texto-tenue">Sin cargar</span>;

  return <Insignia tono={TONO_DE_PAGO[estado] ?? "neutra"}>{estado}</Insignia>;
}

/* Tono que corresponde a cada estado de socio. */
const TONO_DE_SOCIO = {
  Activo: "ok",
  Moroso: "alerta",
  Suspendido: "aviso",
  Baja: "neutra",
};

/** Insignia del estado de un socio. */
export function EstadoDeSocio({ estado }) {
  return <Insignia tono={TONO_DE_SOCIO[estado] ?? "neutra"}>{estado}</Insignia>;
}
