/**
 * Calendario de un mes con los días marcados resaltados.
 *
 * Se usa para las asistencias: de un vistazo se ve el ritmo de entrenamiento
 * del mes, que es más útil que una lista de fechas.
 */
export function CalendarioDelMes({ anio, mes, diasMarcados = [] }) {
  const marcados = new Set(diasMarcados);

  const diasEnElMes = new Date(anio, mes, 0).getDate();

  /* getDay() devuelve 0 para domingo; acá la semana empieza el lunes. */
  const primerDiaSemana = new Date(anio, mes - 1, 1).getDay();
  const huecosIniciales = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;

  const hoy = new Date();
  const esElMesActual = hoy.getFullYear() === anio && hoy.getMonth() + 1 === mes;

  return (
    <div className="calendario" role="table" aria-label={`Asistencias de ${mes}/${anio}`}>
      {["L", "M", "M", "J", "V", "S", "D"].map((inicial, indice) => (
        <span className="calendario__encabezado" key={indice} aria-hidden="true">
          {inicial}
        </span>
      ))}

      {Array.from({ length: huecosIniciales }, (_, indice) => (
        <span className="calendario__dia calendario__dia--vacio" key={`hueco-${indice}`} />
      ))}

      {Array.from({ length: diasEnElMes }, (_, indice) => {
        const dia = indice + 1;
        const asistio = marcados.has(dia);
        const esHoy = esElMesActual && hoy.getDate() === dia;

        const clases = [
          "calendario__dia",
          asistio && "calendario__dia--asistio",
          esHoy && "calendario__dia--hoy",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <span
            className={clases}
            key={dia}
            title={asistio ? `Día ${dia}: asististe` : `Día ${dia}`}
          >
            {dia}
          </span>
        );
      })}
    </div>
  );
}
