import { Prisma } from "@prisma/client";

/** Construye el filtro Prisma para el historial a partir de los query params. */
export function construirWhere(sp: URLSearchParams): Prisma.InspeccionWhereInput {
  const parque = sp.get("parque")?.trim();
  const piloto = sp.get("piloto")?.trim();
  const desde = sp.get("desde");
  const hasta = sp.get("hasta");

  const where: Prisma.InspeccionWhereInput = {};
  if (parque) where.parqueNombre = { contains: parque, mode: "insensitive" };
  if (piloto) where.pilotoNombre = { contains: piloto, mode: "insensitive" };
  if (desde || hasta) {
    where.fechaInspeccion = {};
    if (desde) where.fechaInspeccion.gte = new Date(`${desde}T00:00:00`);
    if (hasta) where.fechaInspeccion.lte = new Date(`${hasta}T23:59:59`);
  }
  return where;
}
