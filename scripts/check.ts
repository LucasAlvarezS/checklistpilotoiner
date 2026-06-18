import { prisma } from "../src/lib/db";

async function main() {
  // Limpia los registros de prueba creados durante el smoke test.
  const del = await prisma.inspeccion.deleteMany({
    where: { pilotoNombre: { startsWith: "Piloto Prueba" } },
  });
  const total = await prisma.inspeccion.count();
  console.log("Registros de prueba eliminados:", del.count);
  console.log("Inspecciones restantes en BD:", total);
  await prisma.$disconnect();
}
main();
