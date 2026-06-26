import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { inspeccionSchema } from "@/lib/validation";
import {
  construirFilas,
  itemsEnNo,
  resumir,
  calcularEstado,
  formatearFechaSolo,
  fechaDesdeInput,
  nombrePdf,
} from "@/lib/inspeccion";
import { generarPdf } from "@/lib/pdf";
import { enviarCorreoInspeccion } from "@/lib/email";
import { subirPdf, storageDisponible } from "@/lib/storage";
import { Prisma } from "@prisma/client";

// La generación de PDF con Chromium requiere runtime Node (no Edge).
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }

  const parsed = inspeccionSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "La inspección tiene datos incompletos o inválidos.",
        detalles: parsed.error.issues.map((i) => ({
          campo: i.path.join("."),
          mensaje: i.message,
        })),
      },
      { status: 422 },
    );
  }

  const { pais, fechaInspeccion, respuestas } = parsed.data;
  const pilotoNombre = parsed.data.pilotoNombre;
  const parqueNombre = parsed.data.parqueNombre;
  const equipoRPA = parsed.data.equipoRPA;
  const clientId = parsed.data.clientId?.trim() || null;
  const fecha = fechaDesdeInput(fechaInspeccion); // fecha de operación (la ingresa el piloto)

  const filas = construirFilas(respuestas, pais);
  const estado = calcularEstado(filas);
  const resumen = resumir(filas);
  const noItems = itemsEnNo(filas);

  // Idempotencia: si esta inspección (por clientId) ya se guardó, no la repetimos
  // ni reenviamos el correo. Cubre los reintentos de la cola offline.
  if (clientId) {
    const existente = await prisma.inspeccion.findUnique({ where: { clientId } });
    if (existente) {
      return NextResponse.json({
        ok: true,
        inspeccionId: existente.id,
        correoEnviado: true,
        estado: existente.estado,
        duplicado: true,
      });
    }
  }

  // 1) Guardar en base de datos (fecha/hora, piloto, parque, todas las respuestas).
  let inspeccionId: string;
  try {
    const inspeccion = await prisma.inspeccion.create({
      data: {
        clientId,
        pais,
        fechaInspeccion: fecha,
        pilotoNombre,
        parqueNombre,
        equipoRPA,
        estado,
        respuestas: {
          create: filas.map((f) => ({
            etapa: f.etapa,
            seccion: f.seccion,
            numero: f.numero,
            item: f.texto,
            valor: f.valor,
            observacion: f.observacion || null,
          })),
        },
      },
    });
    inspeccionId = inspeccion.id;
  } catch (e) {
    // Carrera entre dos reintentos con el mismo clientId: el segundo choca con la
    // restricción única → ya existe, lo tratamos como envío exitoso (idempotente).
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002" &&
      clientId
    ) {
      const existente = await prisma.inspeccion.findUnique({ where: { clientId } });
      if (existente) {
        return NextResponse.json({
          ok: true,
          inspeccionId: existente.id,
          correoEnviado: true,
          estado: existente.estado,
          duplicado: true,
        });
      }
    }
    console.error("Error al guardar la inspección:", e);
    return NextResponse.json(
      { ok: false, error: "No se pudo guardar la inspección." },
      { status: 500 },
    );
  }

  // 2) Generar PDF, 3) subir a Storage y 4) enviar correo.
  //    Si falla el correo, la inspección ya quedó guardada.
  const archivoPdf = nombrePdf(parqueNombre, pilotoNombre, fecha);
  try {
    const pdf = await generarPdf({
      pais,
      pilotoNombre,
      parqueNombre,
      equipoRPA,
      fecha,
      estado,
      filas,
    });

    // Subir copia del informe a Supabase Storage (no rompe el flujo si falla).
    if (storageDisponible()) {
      try {
        const pdfPath = await subirPdf(inspeccionId, archivoPdf, pdf);
        await prisma.inspeccion.update({
          where: { id: inspeccionId },
          data: { pdfPath },
        });
      } catch (e) {
        console.error("No se pudo subir el PDF a Storage:", e);
      }
    }

    await enviarCorreoInspeccion({
      pilotoNombre,
      parqueNombre,
      equipoRPA,
      fechaTexto: formatearFechaSolo(fecha),
      estado,
      itemsNo: noItems.map((f) => ({
        seccion: f.seccion,
        numero: f.numero,
        texto: f.texto,
        observacion: f.observacion,
      })),
      resumen,
      pdf,
      nombrePdf: archivoPdf,
    });
  } catch (e) {
    console.error("Error al generar/enviar el correo:", e);
    return NextResponse.json(
      {
        ok: true,
        inspeccionId,
        correoEnviado: false,
        error:
          "La inspección se guardó, pero no se pudo enviar el correo al supervisor.",
      },
      { status: 207 },
    );
  }

  return NextResponse.json({
    ok: true,
    inspeccionId,
    correoEnviado: true,
    estado,
  });
}
