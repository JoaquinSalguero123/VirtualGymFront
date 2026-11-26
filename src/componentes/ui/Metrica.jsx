/**
 * Una cifra con su etiqueta.
 *
 * Es el elemento tipográfico central del sistema: la cifra va en ancho
 * expandido, grande y sin caja alrededor.
 */
export function Metrica({ valor, etiqueta, detalle, acento = false, chica = false }) {
  return (
    <div className={`metrica${acento ? " metrica--acento" : ""}`}>
      <span className={`metrica__valor${chica ? " metrica__valor--chico" : ""}`}>{valor}</span>
      <span className="metrica__etiqueta">{etiqueta}</span>
      {detalle && <span className="metrica__detalle">{detalle}</span>}
    </div>
  );
}
