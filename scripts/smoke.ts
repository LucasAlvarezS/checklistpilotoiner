/**
 * Prueba end-to-end del flujo de envío.
 * Uso: npx tsx scripts/smoke.ts [conobs]
 *   - sin argumento: envía una inspección con TODO en SÍ.
 *   - "conobs": marca un ítem en NO con observación.
 */
import { ITEMS_PLANOS } from "../src/lib/checklist-schema";

const conObs = process.argv[2] === "conobs";
const URL = process.env.URL ?? "http://localhost:3000/api/inspecciones";

const respuestas: Record<string, { valor: string; observacion?: string }> = {};
ITEMS_PLANOS.forEach((it, i) => {
  if (conObs && i === 3) {
    respuestas[it.id] = {
      valor: "NO",
      observacion: "Prueba: documento vencido, requiere renovación.",
    };
  } else {
    respuestas[it.id] = { valor: "SI" };
  }
});

const hoy = new Date().toISOString().slice(0, 10);
const payload = {
  fechaInspeccion: hoy,
  pilotoNombre: conObs ? "Piloto Prueba (con obs)" : "Piloto Prueba",
  parqueNombre: "Parque Demo Norte",
  equipoRPA: "DJI Matrice 300",
  respuestas,
};

async function main() {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  console.log("HTTP", res.status);
  console.log(JSON.stringify(json, null, 2));
  process.exit(res.ok || res.status === 207 ? 0 : 1);
}

main();
