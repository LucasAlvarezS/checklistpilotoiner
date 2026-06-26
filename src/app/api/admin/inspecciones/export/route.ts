import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { construirWhere } from "@/lib/admin-filtros";
import { formatearFechaSolo, formatearFecha } from "@/lib/inspeccion";
import { nombrePais } from "@/lib/checklist-schema";

export const runtime = "nodejs";

const celda = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return new Response("No autorizado", { status: 401 });

  const where = construirWhere(new URL(req.url).searchParams);
  const items = await prisma.inspeccion.findMany({
    where,
    orderBy: [{ fechaInspeccion: "desc" }, { creadoEn: "desc" }],
    select: {
      pais: true,
      fechaInspeccion: true,
      creadoEn: true,
      pilotoNombre: true,
      parqueNombre: true,
      equipoRPA: true,
      estado: true,
      respuestas: { where: { valor: "NO" }, select: { id: true } },
    },
  });

  const encabezado = [
    "Fecha inspección",
    "Registrado",
    "País",
    "Piloto",
    "Parque",
    "Equipo/RPA",
    "Estado",
    "Ítems en NO",
  ];
  const filas = items.map((i) =>
    [
      formatearFechaSolo(i.fechaInspeccion),
      formatearFecha(i.creadoEn),
      nombrePais(i.pais),
      i.pilotoNombre,
      i.parqueNombre,
      i.equipoRPA,
      i.estado === "CON_OBSERVACIONES" ? "Con observaciones" : "Conforme",
      String(i.respuestas.length),
    ]
      .map(celda)
      .join(";"),
  );

  // BOM para que Excel reconozca UTF-8 (acentos correctos).
  const csv = "﻿" + [encabezado.map(celda).join(";"), ...filas].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inspecciones-iner.csv"`,
    },
  });
}
