import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { eliminarPdf } from "@/lib/storage";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const insp = await prisma.inspeccion.findUnique({
    where: { id },
    select: { pdfPath: true },
  });
  if (!insp) {
    return NextResponse.json({ error: "Inspección no encontrada." }, { status: 404 });
  }

  // Borra el PDF del bucket (si existe). No bloquea el borrado si falla.
  if (insp.pdfPath) {
    try {
      await eliminarPdf(insp.pdfPath);
    } catch (e) {
      console.error("No se pudo eliminar el PDF de Storage:", e);
    }
  }

  // Borra la inspección; las respuestas caen por onDelete: Cascade.
  try {
    await prisma.inspeccion.delete({ where: { id } });
  } catch (e) {
    console.error("Error al eliminar la inspección:", e);
    return NextResponse.json(
      { error: "No se pudo eliminar la inspección." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
