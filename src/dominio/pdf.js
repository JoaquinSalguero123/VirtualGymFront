/**
 * Exportación a PDF de la rutina, el plan de alimentación y la constancia de pago.
 *
 * Cubre los casos de uso "Descargar rutina o dieta en PDF" (el socio se lleva
 * su plan impreso o en el teléfono para consultarlo en la sala, sin depender
 * de tener señal) y "Descargar o mandar por mail la constancia de un pago".
 *
 * El PDF respeta la identidad: verde de marca en la cabecera y tabla de una
 * sola línea, igual que en pantalla.
 */

import { moneda } from "./formato.js";

/**
 * Carga jsPDF recién cuando hace falta.
 *
 * La librería pesa cerca de 400 kB, y sólo se usa al tocar "Descargar en PDF".
 * Con la importación dinámica, ese peso no entra en el paquete inicial y la
 * aplicación abre más rápido para todo el mundo.
 */
async function cargarJsPdf() {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  return { jsPDF, autoTable };
}

/* Verde de marca y tinta, en el formato RGB que usa jsPDF. */
const VERDE = [23, 55, 43];
const TINTA = [23, 26, 24];
const ACERO = [140, 148, 144];

/** Dibuja la cabecera común y devuelve la altura ocupada. */
function dibujarCabecera(documento, titulo, subtitulo) {
  const anchoPagina = documento.internal.pageSize.getWidth();

  documento.setFillColor(...VERDE);
  documento.rect(0, 0, anchoPagina, 26, "F");

  documento.setTextColor(255, 255, 255);
  documento.setFont("helvetica", "bold");
  documento.setFontSize(15);
  documento.text("VirtualGym", 14, 13);

  documento.setFont("helvetica", "normal");
  documento.setFontSize(9);
  documento.text(titulo, 14, 20);

  documento.setTextColor(...TINTA);
  documento.setFont("helvetica", "bold");
  documento.setFontSize(13);
  documento.text(subtitulo, 14, 38);

  return 44;
}

/** Pie con la fecha de emisión y el número de página. */
function dibujarPie(documento) {
  const total = documento.internal.getNumberOfPages();
  const anchoPagina = documento.internal.pageSize.getWidth();
  const altoPagina = documento.internal.pageSize.getHeight();

  for (let pagina = 1; pagina <= total; pagina++) {
    documento.setPage(pagina);
    documento.setFontSize(8);
    documento.setTextColor(...ACERO);

    documento.text(
      `Emitido el ${new Date().toLocaleDateString("es-AR")}`,
      14,
      altoPagina - 10,
    );

    documento.text(`${pagina} de ${total}`, anchoPagina - 14, altoPagina - 10, {
      align: "right",
    });
  }
}

/**
 * Genera el PDF de una rutina.
 *
 * @param rutina Objeto con { nombre, dias: [{ dia, ejercicios }] }.
 * @param socio Nombre del socio, para el encabezado.
 */
