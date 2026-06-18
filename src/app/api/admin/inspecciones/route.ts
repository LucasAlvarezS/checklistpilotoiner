import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { construirWhere } from "@/lib/admin-filtros";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const sp = new URL(req.url).searchParams;
  const where = construirWhere(sp);

  const [items, parques, pilotos] = await Promise.all([
    prisma.inspeccion.findMany({
      where,
      orderBy: [{ fechaInspeccion: "desc" }, { creadoEn: "desc" }],
      take: 500,
      select: {
        id: true,
        fechaInspeccion: true,
        creadoEn: true,
        pilotoNombre: true,
        parqueNombre: true,
        equipoRPA: true,
        estado: true,
        pdfPath: true,
        respuestas: { where: { valor: "NO" }, select: { id: true } },
      },
    }),
    prisma.inspeccion.findMany({
      distinct: ["parqueNombre"],
      select: { parqueNombre: true },
      orderBy: { parqueNombre: "asc" },
    }),
    prisma.inspeccion.findMany({
      distinct: ["pilotoNombre"],
      select: { pilotoNombre: true },
      orderBy: { pilotoNombre: "asc" },
    }),
  ]);

  return NextResponse.json({
    items: items.map((i) => ({
      id: i.id,
      fechaInspeccion: i.fechaInspeccion,
      creadoEn: i.creadoEn,
      pilotoNombre: i.pilotoNombre,
      parqueNombre: i.parqueNombre,
      equipoRPA: i.equipoRPA,
      estado: i.estado,
      tienePdf: Boolean(i.pdfPath),
      totalNo: i.respuestas.length,
    })),
    parques: parques.map((p) => p.parqueNombre),
    pilotos: pilotos.map((p) => p.pilotoNombre),
  });
}
