import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizarNumero, siguienteCodigo } from "@/lib/inspeccion";

export const runtime = "nodejs";

// Público (lo usa el piloto). Devuelve los códigos ya usados para una revisión
// y el siguiente disponible, para que no se repita el par (revisión, código).
export async function GET(req: Request) {
  const revisionRaw = new URL(req.url).searchParams.get("revision") ?? "";
  const revision = normalizarNumero(revisionRaw);
  if (!revision) {
    return NextResponse.json({ usados: [], siguiente: "01" });
  }

  const filas = await prisma.inspeccion.findMany({
    where: { revision },
    select: { codigo: true },
  });
  const usados = filas.map((f) => f.codigo).sort((a, b) => Number(a) - Number(b));

  return NextResponse.json({ usados, siguiente: siguienteCodigo(usados) });
}