export async function descargarRutinaEnPdf(rutina, socio) {
  const { jsPDF, autoTable } = await cargarJsPdf();
  const documento = new jsPDF();

  let y = dibujarCabecera(documento, `Rutina de ${socio}`, rutina.nombre);

  rutina.dias.forEach((dia) => {
    autoTable(documento, {
      startY: y,
      head: [[`Día ${dia.dia}`, "Series", "Repeticiones", "Descanso"]],
      body: dia.ejercicios.map((ejercicio) => [
        `${ejercicio.orden}. ${ejercicio.ejercicio}  (${ejercicio.grupo})`,
        ejercicio.series ?? "—",
        ejercicio.repeticiones ?? "—",
        ejercicio.descansoSeg ? `${ejercicio.descansoSeg} s` : "—",
      ]),
      theme: "plain",
      headStyles: { fillColor: VERDE, textColor: 255, fontStyle: "bold" },
      bodyStyles: { textColor: TINTA, fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 95 },
        1: { halign: "center" },
        2: { halign: "center" },
        3: { halign: "center" },
      },
      margin: { left: 14, right: 14 },
      didDrawPage: () => {},
    });

    y = documento.lastAutoTable.finalY + 8;
  });

  dibujarPie(documento);
  documento.save(`rutina-${socio.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

/**
 * Genera el PDF de un plan de alimentación.
 *
 * @param dieta Objeto con { nombre, dias: [{ dia, comidas }] }.
 * @param socio Nombre del socio, para el encabezado.
 */
export async function descargarDietaEnPdf(dieta, socio) {
  const { jsPDF, autoTable } = await cargarJsPdf();
  const documento = new jsPDF();

  const y = dibujarCabecera(documento, `Plan de alimentación de ${socio}`, dieta.nombre);

  /* Una sola tabla con todos los días: así se lee de corrido y no queda una
     tabla de tres filas por día. */
  const cuerpo = dieta.dias.flatMap((dia) =>
    dia.comidas.map((comida, indice) => [
      indice === 0 ? dia.dia : "",
      comida.categoria,
      comida.alimento,
      comida.calorias != null ? `${comida.calorias} kcal` : "—",
    ]),
  );

  autoTable(documento, {
    startY: y,
    head: [["Día", "Comida", "Qué se come", "Calorías"]],
    body: cuerpo,
    theme: "plain",
    headStyles: { fillColor: VERDE, textColor: 255, fontStyle: "bold" },
    bodyStyles: { textColor: TINTA, fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 22, fontStyle: "bold" },
      1: { cellWidth: 32 },
      3: { halign: "right", cellWidth: 24 },
    },
    margin: { left: 14, right: 14 },
  });

  dibujarPie(documento);
  documento.save(`alimentacion-${socio.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

/**
 * Arma el PDF de la constancia de un pago ya aprobado, sin guardarlo: lo puede
 * descargar quien llama (documento.save(...)) o mandarlo por mail después de
 * convertirlo con pdfComoBase64.
 *
 * @param pago Objeto PagoDto, con Estado === "Pagado".
 */
async function armarConstanciaDePagoPdf(pago) {
  const { jsPDF, autoTable } = await cargarJsPdf();
  const documento = new jsPDF();

  const y = dibujarCabecera(documento, "Constancia de pago", pago.socio);

  const fechaDePago = pago.fechaPago
    ? new Date(pago.fechaPago).toLocaleDateString("es-AR")
    : "—";

  autoTable(documento, {
    startY: y,
    body: [
      ["Socio", pago.socio],
      ["N.º de socio", pago.numeroSocio ? String(pago.numeroSocio) : "—"],
      ["Sucursal", pago.sucursal],
      ["Período", `${pago.mes} ${pago.periodoAnio}`],
      ["Plan", pago.plan ?? "—"],
      ["Forma de pago", pago.formaPago],
      ["Comprobante", pago.comprobante ?? "—"],
      ["Fecha de pago", fechaDePago],
      ["Monto", moneda(pago.monto)],
    ],
    theme: "plain",
    styles: { fontSize: 10, cellPadding: { top: 3, bottom: 3, left: 0, right: 8 } },
    columnStyles: {
      0: { fontStyle: "bold", textColor: TINTA, cellWidth: 45 },
      1: { textColor: TINTA },
    },
    margin: { left: 14, right: 14 },
  });

  dibujarPie(documento);

  return documento;
}

/** Descarga la constancia de un pago ya aprobado. */
export async function descargarConstanciaDePagoEnPdf(pago) {
  const documento = await armarConstanciaDePagoPdf(pago);
  const archivo = `constancia-pago-${pago.socio.toLowerCase().replace(/\s+/g, "-")}-${pago.mes.toLowerCase()}-${pago.periodoAnio}.pdf`;

  documento.save(archivo);
}

/**
 * Arma la constancia de un pago ya aprobado y la devuelve en base64, lista para
 * mandar al backend y que la adjunte a un mail.
 */
export async function constanciaDePagoEnBase64(pago) {
  const documento = await armarConstanciaDePagoPdf(pago);
  const bytes = new Uint8Array(documento.output("arraybuffer"));

  // En trozos para no pasarle a String.fromCharCode un array gigante de una:
  // con archivos grandes explota la pila de llamadas.
  const trozo = 0x8000;
  let binario = "";

  for (let i = 0; i < bytes.length; i += trozo) {
    binario += String.fromCharCode(...bytes.subarray(i, i + trozo));
  }

  return btoa(binario);
}
