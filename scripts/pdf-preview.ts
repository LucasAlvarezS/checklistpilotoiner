import { writeFile } from "node:fs/promises";
import { getItemsPlanos, esPaisValido, PAIS_POR_DEFECTO } from "../src/lib/checklist-schema";
import { construirFilas, calcularEstado } from "../src/lib/inspeccion";
import { generarPdf } from "../src/lib/pdf";

async function main() {
  const pais = esPaisValido(process.argv[2]) ? process.argv[2] : PAIS_POR_DEFECTO;
  const respuestas: Record<string, { valor: "SI" | "NO" | "NA"; observacion?: string }> = {};
  getItemsPlanos(pais).forEach((it, i) => {
    if (i === 3) respuestas[it.id] = { valor: "NO", observacion: "Documento vencido, requiere renovación." };
    else if (i === 10) respuestas[it.id] = { valor: "NA" };
    else respuestas[it.id] = { valor: "SI" };
  });
  const filas = construirFilas(respuestas, pais);
  const pdf = await generarPdf({
    pais,
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
