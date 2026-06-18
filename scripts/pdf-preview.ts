import { writeFile } from "node:fs/promises";
import { ITEMS_PLANOS } from "../src/lib/checklist-schema";
import { construirFilas, calcularEstado } from "../src/lib/inspeccion";
import { generarPdf } from "../src/lib/pdf";

async function main() {
  const respuestas: Record<string, { valor: "SI" | "NO" | "NA"; observacion?: string }> = {};
  ITEMS_PLANOS.forEach((it, i) => {
    if (i === 3) respuestas[it.id] = { valor: "NO", observacion: "Documento vencido, requiere renovación." };
    else if (i === 10) respuestas[it.id] = { valor: "NA" };
    else respuestas[it.id] = { valor: "SI" };
  });
  const filas = construirFilas(respuestas);
  const pdf = await generarPdf({
    codigo: "04",
    revision: "03",
    pilotoNombre: "Juan Pérez",
    parqueNombre: "Parque Eólico Norte",
    equipoRPA: "DJI Matrice 300",
    fecha: new Date(),
    estado: calcularEstado(filas),
    filas,
  });
  await writeFile("_preview.pdf", pdf);
  console.log("PDF generado: _preview.pdf", pdf.length, "bytes");
}
main();
