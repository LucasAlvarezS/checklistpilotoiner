import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { descargarPdf } from "@/lib/storage";
import {
  filasDesdeRespuestas,
  itemsEnNo,
  resumir,
  formatearFechaSolo,
} from "@/lib/inspeccion";
import { enviarCorreoInspeccion } from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
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
    include: { respuestas: true },
  });
  if (!insp) {
    return NextResponse.json({ error: "Inspección no encontrada." }, { status: 404 });
  }
  if (!insp.pdfPath) {
    return NextResponse.json(
      { error: "Esta inspección no tiene un PDF almacenado para reenviar." },
      { status: 409 },
    );
  }

  try {
    const pdf = await descargarPdf(insp.pdfPath);
    const filas = filasDesdeRespuestas(insp.respuestas);
    const resumen = resumir(filas);
    const noItems = itemsEnNo(filas);

    await enviarCorreoInspeccion({
      pilotoNombre: insp.pilotoNombre,
      parqueNombre: insp.parqueNombre,
      equipoRPA: insp.equipoRPA,
      fechaTexto: formatearFechaSolo(insp.fechaInspeccion),
      estado: insp.estado,
      itemsNo: noItems.map((f) => ({
        seccion: f.seccion,
        numero: f.numero,
        texto: f.texto,
        observacion: f.observacion,
      })),
      resumen,
      pdf,
      nombrePdf: insp.pdfPath.split("/").pop() ?? "informe.pdf",
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Error al reenviar correo:", e);
    return NextResponse.json(
      { error: "No se pudo reenviar el correo." },
      { status: 500 },
    );
  }
}
